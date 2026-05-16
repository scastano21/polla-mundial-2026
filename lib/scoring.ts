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
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function honorNamesMatch(
  predicted: string | null | undefined,
  official: string | null | undefined
): boolean {
  const a = normalizeHonorName(predicted);
  const b = normalizeHonorName(official);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}
