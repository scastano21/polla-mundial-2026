import {
  buildPredictionProjection,
  type KnockoutPredictionScores,
} from "@/lib/bracket/predicted-projection";
import {
  KNOCKOUT_PROJECTION_SCORING_MIN,
  pairAtMatchNumber,
  projectedPairMatchesOfficial,
} from "@/lib/bracket/knockout-projection-eligibility";

type MatchRow = {
  id: string;
  match_number: number;
  home_team_id: string | null;
  away_team_id: string | null;
  group_letter: string | null;
};

type PredictionInput = {
  user_id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  predicted_advance_team_id: string | null;
};

/** userId → matchIds donde puede sumar por marcador según reglas actuales. */
export function buildMatchScoreEligibility(
  matches: MatchRow[],
  predictions: PredictionInput[]
): Map<string, Set<string>> {
  const byUser = new Map<string, PredictionInput[]>();
  for (const p of predictions) {
    if (!byUser.has(p.user_id)) byUser.set(p.user_id, []);
    byUser.get(p.user_id)!.push(p);
  }

  const result = new Map<string, Set<string>>();

  for (const [userId, rows] of Array.from(byUser.entries())) {
    const predMap = new Map<string, KnockoutPredictionScores>();
    for (const p of rows) {
      predMap.set(p.match_id, {
        home: p.predicted_home_score,
        away: p.predicted_away_score,
        advanceTeamId: p.predicted_advance_team_id,
      });
    }

    const projection = buildPredictionProjection(matches, predMap);
    const eligible = new Set<string>();

    for (const m of matches) {
      if (m.match_number < KNOCKOUT_PROJECTION_SCORING_MIN) {
        eligible.add(m.id);
        continue;
      }
      const projected = pairAtMatchNumber(projection.knockoutPairs, m.match_number);
      if (
        projectedPairMatchesOfficial(projected, m.home_team_id, m.away_team_id)
      ) {
        eligible.add(m.id);
      }
    }

    result.set(userId, eligible);
  }

  return result;
}

export function isMatchScoreEligible(
  eligibility: Map<string, Set<string>>,
  userId: string,
  matchId: string
): boolean {
  return eligibility.get(userId)?.has(matchId) ?? false;
}
