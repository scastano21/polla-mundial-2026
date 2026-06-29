import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildPredictionProjection,
  type KnockoutPredictionScores,
} from "@/lib/bracket/predicted-projection";
import {
  countAdvancementHits,
  isAdvancementRoundReady,
  KNOCKOUT_ADVANCEMENT_ROUNDS,
  teamsInMatchNumberRange,
} from "@/lib/bracket/knockout-projection-eligibility";

type MatchRow = {
  id: string;
  match_number: number;
  group_letter: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
};

type PredictionRow = {
  user_id: string;
  pool_id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  predicted_advance_team_id: string | null;
};

function computeAdvancementPoints(
  matches: MatchRow[],
  predictions: Map<string, KnockoutPredictionScores>,
  pointsPerTeam: number
): number {
  if (pointsPerTeam <= 0) return 0;

  const officialPairs = matches
    .filter((m) => m.match_number >= 73 && m.match_number <= 104)
    .map((m) => ({
      match_number: m.match_number,
      home_team_id: m.home_team_id,
      away_team_id: m.away_team_id,
    }));

  const projection = buildPredictionProjection(matches, predictions);
  const predictedPairs = projection.knockoutPairs;

  let total = 0;
  for (const round of KNOCKOUT_ADVANCEMENT_ROUNDS) {
    if (!isAdvancementRoundReady(round, matches)) continue;
    const official = teamsInMatchNumberRange(officialPairs, round.min, round.max);
    if (official.size === 0) continue;
    const predicted = teamsInMatchNumberRange(predictedPairs, round.min, round.max);
    total += countAdvancementHits(official, predicted, pointsPerTeam);
  }
  return total;
}

/**
 * Puntos por equipos que el usuario tenía en una ronda KO (según su proyección)
 * y que oficialmente están en esa misma ronda (p. ej. +3 por cada clasificado a dieciseisavos).
 */
export async function recalculateAdvancementPoints(
  supabase: SupabaseClient,
  options?: { poolId?: string; userId?: string }
): Promise<void> {
  const { data: matches, error: mErr } = await supabase
    .from("matches")
    .select(
      "id, match_number, group_letter, home_team_id, away_team_id, status, home_score, away_score"
    )
    .order("match_number");
  if (mErr) throw mErr;
  const matchRows = (matches ?? []) as MatchRow[];

  let predQuery = supabase
    .from("predictions")
    .select(
      "user_id, pool_id, match_id, predicted_home_score, predicted_away_score, predicted_advance_team_id"
    );
  if (options?.poolId) predQuery = predQuery.eq("pool_id", options.poolId);
  if (options?.userId) predQuery = predQuery.eq("user_id", options.userId);

  const { data: predRows, error: pErr } = await predQuery;
  if (pErr) throw pErr;

  const predsByUserPool = new Map<string, PredictionRow[]>();
  for (const p of (predRows ?? []) as PredictionRow[]) {
    const key = `${p.pool_id}:${p.user_id}`;
    if (!predsByUserPool.has(key)) predsByUserPool.set(key, []);
    predsByUserPool.get(key)!.push(p);
  }

  const poolIds = options?.poolId
    ? [options.poolId]
    : Array.from(new Set((predRows ?? []).map((p) => p.pool_id)));

  for (const poolId of poolIds) {
    const { data: rules } = await supabase
      .from("scoring_rules")
      .select("advancement_team_points")
      .eq("pool_id", poolId)
      .maybeSingle();
    const pointsPerTeam = rules?.advancement_team_points ?? 3;

    let membersQuery = supabase
      .from("pool_members")
      .select("user_id, advancement_points")
      .eq("pool_id", poolId);
    if (options?.userId) membersQuery = membersQuery.eq("user_id", options.userId);

    const { data: members, error: memErr } = await membersQuery;
    if (memErr) throw memErr;

    for (const member of members ?? []) {
      const key = `${poolId}:${member.user_id}`;
      const rows = predsByUserPool.get(key) ?? [];
      const predMap = new Map<string, KnockoutPredictionScores>();
      for (const p of rows) {
        predMap.set(p.match_id, {
          home: p.predicted_home_score,
          away: p.predicted_away_score,
          advanceTeamId: p.predicted_advance_team_id,
        });
      }

      const newPoints = computeAdvancementPoints(matchRows, predMap, pointsPerTeam);
      const oldPoints = member.advancement_points ?? 0;
      const delta = newPoints - oldPoints;

      if (delta === 0 && newPoints === oldPoints) continue;

      await supabase
        .from("pool_members")
        .update({ advancement_points: newPoints })
        .eq("pool_id", poolId)
        .eq("user_id", member.user_id);

      if (delta !== 0) {
        await supabase.rpc("add_points_to_member", {
          p_pool_id: poolId,
          p_user_id: member.user_id,
          p_points_delta: delta,
          p_exact_delta: 0,
          p_result_delta: 0,
        });
      }
    }

    await supabase.rpc("recalculate_pool_rankings", { p_pool_id: poolId });
  }
}
