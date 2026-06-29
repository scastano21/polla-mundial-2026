import type { SupabaseClient } from "@supabase/supabase-js";

const PAGE_SIZE = 1000;

export type PredictionQueryRow = {
  user_id: string;
  pool_id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  predicted_advance_team_id: string | null;
};

/** Supabase devuelve como máximo 1000 filas por consulta; paginar siempre. */
export async function fetchAllPredictions(
  supabase: SupabaseClient,
  filters: { poolId?: string; poolIds?: string[]; userId?: string; matchId?: string }
): Promise<PredictionQueryRow[]> {
  const rows: PredictionQueryRow[] = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from("predictions")
      .select(
        "user_id, pool_id, match_id, predicted_home_score, predicted_away_score, predicted_advance_team_id"
      );
    if (filters.poolId) query = query.eq("pool_id", filters.poolId);
    if (filters.poolIds?.length) query = query.in("pool_id", filters.poolIds);
    if (filters.userId) query = query.eq("user_id", filters.userId);
    if (filters.matchId) query = query.eq("match_id", filters.matchId);

    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) throw error;

    const page = (data ?? []) as PredictionQueryRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}
