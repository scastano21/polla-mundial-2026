export type MatchResult1x2 = "1" | "X" | "2";

export function resultFromScores(home: number, away: number): MatchResult1x2 {
  if (home > away) return "1";
  if (home === away) return "X";
  return "2";
}

export type ScoringRulesRow = {
  exact_score_points: number;
  correct_result_points: number;
};

export function pointsForPrediction(
  rules: ScoringRulesRow,
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): { points: number; exact: boolean; correctResultOnly: boolean } {
  if (
    predictedHome === actualHome &&
    predictedAway === actualAway
  ) {
    return { points: rules.exact_score_points, exact: true, correctResultOnly: false };
  }
  const predR = resultFromScores(predictedHome, predictedAway);
  const actR = resultFromScores(actualHome, actualAway);
  if (predR === actR) {
    return {
      points: rules.correct_result_points,
      exact: false,
      correctResultOnly: true,
    };
  }
  return { points: 0, exact: false, correctResultOnly: false };
}

export function normalizeHonorName(s: string | null | undefined): string {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function honorNameDistance(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 2) return 99;
  const prev = new Array<number>(n + 1);
  const cur = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = cur[j];
  }
  return prev[n];
}

export function honorNamesMatch(
  predicted: string | null | undefined,
  official: string | null | undefined
): boolean {
  const a = normalizeHonorName(predicted);
  const b = normalizeHonorName(official);
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;
  // Tolera typos menores (ej. Unair/Unai) y acentos ya normalizados.
  return honorNameDistance(a, b) <= 2;
}
