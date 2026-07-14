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

/** Puntos por clasificado a la final (el resto de rondas KO usa scoring_rules.advancement_team_points). */
export const FINAL_ADVANCEMENT_TEAM_POINTS = 6;

/** Rangos de partidos para puntos por clasificado en cada ronda KO. */
export const KNOCKOUT_ADVANCEMENT_ROUNDS = [
  /** Clasificación a dieciseisavos: suma al definir el cuadro (grupos cerrados). */
  { id: "r32", label: "Dieciseisavos", min: 73, max: 88, awardWhen: "bracket_ready" as const },
  /** Clasificación a octavos/cuartos/etc.: suma cuando el cuadro de esa ronda está definido. */
  { id: "r16", label: "Octavos", min: 89, max: 96, awardWhen: "bracket_ready" as const },
  { id: "qf", label: "Cuartos", min: 97, max: 100, awardWhen: "bracket_ready" as const },
  { id: "sf", label: "Semifinal", min: 101, max: 102, awardWhen: "bracket_ready" as const },
  { id: "final", label: "Final", min: 104, max: 104, awardWhen: "bracket_ready" as const },
] as const;

export function advancementPointsForRound(
  round: (typeof KNOCKOUT_ADVANCEMENT_ROUNDS)[number],
  basePointsPerTeam: number
): number {
  if (round.id === "final") return FINAL_ADVANCEMENT_TEAM_POINTS;
  return basePointsPerTeam;
}

type RoundMatch = {
  match_number: number;
  home_team_id: string | null;
  away_team_id: string | null;
  status?: string;
  home_score?: number | null;
  away_score?: number | null;
};

export function isRoundBracketReady(matches: RoundMatch[], min: number, max: number): boolean {
  const round = matches.filter((m) => m.match_number >= min && m.match_number <= max);
  if (round.length === 0) return false;
  return round.every((m) => m.home_team_id && m.away_team_id);
}

export function isRoundFullyFinished(matches: RoundMatch[], min: number, max: number): boolean {
  const round = matches.filter((m) => m.match_number >= min && m.match_number <= max);
  if (round.length === 0) return false;
  return round.every(
    (m) =>
      m.status === "finished" &&
      m.home_score != null &&
      m.away_score != null &&
      m.home_team_id &&
      m.away_team_id
  );
}

export function isAdvancementRoundReady(
  round: (typeof KNOCKOUT_ADVANCEMENT_ROUNDS)[number],
  matches: RoundMatch[]
): boolean {
  if (round.awardWhen === "bracket_ready") {
    return isRoundBracketReady(matches, round.min, round.max);
  }
  return isRoundFullyFinished(matches, round.min, round.max);
}

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

/** Puntos por cada equipo que está en la ronda oficial y en la proyección del usuario. */
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
