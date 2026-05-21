/**
 * Proyección de grupos y eliminatoria según pronósticos del usuario (no modifica BD).
 * R32: matriz FIFA de 495 combinaciones para los 8 mejores terceros.
 */
import matrixJson from "@/lib/data/wc2026-r32-third-matrix.json";
import { GROUP_LETTERS, type GroupMatchInput, type StandingComputed } from "@/lib/standings-compute";
import { computeGroupStandings } from "@/lib/standings-compute";

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

const GROUP_ORDER = GROUP_LETTERS;

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

export type KnockoutPair = {
  match_number: number;
  home_team_id: string | null;
  away_team_id: string | null;
};

export type ProjectionResult = {
  standingsByGroup: Record<string, StandingComputed[]>;
  knockoutPairs: KnockoutPair[];
  groupMatchesPredicted: number;
  groupMatchesTotal: number;
  groupsComplete: boolean;
  r32Ready: boolean;
  matrixOptionNo: number | null;
  missingGroupLetters: string[];
};

type MatchDb = {
  id: string;
  match_number: number;
  group_letter: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
};

function compareThirdRankings(a: StandingComputed, b: StandingComputed): number {
  if (b.points !== a.points) return b.points - a.points;
  const gdA = a.goals_for - a.goals_against;
  const gdB = b.goals_for - b.goals_against;
  if (gdB !== gdA) return gdB - gdA;
  if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
  if (a.goals_against !== b.goals_against) return a.goals_against - b.goals_against;
  return a.group_letter.localeCompare(b.group_letter);
}

