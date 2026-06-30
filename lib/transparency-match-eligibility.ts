import {
  buildPredictionProjection,
  type KnockoutPredictionScores,
} from "@/lib/bracket/predicted-projection";
import {
  KNOCKOUT_ADVANCEMENT_BONUS_EXCLUDE,
  KNOCKOUT_ADVANCEMENT_ROUNDS,
  KNOCKOUT_PROJECTION_SCORING_MIN,
  isAdvancementRoundReady,
  pairAtMatchNumber,
  projectedPairMatchesOfficial,
  teamsInMatchNumberRange,
} from "@/lib/bracket/knockout-projection-eligibility";

type MatchRow = {
  id: string;
  match_number: number;
  home_team_id: string | null;
  away_team_id: string | null;
  group_letter: string | null;
  status?: string;
  home_score?: number | null;
  away_score?: number | null;
};

type PredictionInput = {
  user_id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  predicted_advance_team_id: string | null;
};

function roundForMatchNumber(matchNumber: number) {
  return KNOCKOUT_ADVANCEMENT_ROUNDS.find(
    (r) => matchNumber >= r.min && matchNumber <= r.max
  );
}

function advancementHitTeamsForRound(
  matches: MatchRow[],
  projectedPairs: { match_number: number; home_team_id: string | null; away_team_id: string | null }[],
  round: (typeof KNOCKOUT_ADVANCEMENT_ROUNDS)[number]
): Set<string> | null {
  if (!isAdvancementRoundReady(round, matches)) return null;

  const official = teamsInMatchNumberRange(matches, round.min, round.max);
  if (official.size === 0) return null;

  const predicted = teamsInMatchNumberRange(projectedPairs, round.min, round.max);
  const hits = new Set<string>();
  official.forEach((id) => {
    if (predicted.has(id)) hits.add(id);
  });
  return hits;
}

/** userId → matchIds donde puede sumar puntos (marcador y/o clasificado +3). */
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

    const advancementByRound = new Map<string, Set<string>>();
    for (const round of KNOCKOUT_ADVANCEMENT_ROUNDS) {
      const hits = advancementHitTeamsForRound(matches, projection.knockoutPairs, round);
      if (hits) advancementByRound.set(round.id, hits);
    }

    for (const m of matches) {
      if (!predMap.has(m.id)) continue;

      if (m.match_number < KNOCKOUT_PROJECTION_SCORING_MIN) {
        eligible.add(m.id);
        continue;
      }

      const projected = pairAtMatchNumber(projection.knockoutPairs, m.match_number);
      const marcador = projectedPairMatchesOfficial(
        projected,
        m.home_team_id,
        m.away_team_id
      );

      let advancement = false;
      if (!KNOCKOUT_ADVANCEMENT_BONUS_EXCLUDE.has(m.match_number)) {
        const round = roundForMatchNumber(m.match_number);
        const hitTeams = round ? advancementByRound.get(round.id) : undefined;
        if (hitTeams) {
          advancement =
            (m.home_team_id != null && hitTeams.has(m.home_team_id)) ||
            (m.away_team_id != null && hitTeams.has(m.away_team_id));
        }
      }

      if (marcador || advancement) {
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
