import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PoolScoringBlurb } from "@/components/pool/pool-scoring-blurb";
import { SiteHeader } from "@/components/site-header";
import { createServerSupabase } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  const { data: members } = await supabase
    .from("pool_members")
    .select("user_id, total_points, exact_scores, correct_results, rank")
    .eq("pool_id", pool.id)
    .order("total_points", { ascending: false });

  const userIds = Array.from(new Set((members ?? []).map((m) => m.user_id)));
  const profileMap = new Map<string, { display_name: string | null; username: string }>();
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, username")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      profileMap.set(p.id, {
        display_name: p.display_name,
        username: p.username,
      });
    }
  }

  const isAdmin = pool.admin_id === user.id;

  const { data: rulesRow } = await supabase
    .from("scoring_rules")
    .select(
      "exact_score_points, correct_result_points, correct_champion, correct_runner_up, correct_third_place, correct_top_scorer, correct_best_player, correct_best_goalkeeper, correct_best_young"
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

        <PoolScoringBlurb rules={rulesRow} />

        <h2 className="mb-3 text-lg font-bold text-white">Tabla</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Jugador</th>
                <th className="px-3 py-2 text-center">Pts</th>
                <th className="px-3 py-2 text-center">Exactos</th>
                <th className="px-3 py-2 text-center">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {(members ?? []).map((m, i) => {
                const prof = profileMap.get(m.user_id);
                const name = prof?.display_name || prof?.username || "Jugador";
                return (
                  <tr key={m.user_id} className="border-t border-zinc-800">
                    <td className="px-3 py-2 text-zinc-400">{m.rank ?? i + 1}</td>
                    <td className="px-3 py-2 font-medium text-white">{name}</td>
                    <td className="px-3 py-2 text-center font-bold text-yellow-400">{m.total_points}</td>
                    <td className="px-3 py-2 text-center text-zinc-400">{m.exact_scores}</td>
                    <td className="px-3 py-2 text-center text-zinc-400">{m.correct_results}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-8 text-center text-sm text-zinc-600">
          <Link href="/dashboard" className="text-yellow-500 hover:underline">
            ← Volver al panel
          </Link>
        </p>
      </main>
    </>
  );
}
