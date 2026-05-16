import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { createServerSupabase } from "@/lib/supabase/server";
import { MatchCard, type MatchCardMatch } from "@/components/tournament/MatchCard";
import { GroupStandingsTable } from "@/components/tournament/GroupStandingsTable";

const GROUPS = "ABCDEFGHIJKL".split("");

export const dynamic = "force-dynamic";

export default async function FixturePage({
  searchParams,
}: {
  searchParams: { g?: string; ph?: string };
}) {
  const sp = searchParams;
  const group = (sp.g ?? "A").toUpperCase().slice(0, 1);
  const activePhaseSlug = sp.ph ?? "groups";

  const supabase = await createServerSupabase();

  const { data: phases } = await supabase
    .from("phases")
    .select("id, name, slug, order_index")
    .order("order_index");

  const phaseRows = phases ?? [];
  const phase = phaseRows.find((p) => p.slug === activePhaseSlug) ?? phaseRows[0];

  if (!phase) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-4xl px-4 py-16 text-zinc-400">
          <p>No hay fases en la base de datos. Ejecuta el SQL y el seed.</p>
        </main>
      </>
    );
  }

  const { data: matchesRaw } = await supabase
    .from("matches")
    .select("*")
    .eq("phase_id", phase.id)
    .order("match_number");

  const { data: teams } = await supabase.from("teams").select("id, name, code");
  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]));

  let filtered = matchesRaw ?? [];
  if (phase.slug === "groups") {
    const g = GROUPS.includes(group) ? group : "A";
    filtered = filtered.filter((m) => m.group_letter === g);
  }

  const matches: MatchCardMatch[] = filtered.map((m) => ({
    ...m,
    phase: { name: phase.name, slug: phase.slug },
    home_team: m.home_team_id ? teamMap.get(m.home_team_id) ?? null : null,
    away_team: m.away_team_id ? teamMap.get(m.away_team_id) ?? null : null,
  }));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-black text-white">Fixture</h1>
        <p className="mb-6 text-sm text-zinc-400">
          Actualiza el seed cuando FIFA publique el calendario definitivo.
        </p>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {phaseRows.map((p) => (
            <Link
              key={p.slug}
              href={
                p.slug === "groups"
                  ? `/fixture?ph=${p.slug}&g=${group}`
                  : `/fixture?ph=${p.slug}`
              }
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                p.slug === phase.slug
                  ? "bg-yellow-500 text-black"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {p.name}
            </Link>
          ))}
        </div>

        {phase.slug === "groups" && (
          <div className="mb-4 flex gap-1 overflow-x-auto">
            {GROUPS.map((g) => (
              <Link
                key={g}
                href={`/fixture?ph=groups&g=${g}`}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold transition-all ${
                  g === group ? "bg-yellow-500 text-black" : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {g}
              </Link>
            ))}
          </div>
        )}

        {phase.slug === "groups" && (
          <div className="mb-6">
            <GroupStandingsTable groupLetter={group} />
          </div>
        )}

        <div className="grid gap-3">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>

        {matches.length === 0 && (
          <p className="text-sm text-zinc-500">No hay partidos para este filtro.</p>
        )}

        <p className="mt-8 text-center text-xs text-zinc-600">
          <Link href="/" className="text-yellow-500 hover:underline">
            Volver al inicio
          </Link>
        </p>
      </main>
    </>
  );
}
