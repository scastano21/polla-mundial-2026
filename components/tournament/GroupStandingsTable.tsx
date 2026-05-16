import { createServerSupabase } from "@/lib/supabase/server";
import { Flag } from "@/components/tournament/TeamDisplay";

export type StandingRow = {
  team_id: string;
  position: number | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  points: number;
  team?: { name: string; code: string } | null;
};

export async function GroupStandingsTable({ groupLetter }: { groupLetter: string }) {
  const supabase = await createServerSupabase();
  const { data: rowsRaw } = await supabase
    .from("group_standings")
    .select("team_id, position, played, won, drawn, lost, goals_for, goals_against, points")
    .eq("group_letter", groupLetter)
    .order("position", { ascending: true });

  const rows = rowsRaw ?? [];
  const ids = rows.map((r) => r.team_id);
  const teamMap = new Map<string, { name: string; code: string }>();
  if (ids.length) {
    const { data: teams } = await supabase.from("teams").select("id, name, code").in("id", ids);
    for (const t of teams ?? []) teamMap.set(t.id, t);
  }

  const merged: StandingRow[] = rows.map((r) => ({
    ...r,
    team: teamMap.get(r.team_id) ?? null,
  }));

  if (merged.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-700 p-4 text-sm text-zinc-500">
        Tabla de posiciones vacía. Los puntos aparecen cuando el admin registre resultados de fase de
        grupos.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-900 text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Equipo</th>
            <th className="px-3 py-2 text-center">PJ</th>
            <th className="px-3 py-2 text-center">G</th>
            <th className="px-3 py-2 text-center">E</th>
            <th className="px-3 py-2 text-center">P</th>
            <th className="px-3 py-2 text-center">GF</th>
            <th className="px-3 py-2 text-center">GC</th>
            <th className="px-3 py-2 text-center">DG</th>
            <th className="px-3 py-2 text-center font-bold text-yellow-400">Pts</th>
          </tr>
        </thead>
        <tbody>
          {merged.map((r) => (
            <tr key={r.team_id} className="border-t border-zinc-800 bg-zinc-950/50">
              <td className="px-3 py-2 text-zinc-400">{r.position ?? "—"}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2 font-semibold">
                  {r.team ? (
                    <>
                      <Flag code={r.team.code} name={r.team.name} size="xs" />
                      <span>{r.team.name}</span>
                    </>
                  ) : (
                    "—"
                  )}
                </div>
              </td>
              <td className="px-3 py-2 text-center">{r.played}</td>
              <td className="px-3 py-2 text-center">{r.won}</td>
              <td className="px-3 py-2 text-center">{r.drawn}</td>
              <td className="px-3 py-2 text-center">{r.lost}</td>
              <td className="px-3 py-2 text-center">{r.goals_for}</td>
              <td className="px-3 py-2 text-center">{r.goals_against}</td>
              <td className="px-3 py-2 text-center">{r.goals_for - r.goals_against}</td>
              <td className="px-3 py-2 text-center font-bold text-white">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
