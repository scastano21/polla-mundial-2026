import type { SupabaseClient } from "@supabase/supabase-js";

type Standing = {
  team_id: string;
  group_letter: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  points: number;
};

function emptyStanding(teamId: string, groupLetter: string): Standing {
  return {
    team_id: teamId,
    group_letter: groupLetter,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goals_for: 0,
    goals_against: 0,
    points: 0,
  };
}

function applyMatch(
  map: Map<string, Standing>,
  homeId: string,
  awayId: string,
  groupLetter: string,
  homeScore: number,
  awayScore: number
) {
  if (!map.has(homeId)) map.set(homeId, emptyStanding(homeId, groupLetter));
  if (!map.has(awayId)) map.set(awayId, emptyStanding(awayId, groupLetter));
  const h = map.get(homeId)!;
  const a = map.get(awayId)!;

  h.played += 1;
  a.played += 1;
  h.goals_for += homeScore;
  h.goals_against += awayScore;
  a.goals_for += awayScore;
  a.goals_against += homeScore;

  if (homeScore > awayScore) {
    h.won += 1;
    h.points += 3;
    a.lost += 1;
  } else if (homeScore < awayScore) {
    a.won += 1;
    a.points += 3;
    h.lost += 1;
  } else {
    h.drawn += 1;
    a.drawn += 1;
    h.points += 1;
    a.points += 1;
  }
}

/** Reconstruye standings desde cero para un grupo (evita doble conteo al corregir resultados). */
export async function rebuildGroupStandings(
  supabase: SupabaseClient,
  groupLetter: string
): Promise<void> {
  const { data: phase } = await supabase
    .from("phases")
    .select("id")
    .eq("slug", "groups")
    .single();
  if (!phase) throw new Error("Fase groups no encontrada");

  const { data: teams } = await supabase
    .from("teams")
    .select("id")
    .eq("group_letter", groupLetter);
  const teamIds = (teams ?? []).map((t) => t.id);
  if (teamIds.length === 0) return;

  await supabase.from("group_standings").delete().in("team_id", teamIds);

  const { data: matches } = await supabase
    .from("matches")
    .select("id, home_team_id, away_team_id, home_score, away_score, group_letter")
    .eq("phase_id", phase.id)
    .eq("group_letter", groupLetter)
    .eq("status", "finished");

  const map = new Map<string, Standing>();
  for (const m of matches ?? []) {
    if (
      m.home_team_id &&
      m.away_team_id &&
      m.home_score != null &&
      m.away_score != null
    ) {
      applyMatch(
        map,
        m.home_team_id,
        m.away_team_id,
        groupLetter,
        m.home_score,
        m.away_score
      );
    }
  }

  const rows = Array.from(map.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goals_for - a.goals_against;
    const gdB = b.goals_for - b.goals_against;
    if (gdB !== gdA) return gdB - gdA;
    return b.goals_for - a.goals_for;
  });

  let position = 1;
  for (const r of rows) {
    await supabase.from("group_standings").insert({
      ...r,
      position: position++,
      updated_at: new Date().toISOString(),
    });
  }
}

const GROUP_LETTERS = "ABCDEFGHIJKL".split("");

/** Reconstruye standings de los 12 grupos (tras cerrar la fase de grupos o para recalcular cruces). */
export async function rebuildAllGroupStandings(supabase: SupabaseClient): Promise<void> {
  for (const letter of GROUP_LETTERS) {
    await rebuildGroupStandings(supabase, letter);
  }
}
