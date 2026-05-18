import type { SupabaseClient } from "@supabase/supabase-js";
import { tryCreateServiceClient } from "@/lib/supabase/service";

export type PoolLeaderboardRow = {
  user_id: string;
  username: string;
  display_name: string | null;
  total_points: number;
  exact_scores: number;
  correct_results: number;
  rank: number | null;
};

async function loadLeaderboardFromDb(
  client: SupabaseClient,
  poolId: string
): Promise<PoolLeaderboardRow[]> {
  const { data: members, error: mErr } = await client
    .from("pool_members")
    .select("user_id, total_points, exact_scores, correct_results, rank")
    .eq("pool_id", poolId)
    .order("total_points", { ascending: false });

  if (mErr || !members?.length) return [];

  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await client
    .from("profiles")
    .select("id, username, display_name")
    .in("id", userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return members.map((m) => {
    const p = profileMap.get(m.user_id);
    return {
      user_id: m.user_id,
      username: p?.username ?? "jugador",
      display_name: p?.display_name ?? null,
      total_points: m.total_points ?? 0,
      exact_scores: m.exact_scores ?? 0,
      correct_results: m.correct_results ?? 0,
      rank: m.rank,
    };
  });
}

/**
 * Miembros + nombres para tabla / transparencia.
 * Tras validar acceso en la ruta, service role evita RLS roto en producción.
 */
export async function fetchPoolLeaderboard(
  supabase: SupabaseClient,
  poolId: string
): Promise<PoolLeaderboardRow[]> {
  const svc = tryCreateServiceClient();
  if (svc) {
    return loadLeaderboardFromDb(svc, poolId);
  }

  const { data: viaRpc, error: rpcErr } = await supabase.rpc("list_pool_members", {
    p_pool_id: poolId,
  });

  if (!rpcErr && Array.isArray(viaRpc) && viaRpc.length > 0) {
    return viaRpc as PoolLeaderboardRow[];
  }

  if (rpcErr) {
    console.warn("[pool-leaderboard] list_pool_members:", rpcErr.message);
  }

  return loadLeaderboardFromDb(supabase, poolId);
}
