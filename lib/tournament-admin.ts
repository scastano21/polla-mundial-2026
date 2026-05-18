import type { SupabaseClient, User } from "@supabase/supabase-js";
import { tryCreateServiceClient } from "@/lib/supabase/service";

const ADMIN_EMAILS_ENV = "TOURNAMENT_ADMIN_EMAILS";

function adminEmailsFromEnv(): Set<string> {
  const raw = process.env[ADMIN_EMAILS_ENV]?.trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

/** Admin del torneo en JWT (no depende de RLS). */
export function isAdminFromUserMetadata(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.app_metadata?.tournament_admin === true) return true;
  if (user.user_metadata?.tournament_admin === true) return true;
  const email = user.email?.trim().toLowerCase();
  if (email && adminEmailsFromEnv().has(email)) return true;
  return false;
}

/** ¿Es admin del torneo (panel /admin)? */
export async function isTournamentAdmin(
  supabase: SupabaseClient,
  user: User
): Promise<boolean> {
  if (isAdminFromUserMetadata(user)) return true;

  const { data: viaRpc, error: rpcErr } = await supabase.rpc("am_i_tournament_admin");
  if (!rpcErr && typeof viaRpc === "boolean" && viaRpc) return true;

  const { data: row, error: selErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!selErr && row?.is_admin) return true;

  const svc = tryCreateServiceClient();
  if (svc) {
    const { data } = await svc.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
    if (data?.is_admin) return true;
  }

  return false;
}
