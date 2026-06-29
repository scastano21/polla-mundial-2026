import type { SupabaseClient } from "@supabase/supabase-js";
import { type ScoringRulesRow } from "@/lib/scoring";
import { rebuildGroupStandings } from "@/lib/rebuild-standings";

type PredictionRow = {
  id: string;
  user_id: string;
  pool_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  points_earned: number | null;
};

function flagsFromPointsEarned(
  earned: number | null,
  rules: ScoringRulesRow
): { points: number; exact: boolean; correctResultOnly: boolean } {
  const p = earned ?? 0;
  if (p === rules.exact_score_points) {
    return { points: p, exact: true, correctResultOnly: false };
  }
  if (p === rules.correct_result_points) {
    return { points: p, exact: false, correctResultOnly: true };
  }
  return { points: p, exact: false, correctResultOnly: false };
}

/**
 * Devuelve un partido a “programado”, quita marcador y revierte puntos de pronósticos.
 * Solo para pruebas / correcciones de admin.
 */
export async function resetMatchToScheduled(supabase: SupabaseClient, matchId: string): Promise<void> {
  const { data: match, error: mErr } = await supabase
    .from("matches")
    .select("id, home_score, away_score, home_penalties, away_penalties, status, group_letter, phases!inner(slug)")
    .eq("id", matchId)
    .single();

  if (mErr || !match) throw new Error("Partido no encontrado");
  if (match.status !== "finished") return;

  const prevHome = match.home_score;
  const prevAway = match.away_score;
  if (prevHome == null || prevAway == null) return;

  const rawPhase = match.phases as { slug: string } | { slug: string }[] | null;
  const phaseSlug = Array.isArray(rawPhase) ? rawPhase[0]?.slug : rawPhase?.slug;

  const { data: predictions, error: pErr } = await supabase
    .from("predictions")
    .select("id, user_id, pool_id, predicted_home_score, predicted_away_score, points_earned")
    .eq("match_id", matchId);
  if (pErr) throw pErr;

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
    const old = flagsFromPointsEarned(pred.points_earned, rules);

    await supabase
      .from("predictions")
      .update({
        points_earned: 0,
        is_locked: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pred.id);

    if (old.points !== 0 || old.exact || old.correctResultOnly) {
      await supabase.rpc("add_points_to_member", {
        p_pool_id: pred.pool_id,
        p_user_id: pred.user_id,
        p_points_delta: -old.points,
        p_exact_delta: old.exact ? -1 : 0,
        p_result_delta: old.correctResultOnly ? -1 : 0,
      });
    }
  }

  await supabase
    .from("matches")
    .update({
      home_score: null,
      away_score: null,
      home_penalties: null,
      away_penalties: null,
      status: "scheduled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId);

  if (phaseSlug === "groups" && match.group_letter) {
    await rebuildGroupStandings(supabase, match.group_letter);
  }

  for (const poolId of poolIds) {
    await supabase.rpc("recalculate_pool_rankings", { p_pool_id: poolId });
  }
}
