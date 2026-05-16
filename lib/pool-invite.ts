import { createServiceClient } from "@/lib/supabase/service";
import { createServerSupabase } from "@/lib/supabase/server";

export type InvitePoolRow = {
  id: string;
  name: string;
  invite_code: string;
  max_members: number | null;
  is_premium?: boolean | null;
  admin_id: string;
  member_count: number;
};

function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

async function lookupWithService(code: string): Promise<InvitePoolRow | null> {
  const svc = createServiceClient();
  const baseSelect = "id, name, invite_code, max_members, admin_id";

  let { data: p } = await svc
    .from("pools")
    .select(baseSelect)
    .eq("invite_code", code)
    .maybeSingle();

  if (!p) {
    const { data: rows } = await svc
      .from("pools")
      .select(baseSelect)
      .ilike("invite_code", code)
      .limit(1);
    p = rows?.[0] ?? null;
  }

  if (!p) return null;

  const { count } = await svc
    .from("pool_members")
    .select("*", { count: "exact", head: true })
    .eq("pool_id", p.id);

  return {
    ...p,
    is_premium: false,
    member_count: count ?? 0,
  };
}

/** Busca polla por código (service role primero; RPC como respaldo). */
export async function lookupPoolByInviteCode(
  rawCode: string
): Promise<{ pool: InvitePoolRow | null; setupError: string | null }> {
  const code = normalizeInviteCode(rawCode);
  if (code.length < 4) {
    return { pool: null, setupError: null };
  }

  try {
    const fromSvc = await lookupWithService(code);
    if (fromSvc) return { pool: fromSvc, setupError: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return { pool: null, setupError: msg };
    }
  }

  const supabase = await createServerSupabase();
  const { data: inviteRows, error: inviteErr } = await supabase.rpc("pool_by_invite_code", {
    p_code: code,
  });

  if (!inviteErr) {
    const row = (Array.isArray(inviteRows) ? inviteRows[0] : null) as InvitePoolRow | null;
    return { pool: row, setupError: null };
  }

  if (
    inviteErr.message.includes("pool_by_invite_code") ||
    inviteErr.message.includes("schema cache")
  ) {
    return {
      pool: null,
      setupError:
        "Falta configurar Supabase: ejecuta supabase/FIX_PRODUCTION.sql y añade SUPABASE_SERVICE_ROLE_KEY en Vercel.",
    };
  }

  return { pool: null, setupError: inviteErr.message };
}
