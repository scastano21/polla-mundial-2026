import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient, tryCreateServiceClient } from "@/lib/supabase/service";

export type PoolLeaderboardRow = {
  user_id: string;
  username: string;
  display_name: string | null;
  total_points: number;
  exact_scores: number;
  correct_results: number;
  rank: number | null;
};

type MemberWithProfile = {
  user_id: string;
  total_points: number | null;
  exact_scores: number | null;
  correct_results: number | null;
  rank: number | null;
  profiles:
    | { username: string; display_name: string | null }
    | { username: string; display_name: string | null }[]
    | null;
};

function compareLeaderboard(a: PoolLeaderboardRow, b: PoolLeaderboardRow): number {
  if (b.total_points !== a.total_points) return b.total_points - a.total_points;
  return b.exact_scores - a.exact_scores;
}

function sortLeaderboardRows(rows: PoolLeaderboardRow[]): PoolLeaderboardRow[] {
  return [...rows].sort(compareLeaderboard);
}

function mapRows(members: MemberWithProfile[]): PoolLeaderboardRow[] {
  return members.map((m) => {
    const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return {
      user_id: m.user_id,
      username: prof?.username ?? "jugador",
      display_name: prof?.display_name ?? null,
      total_points: m.total_points ?? 0,
      exact_scores: m.exact_scores ?? 0,
      correct_results: m.correct_results ?? 0,
      rank: m.rank,
    };
  });
}

export async function loadLeaderboardFromDb(
  client: SupabaseClient,
  poolId: string
): Promise<PoolLeaderboardRow[]> {
  const { data: embedded, error: embedErr } = await client
    .from("pool_members")
    .select(
      `
      user_id,
      total_points,
      exact_scores,
      correct_results,
      rank,
      profiles ( username, display_name )
    `
    )
    .eq("pool_id", poolId)
    .order("total_points", { ascending: false })
    .order("exact_scores", { ascending: false });

  if (!embedErr && embedded?.length) {
    return sortLeaderboardRows(mapRows(embedded as MemberWithProfile[]));
  }

  const { data: members, error: mErr } = await client
    .from("pool_members")
    .select("user_id, total_points, exact_scores, correct_results, rank")
    .eq("pool_id", poolId)
    .order("total_points", { ascending: false })
    .order("exact_scores", { ascending: false });

  if (mErr || !members?.length) {
    if (embedErr) console.warn("[pool-leaderboard] embed:", embedErr.message);
    if (mErr) console.warn("[pool-leaderboard] members:", mErr.message);
    return [];
  }

  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await client
    .from("profiles")
    .select("id, username, display_name")
    .in("id", userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return sortLeaderboardRows(
    members.map((m) => {
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
    })
  );
}

/**
 * Lista miembros de una polla (solo llamar tras validar que el viewer puede entrar).
 * En Vercel hace falta SUPABASE_SERVICE_ROLE_KEY para saltar RLS roto.
 */
export async function fetchPoolLeaderboard(
  supabase: SupabaseClient,
  poolId: string
): Promise<PoolLeaderboardRow[]> {
  try {
    const svc = createServiceClient();
    const rows = await loadLeaderboardFromDb(svc, poolId);
    if (rows.length > 0) return rows;
  } catch (e) {
    console.error(
      "[pool-leaderboard] Sin service role o error:",
      e instanceof Error ? e.message : e
    );
  }

  const svc = tryCreateServiceClient();
  if (svc) {
    const rows = await loadLeaderboardFromDb(svc, poolId);
    if (rows.length > 0) return rows;
  }

  const { data: viaRpc, error: rpcErr } = await supabase.rpc("list_pool_members", {
    p_pool_id: poolId,
  });

  if (!rpcErr && Array.isArray(viaRpc) && viaRpc.length > 0) {
    return sortLeaderboardRows(viaRpc as PoolLeaderboardRow[]);
  }

  if (rpcErr) {
    console.warn("[pool-leaderboard] list_pool_members:", rpcErr.message);
  }

  return loadLeaderboardFromDb(supabase, poolId);
}

/** Cuenta real en BD (service role). */
export async function countPoolMembers(poolId: string): Promise<number | null> {
  try {
    const svc = createServiceClient();
    const { count, error } = await svc
      .from("pool_members")
      .select("*", { count: "exact", head: true })
      .eq("pool_id", poolId);
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}
