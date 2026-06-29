"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TeamDisplay } from "@/components/tournament/TeamDisplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Team = { name: string; code: string };
type MatchRow = {
  id: string;
  match_number: number;
  status: string;
  group_letter: string | null;
  home_score: number | null;
  away_score: number | null;
  home_penalties: number | null;
  away_penalties: number | null;
  home_team_id: string | null;
  away_team_id: string | null;
  match_date: string;
  phases: { slug: string; name: string } | { slug: string; name: string }[] | null;
};

export default function AdminResultsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [teams, setTeams] = useState<Map<string, Team>>(new Map());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: m } = await supabase
      .from("matches")
      .select("*, phases(slug, name)")
      .order("match_date");
    setMatches((m ?? []) as MatchRow[]);
    const { data: t } = await supabase.from("teams").select("id, name, code");
    const tm = new Map<string, Team>();
    for (const row of t ?? []) tm.set(row.id, row as Team);
    setTeams(tm);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="p-8 text-zinc-400">Cargando partidos…</p>;

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-2xl font-black">Ingresar resultados</h1>
      <p className="text-sm text-zinc-400">
        Filtra mentalmente por fecha. Guardar marca el partido como final, bloquea pronósticos y
        reparte puntos.
      </p>
      <BracketSyncSection onSynced={load} />
      <div className="space-y-3">
        {matches.map((m) => (
          <ResultRow
            key={m.id}
            match={m}
            home={m.home_team_id ? teams.get(m.home_team_id) ?? null : null}
            away={m.away_team_id ? teams.get(m.away_team_id) ?? null : null}
            onSaved={load}
          />
        ))}
      </div>
    </main>
  );
}

function BracketSyncSection({ onSynced }: { onSynced: () => void }) {
  const [busy, setBusy] = useState(false);
  const [busyAdv, setBusyAdv] = useState(false);
  const sync = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/sync-bracket", { method: "POST" });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        r32?: { ok: boolean; message: string; updated: number };
        propagated?: number;
        knockoutMatchesRecalculated?: number;
      };
      if (!res.ok) {
        toast.error(j.error ?? "No se pudo sincronizar");
        return;
      }
      toast.success(j.r32?.message ?? "Cruces actualizados", {
        description: [
          j.propagated != null ? `Propagación KO: ${j.propagated}` : null,
          j.knockoutMatchesRecalculated != null
            ? `Marcadores KO recalculados: ${j.knockoutMatchesRecalculated}`
            : null,
          "Puntos por clasificados actualizados",
        ]
          .filter(Boolean)
          .join(" · "),
      });
      onSynced();
    } finally {
      setBusy(false);
    }
  };
  const recalcAdvancement = async () => {
    setBusyAdv(true);
    try {
      const res = await fetch("/api/admin/recalculate-advancement", { method: "POST" });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(j.error ?? "No se pudo recalcular");
        return;
      }
      toast.success("Puntos por clasificados recalculados en todas las pollas");
    } finally {
      setBusyAdv(false);
    }
  };
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-700 bg-zinc-900 p-4">
      <p className="text-sm text-zinc-400">
        Al cerrar todos los grupos se rellenan los dieciseisavos (matriz FIFA). Tras cada KO, se
        completan octavos en adelante. Los <strong className="text-zinc-200">+3 por clasificado</strong>{" "}
        se suman al sincronizar o con el botón de recalcular.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          data-skip-nav-progress
          variant="outline"
          disabled={busy}
          onClick={sync}
          className="shrink-0 border-zinc-500 text-zinc-200 hover:bg-zinc-800"
        >
          {busy ? "Sincronizando…" : "Sincronizar cruces FIFA"}
        </Button>
        <Button
          type="button"
          data-skip-nav-progress
          variant="outline"
          disabled={busyAdv}
          onClick={recalcAdvancement}
          className="shrink-0 border-yellow-600/50 text-yellow-500 hover:bg-yellow-500/10"
        >
          {busyAdv ? "Recalculando…" : "Recalcular +3 clasificados"}
        </Button>
      </div>
    </div>
  );
}

