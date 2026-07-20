import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllPredictions } from "@/lib/fetch-all-predictions";

const PAGE = 1000;

async function poolIdsToProcess(
  supabase: SupabaseClient,
  poolId?: string
): Promise<string[]> {
  if (poolId) return [poolId];

  const ids = new Set<string>();
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("pool_members")
      .select("pool_id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const page = data ?? [];
    for (const row of page) ids.add(row.pool_id);
    if (page.length < PAGE) break;
    from += PAGE;
  }
  return Array.from(ids);
}

/**
 * Reconstruye total_points = suma(predictions.points_earned) + advancement_points + honor.points_earned.
 * Evita totales inflados por deltas duplicados de honor/clasificados.
 */
export async function rebuildMemberTotals(
  supabase: SupabaseClient,
  options?: { poolId?: string; userId?: string }
): Promise<{ pools: number; membersUpdated: number }> {
  const poolIds = await poolIdsToProcess(supabase, options?.poolId);
  let membersUpdated = 0;

  for (const poolId of poolIds) {
    const preds = await fetchAllPredictions(supabase, {
      poolId,
      userId: options?.userId,
    });

    const predPts = new Map<string, number>();
    for (const p of preds) {
      predPts.set(p.user_id, (predPts.get(p.user_id) ?? 0) + (p.points_earned ?? 0));
    }

    let honorQuery = supabase
      .from("honor_predictions")
      .select("user_id, points_earned")
      .eq("pool_id", poolId);
    if (options?.userId) honorQuery = honorQuery.eq("user_id", options.userId);
    const { data: honors, error: hErr } = await honorQuery;
    if (hErr) throw hErr;

    const honorPts = new Map<string, number>();
    for (const h of honors ?? []) {
      honorPts.set(h.user_id, h.points_earned ?? 0);
    }

    let membersQuery = supabase
      .from("pool_members")
      .select("user_id, total_points, advancement_points")
      .eq("pool_id", poolId);
    if (options?.userId) membersQuery = membersQuery.eq("user_id", options.userId);

    const { data: members, error: mErr } = await membersQuery;
    if (mErr) throw mErr;

    for (const member of members ?? []) {
      const next =
        (predPts.get(member.user_id) ?? 0) +
        (member.advancement_points ?? 0) +
        (honorPts.get(member.user_id) ?? 0);

      if (next === (member.total_points ?? 0)) continue;

      const { error: uErr } = await supabase
        .from("pool_members")
        .update({ total_points: next })
        .eq("pool_id", poolId)
        .eq("user_id", member.user_id);
      if (uErr) throw uErr;
      membersUpdated += 1;
    }

    await supabase.rpc("recalculate_pool_rankings", { p_pool_id: poolId });
  }

  return { pools: poolIds.length, membersUpdated };
}
