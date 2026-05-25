"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Flag } from "@/components/tournament/TeamDisplay";
import type { StandingComputed } from "@/lib/standings-compute";
import { GROUP_LETTERS } from "@/lib/standings-compute";
import type { KnockoutPair } from "@/lib/bracket/predicted-projection";

type TeamInfo = { name: string; code: string };

type ProjectionPayload = {
  standingsByGroup: Record<string, StandingComputed[]>;
  knockoutPairs: KnockoutPair[];
  groupMatchesPredicted: number;
  groupMatchesTotal: number;
  groupsComplete: boolean;
  r32Ready: boolean;
  matrixOptionNo: number | null;
  missingGroupLetters: string[];
  teams: Record<string, TeamInfo>;
};

function StandingsMiniTable({
  rows,
  teams,
}: {
  rows: StandingComputed[];
  teams: Record<string, TeamInfo>;
}) {
  if (rows.length === 0) {
    return <p className="text-xs text-zinc-500">Sin pronósticos en este grupo aún.</p>;
  }
  return (
    <table className="w-full text-left text-xs">
      <thead className="text-zinc-500">
        <tr>
          <th className="py-1 pr-2">#</th>
          <th>Equipo</th>
          <th className="text-center px-1">Pts</th>
          <th className="text-center px-1">DG</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const t = teams[r.team_id];
          return (
            <tr key={r.team_id} className="border-t border-zinc-800/80">
              <td className="py-1 pr-2 text-zinc-400">{r.position}</td>
              <td className="py-1">
                <span className="inline-flex items-center gap-1 font-medium text-zinc-200">
                  {t ? <Flag code={t.code} name={t.name} size="xs" /> : null}
                  {t?.name ?? "—"}
                </span>
              </td>
              <td className="text-center font-bold text-yellow-500">{r.points}</td>
              <td className="text-center text-zinc-400">{r.goals_for - r.goals_against}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function PredictedProjectionPanel({
  poolId,
  refreshKey = 0,
}: {
  poolId: string;
  refreshKey?: number;
}) {
  const [data, setData] = useState<ProjectionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState("A");
  const [showKo, setShowKo] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pool/${poolId}/projection`, { cache: "no-store" });
      if (!res.ok) {
        setData(null);
        return;
      }
      setData((await res.json()) as ProjectionPayload);
    } finally {
      setLoading(false);
    }
  }, [poolId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (loading && !data) {
    return (
      <div className="mb-6 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 text-sm text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
        Calculando tu proyección…
      </div>
    );
  }

  if (!data) return null;

  const koR32 = data.knockoutPairs.filter((k) => k.match_number >= 73 && k.match_number <= 88);
  const koLater = data.knockoutPairs.filter((k) => k.match_number > 88);

  return (
    <section className="mb-6 rounded-xl border border-zinc-700 bg-zinc-900/80 p-4">
      <h2 className="text-lg font-bold text-white">Tu proyección del torneo</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Según tus marcadores de grupos: tabla simulada y cruces de eliminatoria (FIFA, incluye los 8
        mejores terceros). No cambia el calendario oficial hasta que el admin publique resultados.
      </p>
      <p className="mt-2 text-xs text-zinc-500">
        Grupos: {data.groupMatchesPredicted}/{data.groupMatchesTotal} partidos con pronóstico
        {data.groupsComplete ? (
          <span className="text-green-500"> · listo para simular dieciseisavos</span>
        ) : (
          <span className="text-amber-500">
            {" "}
            · faltan grupos: {data.missingGroupLetters.join(", ")}
          </span>
        )}
        {data.r32Ready && data.matrixOptionNo != null && (
          <span className="text-zinc-400"> · Matriz FIFA opción #{data.matrixOptionNo}</span>
        )}
      </p>

      <div className="mt-4 flex flex-wrap gap-1">
        {GROUP_LETTERS.map((g) => (
          <button
            key={g}
            type="button"
            data-skip-nav-progress
            onClick={() => {
              setActiveGroup(g);
              setShowKo(false);
            }}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
              !showKo && activeGroup === g
                ? "bg-yellow-500 text-black"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {g}
          </button>
        ))}
        <button
          type="button"
          data-skip-nav-progress
          onClick={() => setShowKo(true)}
          className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
            showKo ? "bg-yellow-500 text-black" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          Eliminatoria
        </button>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
        {!showKo ? (
          <StandingsMiniTable rows={data.standingsByGroup[activeGroup] ?? []} teams={data.teams} />
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto text-sm">
            {!data.r32Ready && (
              <p className="text-xs text-amber-400">
                Completa los 72 partidos de grupos para ver todos los cruces de dieciseisavos (8
                mejores terceros según FIFA).
              </p>
            )}
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Dieciseisavos (73–88)
            </p>
            {koR32.map((k) => (
              <KoRow key={k.match_number} pair={k} teams={data.teams} />
            ))}
            {koLater.length > 0 && (
              <>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Octavos en adelante (según tus KO)
                </p>
                {koLater.map((k) => (
                  <KoRow key={k.match_number} pair={k} teams={data.teams} />
                ))}
              </>
            )}
            <p className="mt-2 text-xs text-zinc-500">
              Si pronosticas empate en eliminatoria, indica quién pasa en ese partido para completar
              tu cuadro.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function KoRow({ pair, teams }: { pair: KnockoutPair; teams: Record<string, TeamInfo> }) {
  const h = pair.home_team_id ? teams[pair.home_team_id] : null;
  const a = pair.away_team_id ? teams[pair.away_team_id] : null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-zinc-900 px-2 py-1.5">
      <span className="font-mono text-xs text-zinc-500">#{pair.match_number}</span>
      <span className="text-zinc-200">{h?.name ?? "TBD"}</span>
      <span className="text-zinc-500">vs</span>
      <span className="text-zinc-200">{a?.name ?? "TBD"}</span>
    </div>
  );
}
