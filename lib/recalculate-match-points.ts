import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildPredictionProjection,
  type KnockoutPredictionScores,
} from "@/lib/bracket/predicted-projection";
import {
  KNOCKOUT_PROJECTION_SCORING_MIN,
  pairAtMatchNumber,
  projectedPairMatchesOfficial,
} from "@/lib/bracket/knockout-projection-eligibility";
import { fetchAllPredictions } from "@/lib/fetch-all-predictions";
import { pointsForPrediction, type ScoringRulesRow } from "@/lib/scoring";

type PredictionRow = {
  id: string;
  user_id: string;
  pool_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  points_earned: number | null;
};

type MatchRow = {
  id: string;
  match_number: number;
  home_team_id: string | null;
  away_team_id: string | null;
};

type AllMatchRow = MatchRow & {
  group_letter: string | null;
};

type StoredPredictionRow = {
  user_id: string;
  pool_id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  predicted_advance_team_id: string | null;
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

function buildPredMap(rows: StoredPredictionRow[]): Map<string, KnockoutPredictionScores> {
  const predMap = new Map<string, KnockoutPredictionScores>();
  for (const p of rows) {
    predMap.set(p.match_id, {
      home: p.predicted_home_score,
      away: p.predicted_away_score,
      advanceTeamId: p.predicted_advance_team_id,
    });
  }
  return predMap;
}

function isKnockoutProjectionEligible(
  allMatches: AllMatchRow[],
  predictionsByUserPool: Map<string, StoredPredictionRow[]>,
  poolId: string,
  userId: string,
  matchNumber: number,
  officialHome: string | null,
  officialAway: string | null
): boolean {
  const key = `${poolId}:${userId}`;
  const rows = predictionsByUserPool.get(key) ?? [];
  const projection = buildPredictionProjection(allMatches, buildPredMap(rows));
  const projected = pairAtMatchNumber(projection.knockoutPairs, matchNumber);
  return projectedPairMatchesOfficial(projected, officialHome, officialAway);
}

export async function recalculatePointsForMatch(
  supabase: SupabaseClient,
  matchId: string,
  newHome: number,
  newAway: number,
  previousHome: number | null,
  previousAway: number | null
): Promise<void> {
  const { data: match, error: matchErr } = await supabase
    .from("matches")
    .select("id, match_number, home_team_id, away_team_id")
    .eq("id", matchId)
    .single();
  if (matchErr || !match) throw matchErr ?? new Error("Partido no encontrado");

  const matchRow = match as MatchRow;
  const usesProjection = matchRow.match_number >= KNOCKOUT_PROJECTION_SCORING_MIN;

  const { data: predictions, error } = await supabase
    .from("predictions")
    .select(
      "id, user_id, pool_id, predicted_home_score, predicted_away_score, points_earned"
    )
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

  let allMatches: AllMatchRow[] = [];
  const predictionsByUserPool = new Map<string, StoredPredictionRow[]>();

  if (usesProjection && preds.length > 0) {
    const { data: matchRows, error: mErr } = await supabase
      .from("matches")
      .select("id, match_number, group_letter, home_team_id, away_team_id")
      .order("match_number");
    if (mErr) throw mErr;
    allMatches = (matchRows ?? []) as AllMatchRow[];

    const allPredRows = await fetchAllPredictions(supabase, { poolIds });

    for (const p of allPredRows as StoredPredictionRow[]) {
      const key = `${p.pool_id}:${p.user_id}`;
      if (!predictionsByUserPool.has(key)) predictionsByUserPool.set(key, []);
      predictionsByUserPool.get(key)!.push(p);
    }
  }

  const hadPrevious = previousHome != null && previousAway != null;
  const sameScore = hadPrevious && previousHome === newHome && previousAway === newAway;

  for (const pred of preds) {
    const rules = rulesMap.get(pred.pool_id)!;

    const old = sameScore
      ? flagsFromPointsEarned(pred.points_earned, rules)
      : hadPrevious
        ? outcomeFlags(rules, pred, previousHome!, previousAway!)
        : { points: 0, exact: false, correctResultOnly: false };

    const eligible =
      !usesProjection ||
      isKnockoutProjectionEligible(
        allMatches,
        predictionsByUserPool,
        pred.pool_id,
        pred.user_id,
        matchRow.match_number,
        matchRow.home_team_id,
        matchRow.away_team_id
      );

    const neu = eligible
      ? outcomeFlags(rules, pred, newHome, newAway)
      : { points: 0, exact: false, correctResultOnly: false };

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

/** Recalcula puntos de todos los partidos KO ya cerrados (p. ej. tras cambiar reglas de proyección). */
export async function recalculateAllFinishedKnockoutMatchPoints(
  supabase: SupabaseClient
): Promise<{ matches: number }> {
  const { data: matches, error } = await supabase
    .from("matches")
    .select("id, home_score, away_score")
    .gte("match_number", KNOCKOUT_PROJECTION_SCORING_MIN)
    .eq("status", "finished")
    .not("home_score", "is", null)
    .not("away_score", "is", null)
    .order("match_number");

  if (error) throw error;

  for (const m of matches ?? []) {
    await recalculatePointsForMatch(
      supabase,
      m.id,
      m.home_score!,
      m.away_score!,
      m.home_score,
      m.away_score
    );
  }

  return { matches: matches?.length ?? 0 };
}
