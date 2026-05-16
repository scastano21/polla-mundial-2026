import { createServiceClient } from "@/lib/supabase/service";
import { createServerSupabase } from "@/lib/supabase/server";

export type InvitePoolRow = {
  id: string;
  name: string;
  invite_code: string;
  max_members: number | null;
  is_premium: boolean | null;
  admin_id: string;
  member_count: number;
};

/** Busca polla por código: RPC si existe; si no, consulta con service role (solo servidor). */
export async function lookupPoolByInviteCode(
  rawCode: string
): Promise<{ pool: InvitePoolRow | null; setupError: string | null }> {
  const code = rawCode.trim().toUpperCase();
  const supabase = await createServerSupabase();

  const { data: inviteRows, error: inviteErr } = await supabase.rpc("pool_by_invite_code", {
    p_code: code,
  });

  if (!inviteErr) {
    const row = (Array.isArray(inviteRows) ? inviteRows[0] : null) as InvitePoolRow | null;
    return { pool: row, setupError: null };
  }

  const needsFallback =
    inviteErr.message.includes("pool_by_invite_code") ||
    inviteErr.message.includes("schema cache");

  if (!needsFallback) {
    return { pool: null, setupError: inviteErr.message };
  }

  try {
    const svc = createServiceClient();
    const { data: p, error: poolErr } = await svc
      .from("pools")
      .select("id, name, invite_code, max_members, is_premium, admin_id")
      .eq("invite_code", code)
      .maybeSingle();

    if (poolErr || !p) {
      return { pool: null, setupError: null };
    }

    const { count } = await svc
      .from("pool_members")
      .select("*", { count: "exact", head: true })
      .eq("pool_id", p.id);

    return {
      pool: {
        ...p,
        member_count: count ?? 0,
      },
      setupError: null,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al buscar la polla";
    return { pool: null, setupError: msg };
  }
}
