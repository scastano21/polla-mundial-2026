"use client";

import confetti from "canvas-confetti";

export function usePointsCelebration() {
  const celebrate = (points: number) => {
    if (points >= 5) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ["#eab308", "#ffffff", "#ef4444", "#3b82f6"],
      });
      setTimeout(
        () =>
          confetti({
            particleCount: 60,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.5 },
          }),
        200
      );
      setTimeout(
        () =>
          confetti({
            particleCount: 60,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.5 },
          }),
        400
      );
    } else if (points > 0) {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
        colors: ["#eab308", "#22c55e"],
      });
    }
  };
  return { celebrate };
}
