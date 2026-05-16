import type { SupabaseClient } from "@supabase/supabase-js";
import { pointsForPrediction, type ScoringRulesRow } from "@/lib/scoring";

type PredictionRow = {
  id: string;
  user_id: string;
  pool_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  points_earned: number | null;
};

function outcomeFlags(
  rules: ScoringRulesRow,
  pred: PredictionRow,
  actualHome: number,
  actualAway: number
) {
  const { points, exact, correctResultOnly } = pointsForPrediction(
    rules,
    pred.predicted_home_score,
    pred.predicted_away_score,
    actualHome,
    actualAway
  );
  return { points, exact, correctResultOnly };
}

export async function recalculatePointsForMatch(
  supabase: SupabaseClient,
  matchId: string,
  newHome: number,
  newAway: number,
  previousHome: number | null,
  previousAway: number | null
): Promise<void> {
  const { data: predictions, error } = await supabase
    .from("predictions")
    .select("id, user_id, pool_id, predicted_home_score, predicted_away_score, points_earned")
    .eq("match_id", matchId);
  if (error) throw error;

  const preds = (predictions ?? []) as PredictionRow[];
  const poolIds = Array.from(new Set(preds.map((p) => p.pool_id)));

  const rulesMap = new Map<string, ScoringRulesRow>();
  for (const poolId of poolIds) {
    const { data: rules } = await supabase
      .from("scoring_rules")
      .select("exact_score_points, correct_result_points")
      .eq("pool_id", poolId)
      .maybeSingle();
    rulesMap.set(poolId, {
      exact_score_points: rules?.exact_score_points ?? 5,
      correct_result_points: rules?.correct_result_points ?? 2,
    });
  }

  for (const pred of preds) {
    const rules = rulesMap.get(pred.pool_id)!;

    const hadPrevious =
      previousHome != null && previousAway != null;

    const old = hadPrevious
      ? outcomeFlags(rules, pred, previousHome, previousAway)
      : { points: 0, exact: false, correctResultOnly: false };

    const neu = outcomeFlags(rules, pred, newHome, newAway);

    const deltaPoints = neu.points - old.points;
    const deltaExact = (neu.exact ? 1 : 0) - (old.exact ? 1 : 0);
    const deltaResult =
      (neu.correctResultOnly ? 1 : 0) - (old.correctResultOnly ? 1 : 0);

    await supabase
      .from("predictions")
      .update({
        points_earned: neu.points,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pred.id);

    if (deltaPoints !== 0 || deltaExact !== 0 || deltaResult !== 0) {
      await supabase.rpc("add_points_to_member", {
        p_pool_id: pred.pool_id,
        p_user_id: pred.user_id,
        p_points_delta: deltaPoints,
        p_exact_delta: deltaExact,
        p_result_delta: deltaResult,
      });
    }
  }

  for (const poolId of poolIds) {
    await supabase.rpc("recalculate_pool_rankings", { p_pool_id: poolId });
  }
}
