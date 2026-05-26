/** Rangos de partidos FIFA 2026 para puntos por clasificado en KO. */
export const KNOCKOUT_SCORING_ROUNDS = [
  { id: "r32", label: "Dieciseisavos", min: 73, max: 88 },
  { id: "r16", label: "Octavos", min: 89, max: 96 },
  { id: "qf", label: "Cuartos", min: 97, max: 100 },
  { id: "sf", label: "Semifinal", min: 101, max: 102 },
  { id: "final", label: "Final", min: 104, max: 104 },
] as const;

export type KnockoutRoundId = (typeof KNOCKOUT_SCORING_ROUNDS)[number]["id"];

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

export function countAdvancementHits(
  official: Set<string>,
  predicted: Set<string>,
  pointsPerTeam: number
): number {
  if (pointsPerTeam <= 0) return 0;
  let hits = 0;
  official.forEach((id) => {
    if (predicted.has(id)) hits += 1;
  });
  return hits * pointsPerTeam;
}
