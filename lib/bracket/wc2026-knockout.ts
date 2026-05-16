/**
 * Cruces automáticos Mundial 2026 (48 equipos): R32 según FIFA / Wikipedia Annex C,
 * fases siguientes por ganador/perdedor de partido (match_number 73–104).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import matrixJson from "@/lib/data/wc2026-r32-third-matrix.json";
import { rebuildAllGroupStandings } from "@/lib/rebuild-standings";

type MatrixRow = {
  optionNo: number;
  thirdsIn: string;
  sortedKey: string;
  slotThirdLetters: string;
};

const matrixBySortedKey = new Map<string, MatrixRow>();
for (const r of matrixJson as MatrixRow[]) {
  matrixBySortedKey.set(r.sortedKey, r);
}

type DbMatch = {
  id: string;
  match_number: number;
  status: string;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  home_penalties: number | null;
  away_penalties: number | null;
  elimination_slot_label: string | null;
};

type StandingRow = {
  team_id: string;
  group_letter: string;
  position: number;
  points: number;
  goals_for: number;
  goals_against: number;
};

const GROUP_ORDER = "ABCDEFGHIJKL".split("");

/** R16: [home feeder mn, away feeder mn] */
const R16_FEEDERS: Record<number, [number, number]> = {
  89: [74, 77],
  90: [73, 75],
  91: [76, 78],
  92: [79, 80],
  93: [83, 84],
  94: [81, 82],
  95: [86, 88],
  96: [85, 87],
};

const QF_FEEDERS: Record<number, [number, number]> = {
  97: [89, 90],
  98: [93, 94],
  99: [91, 92],
  100: [95, 96],
};

const SF_FEEDERS: Record<number, [number, number]> = {
  101: [97, 98],
  102: [99, 100],
};

/** Índice en slotThirdLetters (tabla FIFA) → match_number R32 con 1º vs 3º */
const MATRIX_SLOT_TO_MATCH: { slotIndex: number; matchNumber: number }[] = [
  { slotIndex: 0, matchNumber: 79 },
  { slotIndex: 1, matchNumber: 85 },
  { slotIndex: 2, matchNumber: 81 },
  { slotIndex: 3, matchNumber: 74 },
  { slotIndex: 4, matchNumber: 82 },
  { slotIndex: 5, matchNumber: 77 },
  { slotIndex: 6, matchNumber: 87 },
  { slotIndex: 7, matchNumber: 80 },
];

export async function allGroupMatchesFinished(supabase: SupabaseClient): Promise<boolean> {
  const { data: phase } = await supabase.from("phases").select("id").eq("slug", "groups").maybeSingle();
  if (!phase) return false;
  const { count, error } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("phase_id", phase.id)
    .neq("status", "finished");
  if (error) return false;
  return (count ?? 0) === 0;
}

function compareThirdRankings(a: StandingRow, b: StandingRow): number {
  if (b.points !== a.points) return b.points - a.points;
  const gdA = a.goals_for - a.goals_against;
  const gdB = b.goals_for - b.goals_against;
  if (gdB !== gdA) return gdB - gdA;
  if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
  if (a.goals_against !== b.goals_against) return a.goals_against - b.goals_against;
  return a.group_letter.localeCompare(b.group_letter);
}

async function loadStandingsMap(supabase: SupabaseClient): Promise<Map<string, Map<number, string>>> {
  const { data: rows, error } = await supabase
    .from("group_standings")
    .select("team_id, group_letter, position, points, goals_for, goals_against");
  if (error) throw error;
  const byGroup = new Map<string, Map<number, string>>();
  for (const g of GROUP_ORDER) {
    byGroup.set(g, new Map());
  }
  for (const r of (rows ?? []) as StandingRow[]) {
    const letter = (r.group_letter || "").toUpperCase();
    const m = byGroup.get(letter);
    if (m) m.set(r.position, r.team_id);
  }
  return byGroup;
}

function teamAt(
  byGroup: Map<string, Map<number, string>>,
  groupLetter: string,
  position: number
): string | null {
  return byGroup.get(groupLetter.toUpperCase())?.get(position) ?? null;
}

function winnerLoserIds(m: DbMatch): { winnerId: string | null; loserId: string | null } {
  if (m.status !== "finished" || m.home_score == null || m.away_score == null) {
    return { winnerId: null, loserId: null };
  }
  if (m.home_score > m.away_score) {
    return { winnerId: m.home_team_id, loserId: m.away_team_id };
  }
  if (m.home_score < m.away_score) {
    return { winnerId: m.away_team_id, loserId: m.home_team_id };
  }
  const hp = m.home_penalties ?? 0;
  const ap = m.away_penalties ?? 0;
  if (hp > ap) return { winnerId: m.home_team_id, loserId: m.away_team_id };
  if (ap > hp) return { winnerId: m.away_team_id, loserId: m.home_team_id };
  return { winnerId: null, loserId: null };
}

