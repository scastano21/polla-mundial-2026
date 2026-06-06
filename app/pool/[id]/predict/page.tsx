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
import { PredictedProjectionPanel } from "@/components/pool/predicted-projection-panel";
import { PredictionProgress } from "@/components/pool/prediction-progress";
import type { TournamentLockState } from "@/lib/tournament-lock";
import { matchesForSection, PREDICTION_SECTIONS } from "@/lib/match-sections";

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
  const [preds, setPreds] = useState<
    Record<string, { h: string; a: string; locked: boolean; advanceTeamId: string | null }>
  >({});
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<PoolScoringRulesRow>(null);
  const [lock, setLock] = useState<TournamentLockState | null>(null);
  const [projRefresh, setProjRefresh] = useState(0);
  const [projectedKo, setProjectedKo] = useState<
    Map<number, { home_team_id: string | null; away_team_id: string | null }>
  >(new Map());

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
        "exact_score_points, correct_result_points, advancement_team_points, correct_champion, correct_runner_up, correct_third_place, correct_top_scorer, correct_best_player, correct_best_goalkeeper, correct_best_young"
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
      .select(
        "match_id, predicted_home_score, predicted_away_score, predicted_advance_team_id, is_locked"
      )
      .eq("pool_id", poolId)
      .eq("user_id", user.id);
    const map: Record<
      string,
      { h: string; a: string; locked: boolean; advanceTeamId: string | null }
    > = {};
    for (const p of pr ?? []) {
      map[p.match_id] = {
        h: String(p.predicted_home_score),
        a: String(p.predicted_away_score),
        locked: p.is_locked,
        advanceTeamId: p.predicted_advance_team_id ?? null,
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/pool/${poolId}/projection`, { cache: "no-store" });
      if (!res.ok || cancelled) return;
      const body = (await res.json()) as {
        knockoutPairs?: { match_number: number; home_team_id: string | null; away_team_id: string | null }[];
      };
      const map = new Map<number, { home_team_id: string | null; away_team_id: string | null }>();
      for (const k of body.knockoutPairs ?? []) {
        map.set(k.match_number, {
          home_team_id: k.home_team_id,
          away_team_id: k.away_team_id,
        });
      }
      if (!cancelled) setProjectedKo(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [poolId, projRefresh]);

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
    const isKnockout = match.match_number >= 73;
    const isTie = h === a;
    const proj = projectedKo.get(match.match_number);
    const homeId = match.home_team_id ?? proj?.home_team_id ?? null;
    const awayId = match.away_team_id ?? proj?.away_team_id ?? null;
    let advanceTeamId: string | null = null;
    if (isKnockout && isTie) {
      advanceTeamId = cur.advanceTeamId;
      if (!advanceTeamId) {
        toast.error("En eliminatoria con empate, elige quién pasa a la siguiente ronda.");
        return;
      }
      if (
        homeId &&
        awayId &&
        advanceTeamId !== homeId &&
        advanceTeamId !== awayId
      ) {
        toast.error("El equipo que pasa debe ser local o visitante de este partido.");
        return;
      }
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
        predicted_advance_team_id: isKnockout && isTie ? advanceTeamId : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,pool_id,match_id" }
    );
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Guardado");
    setProjRefresh((n) => n + 1);
    void fetch(`/api/pool/${poolId}/advancement-recalc`, { method: "POST" }).catch(() => {});
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
        <PredictionProgress poolId={poolId} className="mb-4" />
        <PredictedProjectionPanel poolId={poolId} refreshKey={projRefresh} />
        <PoolScoringBlurb rules={rules} className="mt-4 mb-4" />
        <p className="mb-4 text-sm text-zinc-400">
          Guarda tus marcadores de fase de grupos para ver tu tabla simulada y los cruces de eliminatoria
          (incluye 8 mejores terceros, reglas FIFA). En eliminatoria, si pronosticas empate, debes indicar
          quién pasa para completar tu cuadro. Los equipos KO se muestran según tu proyección cuando aún
          no están definidos oficialmente.
        </p>
        {PREDICTION_SECTIONS.map((section) => {
          const sectionMatches = matchesForSection(matches, section.min, section.max);
          if (sectionMatches.length === 0) return null;
          return (
            <section key={section.id} className="mb-10">
              <h2 className="mb-3 border-b border-zinc-800 pb-2 text-lg font-bold text-yellow-500">
                {section.label}
              </h2>
              <div className="space-y-3">
                {sectionMatches.map((m) => {
            const proj = projectedKo.get(m.match_number);
            const homeId = m.home_team_id ?? proj?.home_team_id ?? null;
            const awayId = m.away_team_id ?? proj?.away_team_id ?? null;
            const ht = homeId ? teams.get(homeId) : null;
            const at = awayId ? teams.get(awayId) : null;
            const fromProjection = m.match_number >= 73 && (!m.home_team_id || !m.away_team_id) && !!proj;
            const cur = preds[m.id] ?? { h: "", a: "", locked: false, advanceTeamId: null };
            const disabled = globalClosed || m.status !== "scheduled" || cur.locked;
            const hNum = cur.h === "" ? NaN : parseInt(cur.h, 10);
            const aNum = cur.a === "" ? NaN : parseInt(cur.a, 10);
            const showAdvancePicker =
              m.match_number >= 73 &&
              !Number.isNaN(hNum) &&
              !Number.isNaN(aNum) &&
              hNum === aNum &&
              homeId &&
              awayId;
            return (
              <div
                key={m.id}
                className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:flex-row sm:items-center sm:flex-wrap"
              >
                <div className="min-w-0 flex-1 text-sm">
                  <span className="text-zinc-500">#{m.match_number}</span>{" "}
                  <span className="font-semibold text-white">
                    {ht?.name ?? "TBD"} vs {at?.name ?? "TBD"}
                  </span>
                  {fromProjection && (
                    <span className="ml-2 text-xs text-yellow-600/90">(tu proyección)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    className="w-14 bg-zinc-950 text-center"
                    disabled={disabled}
                    value={cur.h}
                    onChange={(e) => {
                      const nextH = e.target.value;
                      const nh = nextH === "" ? NaN : parseInt(nextH, 10);
                      const na = cur.a === "" ? NaN : parseInt(cur.a, 10);
                      const clearAdvance =
                        !Number.isNaN(nh) && !Number.isNaN(na) && nh !== na;
                      setPreds((p) => ({
                        ...p,
                        [m.id]: {
                          ...cur,
                          h: nextH,
                          advanceTeamId: clearAdvance ? null : cur.advanceTeamId,
                        },
                      }));
                    }}
                  />
                  <span className="text-zinc-500">–</span>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    className="w-14 bg-zinc-950 text-center"
                    disabled={disabled}
                    value={cur.a}
                    onChange={(e) => {
                      const nextA = e.target.value;
                      const na = nextA === "" ? NaN : parseInt(nextA, 10);
                      const nh = cur.h === "" ? NaN : parseInt(cur.h, 10);
                      const clearAdvance =
                        !Number.isNaN(nh) && !Number.isNaN(na) && nh !== na;
                      setPreds((p) => ({
                        ...p,
                        [m.id]: {
                          ...cur,
                          a: nextA,
                          advanceTeamId: clearAdvance ? null : cur.advanceTeamId,
                        },
                      }));
                    }}
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
                {showAdvancePicker && (
                  <div className="w-full basis-full border-t border-zinc-800 pt-3">
                    <p className="mb-2 text-xs font-medium text-yellow-600/90">
                      Empate en eliminatoria — ¿quién pasa en tu pronóstico?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={cur.advanceTeamId === homeId ? "default" : "outline"}
                        disabled={disabled}
                        className={
                          cur.advanceTeamId === homeId
                            ? "bg-yellow-500 text-black hover:bg-yellow-400"
                            : "border-zinc-600"
                        }
                        onClick={() =>
                          setPreds((p) => ({
                            ...p,
                            [m.id]: { ...cur, advanceTeamId: homeId },
                          }))
                        }
                      >
                        Pasa: {ht?.name ?? "Local"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={cur.advanceTeamId === awayId ? "default" : "outline"}
                        disabled={disabled}
                        className={
                          cur.advanceTeamId === awayId
                            ? "bg-yellow-500 text-black hover:bg-yellow-400"
                            : "border-zinc-600"
                        }
                        onClick={() =>
                          setPreds((p) => ({
                            ...p,
                            [m.id]: { ...cur, advanceTeamId: awayId },
                          }))
                        }
                      >
                        Pasa: {at?.name ?? "Visitante"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
                })}
              </div>
            </section>
          );
        })}

        <div className="mt-10 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-6 text-center">
          <p className="mb-4 text-sm text-zinc-300">
            ¿Ya guardaste tus marcadores? Completa también el{" "}
            <strong className="text-white">cuadro de honor</strong> (campeón, goleador, premios FIFA…)
            antes del cierre del plazo.
          </p>
          <Link
            href={`/pool/${poolId}/honor`}
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-yellow-500 text-black hover:bg-yellow-400"
            )}
          >
            Ir al cuadro de honor
          </Link>
        </div>
      </main>
    </>
  );
}
