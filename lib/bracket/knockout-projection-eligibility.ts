import type { KnockoutPair, KnockoutPredictionScores } from "@/lib/bracket/predicted-projection";

/** Desde dieciseisavos (partidos 73–104). */
export const KNOCKOUT_PROJECTION_SCORING_MIN = 73;

/** Tercer puesto: no suma bonus por «pase de ronda». */
export const KNOCKOUT_ADVANCEMENT_BONUS_EXCLUDE = new Set([103]);

export function sameTeamPair(
  homeA: string | null,
  awayA: string | null,
  homeB: string | null,
  awayB: string | null
): boolean {
  if (!homeA || !awayA || !homeB || !awayB) return false;
  const teams = new Set([homeA, awayA]);
  return teams.has(homeB) && teams.has(awayB);
}

export function projectedPairMatchesOfficial(
  projected: KnockoutPair | undefined,
  officialHome: string | null,
  officialAway: string | null
): boolean {
  if (!projected) return false;
  return sameTeamPair(
    projected.home_team_id,
    projected.away_team_id,
    officialHome,
    officialAway
  );
}

export function winnerFromPrediction(
  homeId: string | null,
  awayId: string | null,
  pred: KnockoutPredictionScores
): string | null {
  if (!homeId || !awayId) return null;
  if (pred.home > pred.away) return homeId;
  if (pred.away > pred.home) return awayId;
  if (pred.home === pred.away && pred.advanceTeamId) {
    if (pred.advanceTeamId === homeId || pred.advanceTeamId === awayId) {
      return pred.advanceTeamId;
    }
  }
  return null;
}

export function winnerFromFinishedMatch(match: {
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  home_penalties?: number | null;
  away_penalties?: number | null;
  status?: string;
}): string | null {
  if (match.status && match.status !== "finished") return null;
  if (match.home_score == null || match.away_score == null) return null;
  if (!match.home_team_id || !match.away_team_id) return null;

  if (match.home_score > match.away_score) return match.home_team_id;
  if (match.home_score < match.away_score) return match.away_team_id;

  const hp = match.home_penalties ?? 0;
  const ap = match.away_penalties ?? 0;
  if (hp > ap) return match.home_team_id;
  if (ap > hp) return match.away_team_id;
  return null;
}

export function pairAtMatchNumber(
  pairs: KnockoutPair[],
  matchNumber: number
): KnockoutPair | undefined {
  return pairs.find((p) => p.match_number === matchNumber);
}

/** Rangos de partidos para puntos por clasificado en cada ronda KO. */
export const KNOCKOUT_ADVANCEMENT_ROUNDS = [
  { id: "r32", label: "Dieciseisavos", min: 73, max: 88 },
  { id: "r16", label: "Octavos", min: 89, max: 96 },
  { id: "qf", label: "Cuartos", min: 97, max: 100 },
  { id: "sf", label: "Semifinal", min: 101, max: 102 },
  { id: "final", label: "Final", min: 104, max: 104 },
] as const;

export function teamsInMatchNumberRange(
  pairs: { match_number: number; home_team_id: string | null; away_team_id: string | null }[],
  min: number,
  max: number
): Set<string> {
  const ids = new Set<string>();
  for (const p of pairs) {
    if (p.match_number < min || p.match_number > max) continue;
    if (p.home_team_id) ids.add(p.home_team_id);
    if (p.away_team_id) ids.add(p.away_team_id);
  }
  return ids;
}

/** +3 pts por cada equipo que está en la ronda oficial y en la proyección del usuario. */
export function countAdvancementHits(
  official: Set<string>,
  predicted: Set<string>,
  pointsPerTeam: number
): number {
  if (pointsPerTeam <= 0 || official.size === 0) return 0;
  let hits = 0;
  official.forEach((id) => {
    if (predicted.has(id)) hits += 1;
  });
  return hits * pointsPerTeam;
}

export function teamsForUserKnockoutPrediction(
  matchNumber: number,
  officialHome: string | null,
  officialAway: string | null,
  projected: { home_team_id: string | null; away_team_id: string | null } | undefined
): { homeId: string | null; awayId: string | null; fromProjection: boolean } {
  if (matchNumber < KNOCKOUT_PROJECTION_SCORING_MIN) {
    return { homeId: officialHome, awayId: officialAway, fromProjection: false };
  }
  if (projected?.home_team_id || projected?.away_team_id) {
    return {
      homeId: projected.home_team_id,
      awayId: projected.away_team_id,
      fromProjection: true,
    };
  }
  return { homeId: null, awayId: null, fromProjection: true };
}