/**
 * Rellena partidos 73–88 con equipos según tabla de grupos + matriz FIFA (495 combinaciones).
 * Solo actualiza filas en `scheduled` sin marcador.
 */
export async function fillRoundOf32FromGroupStandings(supabase: SupabaseClient): Promise<{
  ok: boolean;
  message: string;
  updated: number;
}> {
  const finished = await allGroupMatchesFinished(supabase);
  if (!finished) {
    return { ok: false, message: "Aún hay partidos de grupo sin finalizar.", updated: 0 };
  }

  await rebuildAllGroupStandings(supabase);
  const byGroup = await loadStandingsMap(supabase);

  const { data: thirdStandings, error: tErr } = await supabase
    .from("group_standings")
    .select("team_id, group_letter, position, points, goals_for, goals_against")
    .eq("position", 3);
  if (tErr) throw tErr;
  const thirdRows = (thirdStandings ?? []) as StandingRow[];
  if (thirdRows.length < 12) {
    return { ok: false, message: "Faltan filas de 3º lugar en group_standings (¿grupos incompletos?).", updated: 0 };
  }
  thirdRows.sort(compareThirdRankings);
  const top8 = thirdRows.slice(0, 8);

  const sortedKey = [...top8.map((t) => t.group_letter.toUpperCase())].sort().join("");
  const matrixRow = matrixBySortedKey.get(sortedKey);
  if (!matrixRow) {
    return {
      ok: false,
      message: `No hay fila FIFA para la combinación de terceros: ${sortedKey}`,
      updated: 0,
    };
  }

  const thirdTeamByLetter = new Map<string, string>();
  for (const t of top8) {
    thirdTeamByLetter.set(t.group_letter.toUpperCase(), t.team_id);
  }

  type Pair = { mn: number; home: string | null; away: string | null };
  const pairs: Pair[] = [
    { mn: 73, home: teamAt(byGroup, "A", 2), away: teamAt(byGroup, "B", 2) },
    { mn: 74, home: teamAt(byGroup, "E", 1), away: null },
    { mn: 75, home: teamAt(byGroup, "F", 1), away: teamAt(byGroup, "C", 2) },
    { mn: 76, home: teamAt(byGroup, "C", 1), away: teamAt(byGroup, "F", 2) },
    { mn: 77, home: teamAt(byGroup, "I", 1), away: null },
    { mn: 78, home: teamAt(byGroup, "E", 2), away: teamAt(byGroup, "I", 2) },
    { mn: 79, home: teamAt(byGroup, "A", 1), away: null },
    { mn: 80, home: teamAt(byGroup, "L", 1), away: null },
    { mn: 81, home: teamAt(byGroup, "D", 1), away: null },
    { mn: 82, home: teamAt(byGroup, "G", 1), away: null },
    { mn: 83, home: teamAt(byGroup, "K", 2), away: teamAt(byGroup, "L", 2) },
    { mn: 84, home: teamAt(byGroup, "H", 1), away: teamAt(byGroup, "J", 2) },
    { mn: 85, home: teamAt(byGroup, "B", 1), away: null },
    { mn: 86, home: teamAt(byGroup, "J", 1), away: teamAt(byGroup, "H", 2) },
    { mn: 87, home: teamAt(byGroup, "K", 1), away: null },
    { mn: 88, home: teamAt(byGroup, "D", 2), away: teamAt(byGroup, "G", 2) },
  ];

  const slotLetters = matrixRow.slotThirdLetters;
  for (const { slotIndex, matchNumber } of MATRIX_SLOT_TO_MATCH) {
    const letter = slotLetters[slotIndex]!.toUpperCase();
    const thirdId = thirdTeamByLetter.get(letter);
    const p = pairs.find((x) => x.mn === matchNumber);
    if (p) p.away = thirdId ?? null;
  }

  let updated = 0;
  for (const p of pairs) {
    if (!p.home || !p.away) {
      return {
        ok: false,
        message: `No se pudo resolver el partido ${p.mn} (home/away null).`,
        updated: 0,
      };
    }
  }

  const { data: r32Rows, error: r32Err } = await supabase
    .from("matches")
    .select("id, match_number, status, home_score, away_score, home_team_id, away_team_id")
    .in("match_number", pairs.map((p) => p.mn));
  if (r32Err) throw r32Err;
  const byMn = new Map((r32Rows ?? []).map((r) => [r.match_number, r]));

  for (const p of pairs) {
    const row = byMn.get(p.mn);
    if (!row) continue;
    if (row.status !== "scheduled" || row.home_score != null || row.away_score != null) {
      continue;
    }
    if (row.home_team_id === p.home && row.away_team_id === p.away) {
      continue;
    }
    const { error: upErr } = await supabase
      .from("matches")
      .update({
        home_team_id: p.home,
        away_team_id: p.away,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    if (upErr) throw upErr;
    updated++;
  }

  return {
    ok: true,
    message:
      updated > 0
        ? `R32: ${updated} partido(s) actualizados con equipos (FIFA opción ${matrixRow.optionNo}).`
        : "R32: cruces ya estaban asignados (sin cambios).",
    updated,
  };
}

async function loadKnockoutMatches(supabase: SupabaseClient): Promise<Map<number, DbMatch>> {
  const { data: phases } = await supabase.from("phases").select("id, slug").neq("slug", "groups");
  const phaseIds = (phases ?? []).map((p) => p.id);
  if (!phaseIds.length) return new Map();
  const { data: matches, error } = await supabase
    .from("matches")
    .select(
      "id, match_number, status, home_team_id, away_team_id, home_score, away_score, home_penalties, away_penalties, elimination_slot_label"
    )
    .in("phase_id", phaseIds)
    .gte("match_number", 73)
    .lte("match_number", 104);
  if (error) throw error;
  return new Map((matches ?? []).map((m) => [(m as DbMatch).match_number, m as DbMatch]));
}

/**
 * Propaga ganadores/perdedores a octavos en adelante. Repite hasta estabilizar.
 */
export async function propagateKnockoutFromResults(supabase: SupabaseClient): Promise<number> {
  let totalUpdates = 0;
  for (let iter = 0; iter < 24; iter++) {
    const byMn = await loadKnockoutMatches(supabase);
    let changed = false;

    const tryUpdate = async (mn: number, homeId: string | null, awayId: string | null) => {
      const m = byMn.get(mn);
      if (!m || m.status !== "scheduled") return;
      if (m.home_score != null || m.away_score != null) return;
      if (!homeId || !awayId) return;
      if (m.home_team_id === homeId && m.away_team_id === awayId) return;
      const { error } = await supabase
        .from("matches")
        .update({
          home_team_id: homeId,
          away_team_id: awayId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", m.id);
      if (error) throw error;
      totalUpdates++;
      changed = true;
    };

    for (const [mn, [a, b]] of Object.entries(R16_FEEDERS)) {
      const ma = byMn.get(a);
      const mb = byMn.get(b);
      if (!ma || !mb) continue;
      const wa = winnerLoserIds(ma).winnerId;
      const wb = winnerLoserIds(mb).winnerId;
      await tryUpdate(Number(mn), wa, wb);
    }

    for (const [mn, [a, b]] of Object.entries(QF_FEEDERS)) {
      const ma = byMn.get(a);
      const mb = byMn.get(b);
      if (!ma || !mb) continue;
      const wa = winnerLoserIds(ma).winnerId;
      const wb = winnerLoserIds(mb).winnerId;
      await tryUpdate(Number(mn), wa, wb);
    }

    for (const [mn, [a, b]] of Object.entries(SF_FEEDERS)) {
      const ma = byMn.get(a);
      const mb = byMn.get(b);
      if (!ma || !mb) continue;
      const wa = winnerLoserIds(ma).winnerId;
      const wb = winnerLoserIds(mb).winnerId;
      await tryUpdate(Number(mn), wa, wb);
    }

    const m101 = byMn.get(101);
    const m102 = byMn.get(102);
    if (m101 && m102) {
      const l101 = winnerLoserIds(m101).loserId;
      const l102 = winnerLoserIds(m102).loserId;
      await tryUpdate(103, l101, l102);
      const w101 = winnerLoserIds(m101).winnerId;
      const w102 = winnerLoserIds(m102).winnerId;
      await tryUpdate(104, w101, w102);
    }

    if (!changed) break;
  }

  return totalUpdates;
}

/**
 * Tras guardar un resultado: si ya cerró la fase de grupos, asigna R32; luego propaga KO.
 */
export async function tryAdvanceWorldCupBracket(supabase: SupabaseClient): Promise<{
  r32: { ok: boolean; message: string; updated: number };
  propagated: number;
}> {
  let r32 = { ok: true, message: "", updated: 0 };
  if (await allGroupMatchesFinished(supabase)) {
    r32 = await fillRoundOf32FromGroupStandings(supabase);
  }
  const propagated = await propagateKnockoutFromResults(supabase);
  return { r32, propagated };
}
