/** Secciones de la lista de pronósticos (por número de partido FIFA 2026). */
export const PREDICTION_SECTIONS = [
  { id: "groups", label: "Fase de grupos", min: 1, max: 72 },
  { id: "r32", label: "Dieciseisavos de final", min: 73, max: 88 },
  { id: "r16", label: "Octavos de final", min: 89, max: 96 },
  { id: "qf", label: "Cuartos de final", min: 97, max: 100 },
  { id: "sf", label: "Semifinales", min: 101, max: 102 },
  { id: "third", label: "Tercer puesto", min: 103, max: 103 },
  { id: "final", label: "Final", min: 104, max: 104 },
] as const;

export function matchesForSection<T extends { match_number: number }>(
  matches: T[],
  min: number,
  max: number
): T[] {
  return matches.filter((m) => m.match_number >= min && m.match_number <= max);
}
