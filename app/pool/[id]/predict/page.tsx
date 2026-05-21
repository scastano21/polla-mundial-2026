"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resultFromScores } from "@/lib/scoring";
import { PoolScoringBlurb, type PoolScoringRulesRow } from "@/components/pool/pool-scoring-blurb";
import { SiteHeader } from "@/components/site-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { TournamentLockBanner } from "@/components/tournament-lock-banner";
import { PredictionProgress } from "@/components/pool/prediction-progress";
import type { TournamentLockState } from "@/lib/tournament-lock";

type MatchRow = {
  id: string;
  match_number: number;
  status: string;
  home_score: number | null;
  away_score: number | null;
  home_team_id: string | null;
  away_team_id: string | null;
  match_date: string;
};

type Team = { id: string; name: string; code: string };

export default function PoolPredictPage() {
  const params = useParams();
  const poolId = params.id as string;
  const supabase = useMemo(() => createClient(), []);

  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [teams, setTeams] = useState<Map<string, Team>>(new Map());
  const [preds, setPreds] = useState<Record<string, { h: string; a: string; locked: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<PoolScoringRulesRow>(null);
  const [lock, setLock] = useState<TournamentLockState | null>(null);

  const load = useCallback(async () => {
    const { data: m } = await supabase.from("matches").select("*").order("match_number");
    setMatches((m ?? []) as MatchRow[]);
    const { data: t } = await supabase.from("teams").select("id, name, code");
    const tm = new Map<string, Team>();
    for (const row of t ?? []) tm.set(row.id, row as Team);
    setTeams(tm);

    const { data: sr } = await supabase
      .from("scoring_rules")
      .select(
        "exact_score_points, correct_result_points, correct_champion, correct_runner_up, correct_third_place, correct_top_scorer, correct_best_player, correct_best_goalkeeper, correct_best_young"
      )
      .eq("pool_id", poolId)
      .maybeSingle();
    setRules(sr);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: pr } = await supabase
      .from("predictions")
      .select("match_id, predicted_home_score, predicted_away_score, is_locked")
      .eq("pool_id", poolId)
      .eq("user_id", user.id);
    const map: Record<string, { h: string; a: string; locked: boolean }> = {};
    for (const p of pr ?? []) {
      map[p.match_id] = {
        h: String(p.predicted_home_score),
        a: String(p.predicted_away_score),
        locked: p.is_locked,
      };
    }
    setPreds(map);
    const lockRes = await fetch("/api/tournament/lock-status", { cache: "no-store" });
    if (lockRes.ok) setLock((await lockRes.json()) as TournamentLockState);
    setLoading(false);
  }, [poolId, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const globalClosed = lock !== null && !lock.open;

  const saveOne = async (match: MatchRow) => {
    const cur = preds[match.id];
    if (!cur || cur.locked || match.status !== "scheduled" || globalClosed) {
      if (globalClosed) toast.error("El plazo de pronósticos ya cerró (5 min antes del inaugural).");
      return;
    }
    const h = parseInt(cur.h, 10);
    const a = parseInt(cur.a, 10);
    if (Number.isNaN(h) || Number.isNaN(a) || h < 0 || a < 0 || h > 20 || a > 20) {
      toast.error("Marcador inválido");
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const predicted_result = resultFromScores(h, a);
    const { error } = await supabase.from("predictions").upsert(
      {
        user_id: user.id,
        pool_id: poolId,
        match_id: match.id,
        predicted_home_score: h,
        predicted_away_score: a,
        predicted_result,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,pool_id,match_id" }
    );
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Guardado");
  };

  if (loading) {
    return (
      <>
        <SiteHeader />
        <p className="p-10 text-center text-zinc-400">Cargando…</p>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-black text-white">Pronósticos</h1>
          <Link
            href={`/pool/${poolId}`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-zinc-600")}
          >
            Tabla
          </Link>
        </div>
        <TournamentLockBanner className="mb-4" />
        <PoolScoringBlurb rules={rules} />
        <PredictionProgress poolId={poolId} className="mb-4" />
        <p className="mb-4 text-sm text-zinc-400">
          Completa y guarda todos los partidos (grupos y eliminatoria) y el cuadro de honor antes del cierre
          global. Lo que no guardes suma 0 puntos. Tras el cierre, solo el admin puede registrar resultados
          oficiales. En eliminatoria, los equipos &quot;TBD&quot; se rellenan al avanzar el torneo; puedes pronosticar
          igual desde ya.
        </p>
        <div className="space-y-3">
          {matches.map((m) => {
            const ht = m.home_team_id ? teams.get(m.home_team_id) : null;
            const at = m.away_team_id ? teams.get(m.away_team_id) : null;
            const cur = preds[m.id] ?? { h: "", a: "", locked: false };
            const disabled = globalClosed || m.status !== "scheduled" || cur.locked;
            return (
              <div
                key={m.id}
                className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1 text-sm">
                  <span className="text-zinc-500">#{m.match_number}</span>{" "}
                  <span className="font-semibold text-white">
                    {ht?.name ?? "TBD"} vs {at?.name ?? "TBD"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    className="w-14 bg-zinc-950 text-center"
                    disabled={disabled}
                    value={cur.h}
                    onChange={(e) =>
                      setPreds((p) => ({
                        ...p,
                        [m.id]: { ...cur, h: e.target.value },
                      }))
                    }
                  />
                  <span className="text-zinc-500">–</span>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    className="w-14 bg-zinc-950 text-center"
                    disabled={disabled}
                    value={cur.a}
                    onChange={(e) =>
                      setPreds((p) => ({
                        ...p,
                        [m.id]: { ...cur, a: e.target.value },
                      }))
                    }
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={disabled}
                    data-skip-nav-progress
                    className="bg-yellow-500 text-black hover:bg-yellow-400"
                    onClick={() => saveOne(m)}
                  >
                    Guardar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
