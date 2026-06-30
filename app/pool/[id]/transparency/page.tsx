import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PoolTransparencyPrintBar } from "@/components/pool/pool-transparency-print-bar";
import { SiteHeader } from "@/components/site-header";
import { COPY } from "@/lib/copy";
import { PoolMembersReload } from "@/components/pool/pool-members-reload";
import { countPoolMembers, fetchPoolLeaderboard } from "@/lib/pool-leaderboard";
import { fetchAllPredictions } from "@/lib/fetch-all-predictions";
import { createServerSupabase } from "@/lib/supabase/server";
import { tryCreateServiceClient } from "@/lib/supabase/service";
import {
  buildMatchScoreEligibility,
  isMatchScoreEligible,
} from "@/lib/transparency-match-eligibility";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type MatchRow = {
  id: string;
  match_number: number;
  status: string;
  home_score: number | null;
  away_score: number | null;
  home_team_id: string | null;
  away_team_id: string | null;
  group_letter: string | null;
};

type PredRow = {
  user_id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  points_earned: number | null;
};

type HonorRow = {
  user_id: string;
  champion_team_id: string | null;
  runner_up_team_id: string | null;
  third_place_team_id: string | null;
  top_scorer_name: string | null;
  best_player_name: string | null;
  best_goalkeeper_name: string | null;
  best_young_player_name: string | null;
  points_earned: number | null;
};

function fmtPred(h: number, a: number) {
  return `${h}–${a}`;
}

function teamLabel(
  teamId: string | null,
  teams: Map<string, { name: string; code: string }>
): string {
  if (!teamId) return "TBD";
  const t = teams.get(teamId);
  return t?.name ?? "TBD";
}