function buildByGroupMap(
  standingsByGroup: Record<string, StandingComputed[]>
): Map<string, Map<number, string>> {
  const byGroup = new Map<string, Map<number, string>>();
  for (const g of GROUP_ORDER) {
    byGroup.set(g, new Map());
    for (const row of standingsByGroup[g] ?? []) {
      byGroup.get(g)!.set(row.position, row.team_id);
    }
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

function resolveRoundOf32(
  byGroup: Map<string, Map<number, string>>,
  standingsByGroup: Record<string, StandingComputed[]>
): { pairs: KnockoutPair[]; matrixOptionNo: number | null; ok: boolean } {
  const thirdRows: StandingComputed[] = [];
  for (const g of GROUP_ORDER) {
    const third = (standingsByGroup[g] ?? []).find((r) => r.position === 3);
    if (third) thirdRows.push(third);
  }
  if (thirdRows.length < 12) {
    return { pairs: [], matrixOptionNo: null, ok: false };
  }

  thirdRows.sort(compareThirdRankings);
  const top8 = thirdRows.slice(0, 8);
  const sortedKey = [...top8.map((t) => t.group_letter.toUpperCase())].sort().join("");
  const matrixRow = matrixBySortedKey.get(sortedKey);
  if (!matrixRow) {
    return { pairs: [], matrixOptionNo: null, ok: false };
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

  for (const { slotIndex, matchNumber } of MATRIX_SLOT_TO_MATCH) {
    const letter = matrixRow.slotThirdLetters[slotIndex]!.toUpperCase();
    const thirdId = thirdTeamByLetter.get(letter);
    const p = pairs.find((x) => x.mn === matchNumber);
    if (p) p.away = thirdId ?? null;
  }

  for (const p of pairs) {
    if (!p.home || !p.away) {
      return { pairs: [], matrixOptionNo: matrixRow.optionNo, ok: false };
    }
  }

  return {
    pairs: pairs.map((p) => ({
      match_number: p.mn,
      home_team_id: p.home,
      away_team_id: p.away,
    })),
    matrixOptionNo: matrixRow.optionNo,
    ok: true,
  };
}

function winnerFromScores(
  homeId: string | null,
  awayId: string | null,
  homeScore: number,
  awayScore: number
): string | null {
  if (!homeId || !awayId) return null;
  if (homeScore > awayScore) return homeId;
  if (awayScore > homeScore) return awayId;
  return null;
}

function propagateKnockout(
  initial: Map<number, KnockoutPair>,
  predictionsByMn: Map<number, { home: number; away: number }>
): Map<number, KnockoutPair> {
  const byMn = new Map(initial);

  const getPair = (mn: number): KnockoutPair => {
    if (!byMn.has(mn)) {
      byMn.set(mn, { match_number: mn, home_team_id: null, away_team_id: null });
    }
    return byMn.get(mn)!;
  };

  const trySet = (mn: number, homeId: string | null, awayId: string | null) => {
    if (!homeId || !awayId) return;
    const p = getPair(mn);
    p.home_team_id = homeId;
    p.away_team_id = awayId;
  };

  for (let iter = 0; iter < 24; iter++) {
    let changed = false;

    const feed = (feeders: Record<number, [number, number]>) => {
      for (const [mn, [a, b]] of Object.entries(feeders)) {
        const ma = getPair(a);
        const mb = getPair(b);
        const predA = predictionsByMn.get(a);
        const predB = predictionsByMn.get(b);
        if (!predA || !predB) continue;
        const wa = winnerFromScores(ma.home_team_id, ma.away_team_id, predA.home, predA.away);
        const wb = winnerFromScores(mb.home_team_id, mb.away_team_id, predB.home, predB.away);
        if (!wa || !wb) continue;
        const before = getPair(Number(mn));
        trySet(Number(mn), wa, wb);
        const after = getPair(Number(mn));
        if (before.home_team_id !== after.home_team_id || before.away_team_id !== after.away_team_id) {
          changed = true;
        }
      }
    };

    feed(R16_FEEDERS);
    feed(QF_FEEDERS);
    feed(SF_FEEDERS);

    const m101 = getPair(101);
    const m102 = getPair(102);
    const p101 = predictionsByMn.get(101);
    const p102 = predictionsByMn.get(102);
    if (p101 && p102) {
      const w101 = winnerFromScores(m101.home_team_id, m101.away_team_id, p101.home, p101.away);
      const w102 = winnerFromScores(m102.home_team_id, m102.away_team_id, p102.home, p102.away);
      const l101 =
        w101 && m101.home_team_id && m101.away_team_id
          ? w101 === m101.home_team_id
            ? m101.away_team_id
            : m101.home_team_id
          : null;
      const l102 =
        w102 && m102.home_team_id && m102.away_team_id
          ? w102 === m102.home_team_id
            ? m102.away_team_id
            : m102.home_team_id
          : null;
      if (l101 && l102) {
        const b103 = getPair(103);
        trySet(103, l101, l102);
        if (b103.home_team_id !== l101 || b103.away_team_id !== l102) changed = true;
      }
      if (w101 && w102) {
        const b104 = getPair(104);
        trySet(104, w101, w102);
        if (b104.home_team_id !== w101 || b104.away_team_id !== w102) changed = true;
      }
    }

    if (!changed) break;
  }

  return byMn;
}

export function buildPredictionProjection(
  allMatches: MatchDb[],
  predictions: Map<string, { home: number; away: number }>
): ProjectionResult {
  const groupMatches = allMatches.filter((m) => m.group_letter);
  const koMatches = allMatches.filter((m) => m.match_number >= 73 && m.match_number <= 104);

  const standingsByGroup: Record<string, StandingComputed[]> = {};
  const missingGroupLetters: string[] = [];
  let groupMatchesPredicted = 0;
  const groupMatchesTotal = groupMatches.length;

  for (const letter of GROUP_ORDER) {
    const letterMatches = groupMatches.filter((m) => m.group_letter === letter);
    const played: GroupMatchInput[] = [];
    for (const m of letterMatches) {
      if (!m.home_team_id || !m.away_team_id) continue;
      const pred = predictions.get(m.id);
      if (!pred) continue;
      groupMatchesPredicted += 1;
      played.push({
        home_team_id: m.home_team_id,
        away_team_id: m.away_team_id,
        home_score: pred.home,
        away_score: pred.away,
      });
    }
    if (played.length < letterMatches.length) {
      missingGroupLetters.push(letter);
    }
    standingsByGroup[letter] = computeGroupStandings(letter, played);
  }

  const groupsComplete = missingGroupLetters.length === 0;
  const byGroup = buildByGroupMap(standingsByGroup);
  const { pairs: r32Pairs, matrixOptionNo, ok: r32Ready } = resolveRoundOf32(byGroup, standingsByGroup);

  const koMap = new Map<number, KnockoutPair>();
  for (const p of r32Pairs) {
    koMap.set(p.match_number, { ...p });
  }

  const predictionsByMn = new Map<number, { home: number; away: number }>();
  for (const m of koMatches) {
    const pred = predictions.get(m.id);
    if (pred) predictionsByMn.set(m.match_number, pred);
  }

  const propagated =
    r32Ready && predictionsByMn.size > 0
      ? propagateKnockout(koMap, predictionsByMn)
      : koMap;

  const knockoutPairs = Array.from(propagated.values()).sort(
    (a, b) => a.match_number - b.match_number
  );

  return {
    standingsByGroup,
    knockoutPairs,
    groupMatchesPredicted,
    groupMatchesTotal,
    groupsComplete,
    r32Ready,
    matrixOptionNo,
    missingGroupLetters,
  };
}
