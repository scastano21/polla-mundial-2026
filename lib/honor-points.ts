import type { SupabaseClient } from "@supabase/supabase-js";

export type HonorOfficial = {
  champion_team_id: string | null;
  runner_up_team_id: string | null;
  third_place_team_id: string | null;
  top_scorer_name: string | null;
  best_player_name: string | null;
  best_goalkeeper_name: string | null;
  best_young_player_name: string | null;
};

export type HonorPred = {
  user_id: string;
  pool_id: string;
  champion_team_id: string | null;
  runner_up_team_id: string | null;
  third_place_team_id: string | null;
  top_scorer_name: string | null;
  best_player_name: string | null;
  best_goalkeeper_name: string | null;
  best_young_player_name: string | null;
  points_earned: number | null;
};

export type HonorRules = {
  correct_champion: number;
  correct_runner_up: number;
  correct_third_place: number;
  correct_top_scorer: number;
  correct_best_player: number;
  correct_best_goalkeeper: number;
  correct_best_young: number;
};

import { honorNamesMatch } from "@/lib/scoring";
import { rebuildMemberTotals } from "@/lib/rebuild-member-totals";

export function computeHonorPoints(rules: HonorRules, pred: HonorPred, off: HonorOfficial): number {
  let pts = 0;
  if (pred.champion_team_id && pred.champion_team_id === off.champion_team_id) {
    pts += rules.correct_champion;
  }
  if (pred.runner_up_team_id && pred.runner_up_team_id === off.runner_up_team_id) {
    pts += rules.correct_runner_up;
  }
  if (pred.third_place_team_id && pred.third_place_team_id === off.third_place_team_id) {
    pts += rules.correct_third_place;
  }
  if (honorNamesMatch(pred.top_scorer_name, off.top_scorer_name)) pts += rules.correct_top_scorer;
  if (honorNamesMatch(pred.best_player_name, off.best_player_name)) pts += rules.correct_best_player;
  if (honorNamesMatch(pred.best_goalkeeper_name, off.best_goalkeeper_name)) {
    pts += rules.correct_best_goalkeeper;
  }
  if (honorNamesMatch(pred.best_young_player_name, off.best_young_player_name)) {
    pts += rules.correct_best_young;
  }
  return pts;
}

export async function applyHonorFinalScoring(
  supabase: SupabaseClient,
  official: HonorOfficial
): Promise<void> {
  const { data: preds } = await supabase.from("honor_predictions").select("*");
  const predictions = (preds ?? []) as HonorPred[];

  const poolIds = new Set<string>();

  for (const pred of predictions) {
    const { data: rulesRow } = await supabase
      .from("scoring_rules")
      .select(
        "correct_champion, correct_runner_up, correct_third_place, correct_top_scorer, correct_best_player, correct_best_goalkeeper, correct_best_young"
      )
      .eq("pool_id", pred.pool_id)
      .maybeSingle();

    const rules: HonorRules = {
      correct_champion: rulesRow?.correct_champion ?? 10,
      correct_runner_up: rulesRow?.correct_runner_up ?? 5,
      correct_third_place: rulesRow?.correct_third_place ?? 3,
      correct_top_scorer: rulesRow?.correct_top_scorer ?? 5,
      correct_best_player: rulesRow?.correct_best_player ?? 3,
      correct_best_goalkeeper: rulesRow?.correct_best_goalkeeper ?? 3,
      correct_best_young: rulesRow?.correct_best_young ?? 2,
    };

    const newPts = computeHonorPoints(rules, pred, official);

    const { error } = await supabase
      .from("honor_predictions")
      .update({ points_earned: newPts, updated_at: new Date().toISOString() })
      .eq("user_id", pred.user_id)
      .eq("pool_id", pred.pool_id);
    if (error) throw error;

    poolIds.add(pred.pool_id);
  }

  // Reconstruir totales desde componentes (no deltas) para evitar doble conteo.
  for (const poolId of Array.from(poolIds)) {
    await rebuildMemberTotals(supabase, { poolId });
  }
}
