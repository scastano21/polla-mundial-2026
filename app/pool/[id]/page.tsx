import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PoolScoringBlurb } from "@/components/pool/pool-scoring-blurb";
import { SiteHeader } from "@/components/site-header";
import { PoolLeaderboardTable } from "@/components/pool/pool-leaderboard-table";
import { countPoolMembers, fetchPoolLeaderboard } from "@/lib/pool-leaderboard";
import { createServerSupabase } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TournamentLockBanner } from "@/components/tournament-lock-banner";
import { PredictionProgress } from "@/components/pool/prediction-progress";
import { fetchTournamentLockState } from "@/lib/tournament-lock";

export const dynamic = "force-dynamic";

export default async function PoolDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/pool/${params.id}`);

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

  const [leaderboard, memberCountDb, lockState] = await Promise.all([
    fetchPoolLeaderboard(supabase, pool.id),
    countPoolMembers(pool.id),
    fetchTournamentLockState(supabase),
  ]);

  const isAdmin = pool.admin_id === user.id;

  const { data: rulesRow } = await supabase
    .from("scoring_rules")
    .select(
      "exact_score_points, correct_result_points, advancement_team_points, correct_champion, correct_runner_up, correct_third_place, correct_top_scorer, correct_best_player, correct_best_goalkeeper, correct_best_young"
    )
    .eq("pool_id", pool.id)
    .maybeSingle();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white">{pool.name}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Código:{" "}
              <span className="font-mono font-bold text-yellow-400">{pool.invite_code}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/pool/${pool.id}/predict`}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-zinc-600")}
            >
              Pronósticos
            </Link>
            <Link
              href={`/pool/${pool.id}/transparency`}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-zinc-600")}
            >
              Transparencia
            </Link>
            <Link
              href={`/pool/${pool.id}/honor`}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-zinc-600")}
            >
              Cuadro de honor
            </Link>
            {isAdmin && (
              <Link
                href={`/pool/${pool.id}/settings`}
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-zinc-600")}
              >
                Ajustes
              </Link>
            )}
          </div>
        </div>

        <TournamentLockBanner className="mb-4" />
        {lockState.open && <PredictionProgress poolId={pool.id} className="mb-4" />}

        <h2 className="mb-3 text-lg font-bold text-white">Tabla</h2>
        <PoolLeaderboardTable
          poolId={pool.id}
          initialRows={leaderboard}
          memberCountHint={memberCountDb}
        />

        <PoolScoringBlurb rules={rulesRow} className="mt-6" />

        <p className="mt-8 text-center text-sm text-zinc-600">
          <Link href="/dashboard" className="text-yellow-500 hover:underline">
            ← Volver al panel
          </Link>
        </p>
      </main>
    </>
  );
}
