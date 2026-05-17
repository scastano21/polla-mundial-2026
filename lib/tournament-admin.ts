import type { SupabaseClient } from "@supabase/supabase-js";
import { tryCreateServiceClient } from "@/lib/supabase/service";

/** ¿Es admin del torneo (panel /admin)? Usa RPC SECURITY DEFINER; respaldo service role. */
export async function isTournamentAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: viaRpc, error: rpcErr } = await supabase.rpc("am_i_tournament_admin");
  if (!rpcErr && typeof viaRpc === "boolean") {
    return viaRpc;
  }

  const { data: row, error: selErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  if (!selErr && row?.is_admin) return true;

  const svc = tryCreateServiceClient();
  if (svc) {
    const { data } = await svc.from("profiles").select("is_admin").eq("id", userId).maybeSingle();
    return !!data?.is_admin;
  }

  return false;
}
