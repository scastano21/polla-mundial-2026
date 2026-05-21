/** Cálculo puro de tablas de grupos (oficial o según pronósticos). */

export type StandingComputed = {
  team_id: string;
  group_letter: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  points: number;
  position: number;
};

export type GroupMatchInput = {
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
};

type Standing = Omit<StandingComputed, "position">;

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

export function applyGroupMatch(
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

function sortStandings(rows: Standing[]): StandingComputed[] {
  const sorted = [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goals_for - a.goals_against;
    const gdB = b.goals_for - b.goals_against;
    if (gdB !== gdA) return gdB - gdA;
    return b.goals_for - a.goals_for;
  });
  return sorted.map((r, i) => ({ ...r, position: i + 1 }));
}

export function computeGroupStandings(
  groupLetter: string,
  playedMatches: GroupMatchInput[]
): StandingComputed[] {
  const map = new Map<string, Standing>();
  for (const m of playedMatches) {
    applyGroupMatch(map, m.home_team_id, m.away_team_id, groupLetter, m.home_score, m.away_score);
  }
  return sortStandings(Array.from(map.values()));
}

export const GROUP_LETTERS = "ABCDEFGHIJKL".split("");