function ResultRow({
  match,
  home,
  away,
  onSaved,
}: {
  match: MatchRow;
  home: Team | null;
  away: Team | null;
  onSaved: () => void;
}) {
  const [homeScore, setHomeScore] = useState(
    match.home_score != null ? String(match.home_score) : ""
  );
  const [awayScore, setAwayScore] = useState(
    match.away_score != null ? String(match.away_score) : ""
  );
  const [homePen, setHomePen] = useState(
    match.home_penalties != null ? String(match.home_penalties) : ""
  );
  const [awayPen, setAwayPen] = useState(
    match.away_penalties != null ? String(match.away_penalties) : ""
  );
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    setHomeScore(match.home_score != null ? String(match.home_score) : "");
    setAwayScore(match.away_score != null ? String(match.away_score) : "");
    setHomePen(match.home_penalties != null ? String(match.home_penalties) : "");
    setAwayPen(match.away_penalties != null ? String(match.away_penalties) : "");
  }, [
    match.home_score,
    match.away_score,
    match.home_penalties,
    match.away_penalties,
    match.status,
  ]);
  const phaseSlug = Array.isArray(match.phases) ? match.phases[0]?.slug : match.phases?.slug;
  const isKo = phaseSlug !== "groups";

  const handleSave = async () => {
    const hs = parseInt(homeScore, 10);
    const as = parseInt(awayScore, 10);
    if (Number.isNaN(hs) || Number.isNaN(as)) {
      toast.error("Marcador inválido");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: match.id,
        homeScore: hs,
        awayScore: as,
        homePenalties: homePen === "" ? null : parseInt(homePen, 10),
        awayPenalties: awayPen === "" ? null : parseInt(awayPen, 10),
      }),
    });
    setSaving(false);
    const j = (await res.json().catch(() => ({}))) as {
      error?: string;
      bracket?: { r32Message?: string; r32Updated?: number; knockoutPropagated?: number };
    };
    if (!res.ok) {
      toast.error(j.error ?? "Error al guardar");
      return;
    }
    toast.success("Resultado guardado", {
      description:
        j.bracket?.r32Message
          ? `${j.bracket.r32Message} · KO: +${j.bracket.knockoutPropagated ?? 0} cruces`
          : undefined,
    });
    onSaved();
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        "¿Reiniciar este partido? Se borrará el marcador, volverá a programado y se revertirán los puntos de pronósticos."
      )
    ) {
      return;
    }
    setResetting(true);
    try {
      const res = await fetch("/api/admin/reset-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((j as { error?: string }).error ?? "No se pudo reiniciar");
        return;
      }
      toast.success("Partido reiniciado");
      onSaved();
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-zinc-800 p-4 lg:flex-row lg:items-center">
      <div className="min-w-0 flex-1">
        <TeamDisplay team={home} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="number"
          min={0}
          max={20}
          className="h-12 w-14 bg-zinc-700 text-center text-xl font-black"
          value={homeScore}
          onChange={(e) => setHomeScore(e.target.value)}
        />
        <span className="text-xl font-bold text-zinc-400">–</span>
        <Input
          type="number"
          min={0}
          max={20}
          className="h-12 w-14 bg-zinc-700 text-center text-xl font-black"
          value={awayScore}
          onChange={(e) => setAwayScore(e.target.value)}
        />
      </div>
      {isKo && (
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span>Pen:</span>
          <Input
            type="number"
            className="h-8 w-10 bg-zinc-700 text-center"
            value={homePen}
            onChange={(e) => setHomePen(e.target.value)}
          />
          <span>–</span>
          <Input
            type="number"
            className="h-8 w-10 bg-zinc-700 text-center"
            value={awayPen}
            onChange={(e) => setAwayPen(e.target.value)}
          />
        </div>
      )}
      <div className="min-w-0 flex-1 lg:flex lg:justify-end">
        <TeamDisplay team={away} align="right" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          data-skip-nav-progress
          disabled={saving || homeScore === "" || awayScore === ""}
          onClick={handleSave}
          className="bg-yellow-500 font-bold text-black hover:bg-yellow-400"
        >
          {saving ? "Guardando…" : "Guardar"}
        </Button>
        {match.status === "finished" && (
          <Button
            type="button"
            data-skip-nav-progress
            variant="outline"
            disabled={resetting || saving}
            onClick={handleReset}
            className="border-zinc-500 text-zinc-200 hover:bg-zinc-700"
          >
            {resetting ? "Eliminando…" : "Eliminar resultado"}
          </Button>
        )}
      </div>
    </div>
  );
}
