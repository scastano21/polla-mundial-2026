"use client";

import { useEffect, useState } from "react";
import type { TournamentLockState } from "@/lib/tournament-lock";
import { formatDeadlineEs } from "@/lib/tournament-lock";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "cerrado";
  const totalMin = Math.floor(ms / 60_000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins} min`;
}

export function TournamentLockBanner({ className = "" }: { className?: string }) {
  const [state, setState] = useState<TournamentLockState | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await fetch("/api/tournament/lock-status", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as TournamentLockState;
      if (!cancelled) setState(json);
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!state) return null;

  const deadline = new Date(state.deadlineIso);

  if (!state.open) {
    return (
      <div
        className={`rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200 ${className}`}
      >
        <p className="font-semibold">Pronósticos cerrados</p>
        <p className="mt-1 text-red-200/80">
          El plazo terminó 5 minutos antes del partido inaugural ({state.inauguralLabel}). Lo que no
          guardaste cuenta como 0 puntos.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-yellow-700/50 bg-yellow-950/30 px-4 py-3 text-sm text-yellow-100 ${className}`}
    >
      <p className="font-semibold">Completa toda tu polla antes del Mundial</p>
      <p className="mt-1 text-yellow-100/85">
        Cierra el {formatDeadlineEs(deadline)} (hora CDMX) — faltan{" "}
        <span className="font-bold text-yellow-400">{formatCountdown(state.msRemaining)}</span>.
        Incluye todos los partidos (grupos y eliminatoria) y el cuadro de honor; lo incompleto suma 0.
      </p>
    </div>
  );
}