export default async function PoolTransparencyPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/pool/${params.id}/transparency`);

  const { data: pool } = await supabase.from("pools").select("*").eq("id", params.id).maybeSingle();
  if (!pool) notFound();

  const { data: membership } = await supabase
    .from("pool_members")
    .select("id")
    .eq("pool_id", pool.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership && pool.admin_id !== user.id) {
    redirect("/dashboard");
  }

  const [leaderboard, memberCountDb, { data: matches }, { data: teamRows }, { data: honors }, { data: honorTruth }] =
    await Promise.all([
      fetchPoolLeaderboard(supabase, pool.id),
      countPoolMembers(pool.id),
      supabase.from("matches").select("*").order("match_number"),
      supabase.from("teams").select("id, name, code"),
      supabase.from("honor_predictions").select("*").eq("pool_id", pool.id),
      supabase.from("honor_results").select("*").eq("tournament_year", 2026).maybeSingle(),
    ]);

  let predictionRows = await fetchAllPredictions(supabase, { poolId: pool.id });
  const svc = tryCreateServiceClient();
  if (svc) {
    const svcRows = await fetchAllPredictions(svc, { poolId: pool.id });
    if (svcRows.length > predictionRows.length) {
      predictionRows = svcRows;
    }
  }

  const memberList = leaderboard.map((m) => ({
    user_id: m.user_id,
    total_points: m.total_points,
    rank: m.rank,
  }));
  const profileMap = new Map(
    leaderboard.map((m) => [
      m.user_id,
      { display_name: m.display_name, username: m.username },
    ])
  );

  const teams = new Map<string, { name: string; code: string }>();
  for (const row of teamRows ?? []) {
    teams.set(row.id, { name: row.name as string, code: row.code as string });
  }

  const predMap = new Map<string, PredRow>();
  for (const p of predictionRows) {
    predMap.set(`${p.user_id}:${p.match_id}`, {
      user_id: p.user_id,
      match_id: p.match_id,
      predicted_home_score: p.predicted_home_score,
      predicted_away_score: p.predicted_away_score,
      points_earned: p.points_earned,
    });
  }

  const matchRows = (matches ?? []) as MatchRow[];
  const scoreEligibility = buildMatchScoreEligibility(
    matchRows.map((m) => ({
      id: m.id,
      match_number: m.match_number,
      home_team_id: m.home_team_id,
      away_team_id: m.away_team_id,
      group_letter: m.group_letter,
    })),
    predictionRows.map((p) => ({
      user_id: p.user_id,
      match_id: p.match_id,
      predicted_home_score: p.predicted_home_score,
      predicted_away_score: p.predicted_away_score,
      predicted_advance_team_id: p.predicted_advance_team_id,
    }))
  );

  const honorByUser = new Map<string, HonorRow>();
  for (const h of (honors ?? []) as HonorRow[]) {
    honorByUser.set(h.user_id, h);
  }

  const honorRows: { key: string; label: string; pick: (h: HonorRow) => string }[] = [
    { key: "champion", label: COPY.honor.sections.champion, pick: (h) => teamLabel(h.champion_team_id, teams) },
    { key: "runner", label: COPY.honor.sections.runner_up, pick: (h) => teamLabel(h.runner_up_team_id, teams) },
    { key: "third", label: COPY.honor.sections.third, pick: (h) => teamLabel(h.third_place_team_id, teams) },
    { key: "scorer", label: COPY.honor.sections.top_scorer, pick: (h) => h.top_scorer_name?.trim() || "—" },
    { key: "best", label: COPY.honor.sections.best_player, pick: (h) => h.best_player_name?.trim() || "—" },
    { key: "keeper", label: COPY.honor.sections.best_keeper, pick: (h) => h.best_goalkeeper_name?.trim() || "—" },
    { key: "young", label: COPY.honor.sections.best_young, pick: (h) => h.best_young_player_name?.trim() || "—" },
  ];

  const truth = honorTruth as {
    champion_team_id: string | null;
    runner_up_team_id: string | null;
    third_place_team_id: string | null;
    top_scorer_name: string | null;
    best_player_name: string | null;
    best_goalkeeper_name: string | null;
    best_young_player_name: string | null;
  } | null;

  const truthPick: Record<string, string> = truth
    ? {
        champion: teamLabel(truth.champion_team_id, teams),
        runner: teamLabel(truth.runner_up_team_id, teams),
        third: teamLabel(truth.third_place_team_id, teams),
        scorer: truth.top_scorer_name?.trim() || "—",
        best: truth.best_player_name?.trim() || "—",
        keeper: truth.best_goalkeeper_name?.trim() || "—",
        young: truth.best_young_player_name?.trim() || "—",
      }
    : {};

  return (
    <>
      <div className="print:hidden">
        <SiteHeader />
      </div>
      <main className="mx-auto max-w-[100rem] px-4 py-8 print:bg-white print:py-4 print:text-black">
        <PoolMembersReload poolId={pool.id} serverMemberCount={memberList.length} />
        {memberList.length === 0 && memberCountDb != null && memberCountDb > 0 && (
          <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-950/30 p-3 text-sm text-amber-200 print:hidden">
            Hay {memberCountDb} integrantes en la polla pero no se pudieron mostrar. Comprueba{" "}
            <strong>SUPABASE_SERVICE_ROLE_KEY</strong> en Vercel y ejecuta{" "}
            <code className="text-amber-100">FIX_POOL_MEMBERS_PRODUCTION.sql</code> en Supabase.
          </p>
        )}
        <div className="mb-6 flex flex-col gap-4 print:mb-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-white print:text-black">Transparencia · {pool.name}</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400 print:text-zinc-700">
              Todos los pronósticos de quienes están en esta polla. Así nadie duda de quién dijo qué antes de cada
              partido.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <PoolTransparencyPrintBar />
            <div className="flex flex-wrap gap-2 print:hidden">
              <Link
                href={`/pool/${pool.id}`}
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-zinc-600")}
              >
                Tabla
              </Link>
              <Link
                href={`/pool/${pool.id}/predict`}
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-zinc-600")}
              >
                Mis pronósticos
              </Link>
            </div>
          </div>
        </div>

        <h2 className="mb-2 text-lg font-bold text-white print:text-black">Partidos</h2>
        <p className="mb-3 text-xs text-zinc-500 print:text-zinc-600">
          <span className="mr-1 inline-block rounded bg-green-500/20 px-2 py-0.5 text-zinc-300 print:bg-green-50 print:text-zinc-800">
            Verde
          </span>
          = puede sumar puntos por marcador. En eliminatorias (#73 en adelante), solo si tu cuadro proyectado coincide
          con el emparejamiento oficial de ese partido.
        </p>
        <div className="mb-10 overflow-x-auto rounded-xl border border-zinc-800 print:border-zinc-300">
          <table className="w-full min-w-[640px] text-left text-[11px] text-zinc-200 print:text-black sm:text-xs">
            <thead className="bg-zinc-900 text-[10px] uppercase text-zinc-500 print:bg-zinc-100 print:text-zinc-700">
              <tr>
                <th className="sticky left-0 z-10 bg-zinc-900 px-2 py-2 print:static print:bg-zinc-100">#</th>
                <th className="sticky left-8 z-10 min-w-[140px] bg-zinc-900 px-2 py-2 print:static print:bg-zinc-100">
                  Partido
                </th>
                <th className="whitespace-nowrap px-2 py-2 text-center">Real</th>
                {memberList.map((m) => {
                  const prof = profileMap.get(m.user_id);
                  const name = prof?.display_name || prof?.username || "Jugador";
                  return (
                    <th key={m.user_id} className="max-w-[72px] px-1 py-2 text-center font-normal normal-case">
                      <span className="line-clamp-2 break-words" title={name}>
                        {name}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {matchRows.map((m) => {
                const ht = m.home_team_id ? teams.get(m.home_team_id) : null;
                const at = m.away_team_id ? teams.get(m.away_team_id) : null;
                const label = `${ht?.name ?? "TBD"} vs ${at?.name ?? "TBD"}`;
                const real =
                  m.status === "finished" && m.home_score != null && m.away_score != null
                    ? fmtPred(m.home_score, m.away_score)
                    : "—";
                return (
                  <tr key={m.id} className="border-t border-zinc-800 print:border-zinc-200">
                    <td className="sticky left-0 z-10 bg-zinc-950 px-2 py-1.5 text-zinc-500 print:static print:bg-white">
                      {m.match_number}
                    </td>
                    <td className="sticky left-8 z-10 max-w-[200px] bg-zinc-950 px-2 py-1.5 font-medium text-white print:static print:bg-white print:text-black">
                      {label}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-center font-mono text-yellow-500/90 print:text-black">
                      {real}
                    </td>
                    {memberList.map((mem) => {
                      const pr = predMap.get(`${mem.user_id}:${m.id}`);
                      const canScore = isMatchScoreEligible(scoreEligibility, mem.user_id, m.id);
                      return (
                        <td
                          key={mem.user_id}
                          title={
                            canScore
                              ? "Puede sumar por marcador"
                              : m.match_number >= 73
                                ? "Emparejamiento distinto a tu cuadro proyectado"
                                : undefined
                          }
                          className={cn(
                            "px-1 py-1.5 text-center font-mono text-zinc-300 print:text-black",
                            canScore && "bg-green-500/20 print:bg-green-50"
                          )}
                        >
                          {pr ? fmtPred(pr.predicted_home_score, pr.predicted_away_score) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h2 className="mb-2 text-lg font-bold text-white print:text-black">Cuadro de honor</h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-800 print:border-zinc-300">
          <table className="w-full min-w-[520px] text-left text-[11px] text-zinc-200 print:text-black sm:text-xs">
            <thead className="bg-zinc-900 text-[10px] uppercase text-zinc-500 print:bg-zinc-100 print:text-zinc-700">
              <tr>
                <th className="sticky left-0 z-10 bg-zinc-900 px-2 py-2 print:static print:bg-zinc-100">Categoría</th>
                {truth ? (
                  <th className="whitespace-nowrap px-2 py-2 text-center normal-case">Resultado oficial</th>
                ) : null}
                {memberList.map((m) => {
                  const prof = profileMap.get(m.user_id);
                  const name = prof?.display_name || prof?.username || "Jugador";
                  return (
                    <th key={m.user_id} className="max-w-[88px] px-1 py-2 text-center font-normal normal-case">
                      <span className="line-clamp-2 break-words" title={name}>
                        {name}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {honorRows.map((row) => (
                <tr key={row.key} className="border-t border-zinc-800 print:border-zinc-200">
                  <td className="sticky left-0 z-10 bg-zinc-950 px-2 py-1.5 font-medium text-white print:static print:bg-white print:text-black">
                    {row.label}
                  </td>
                  {truth ? (
                    <td className="whitespace-nowrap px-2 py-1.5 text-center text-yellow-500/90 print:text-black">
                      {truthPick[row.key] ?? "—"}
                    </td>
                  ) : null}
                  {memberList.map((mem) => {
                    const h = honorByUser.get(mem.user_id);
                    const cell = h ? row.pick(h) : "—";
                    return (
                      <td key={mem.user_id} className="px-1 py-1.5 text-center text-zinc-300 print:text-black">
                        <span className="line-clamp-3 break-words">{cell}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!truth ? (
          <p className="mt-3 text-xs text-zinc-500 print:text-zinc-600">
            Cuando exista un resultado oficial de honor en el sistema, aparecerá la columna “Resultado oficial” para
            comparar.
          </p>
        ) : null}

        <p className="mt-10 text-center text-sm text-zinc-600 print:hidden">
          <Link href={`/pool/${pool.id}`} className="text-yellow-500 hover:underline">
            ← Volver a la polla
          </Link>
        </p>
      </main>
    </>
  );
}
