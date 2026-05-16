"use client";

import { motion } from "framer-motion";
import { TeamDisplay } from "@/components/tournament/TeamDisplay";

export type MatchCardMatch = {
  id: string;
  match_number: number;
  group_letter: string | null;
  match_date: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  home_penalties: number | null;
  away_penalties: number | null;
  city: string | null;
  phase?: { name: string; slug: string } | null;
  home_team: { name: string; code: string } | null;
  away_team: { name: string; code: string } | null;
  elimination_slot_label?: string | null;
};

export type UserPrediction = {
  predicted_home_score: number;
  predicted_away_score: number;
  points_earned: number;
} | null;

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
  }).format(new Date(iso));
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "America/Bogota",
  }).format(new Date(iso));
}

export function MatchCard({
  match,
  userPrediction,
}: {
  match: MatchCardMatch;
  userPrediction?: UserPrediction;
}) {
  const phaseName = match.phase?.name ?? "Eliminatoria";
  const headerLeft = match.group_letter
    ? `Grupo ${match.group_letter} · #${match.match_number}`
    : match.elimination_slot_label ?? phaseName;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`overflow-hidden rounded-2xl border transition-all ${
        match.status === "live"
          ? "border-green-500/50 bg-gradient-to-b from-green-950/30 to-zinc-900"
          : match.status === "finished"
            ? "border-zinc-700/50 bg-zinc-900/70"
            : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
      }`}
    >
      <div className="flex items-center justify-between bg-zinc-800/50 px-4 py-2 text-xs text-zinc-400">
        <span>{headerLeft}</span>
        <div className="flex items-center gap-2">
          <span>{formatDate(match.match_date)}</span>
          {match.status === "live" && (
            <span className="flex items-center gap-1 font-bold text-green-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
              EN VIVO
            </span>
          )}
          {match.status === "finished" && (
            <span className="text-zinc-500">Final</span>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <TeamDisplay team={match.home_team} size="sm" />
          </div>

          <div className="w-24 shrink-0 text-center">
            {match.status !== "scheduled" &&
            match.home_score != null &&
            match.away_score != null ? (
              <div>
                <span className="text-3xl font-black tabular-nums">
                  {match.home_score} – {match.away_score}
                </span>
                {match.home_penalties != null && match.away_penalties != null && (
                  <p className="mt-1 text-xs text-zinc-400">
                    Pen: {match.home_penalties} – {match.away_penalties}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-zinc-400">
                <p className="font-mono text-base font-semibold">
                  {formatTime(match.match_date)}
                </p>
                <p className="text-xs">{match.city}</p>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 justify-end">
            <TeamDisplay team={match.away_team} align="right" size="sm" />
          </div>
        </div>

        {userPrediction && match.status === "finished" && (
          <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3">
            <span className="text-xs text-zinc-400">
              Tu pronóstico:{" "}
              <span className="font-bold text-white">
                {userPrediction.predicted_home_score} –{" "}
                {userPrediction.predicted_away_score}
              </span>
            </span>
            <span
              className={`text-sm font-bold ${
                userPrediction.points_earned >= 5
                  ? "text-yellow-400"
                  : userPrediction.points_earned > 0
                    ? "text-green-400"
                    : "text-zinc-500"
              }`}
            >
              {userPrediction.points_earned > 0
                ? `+${userPrediction.points_earned} pts`
                : "0 pts"}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
