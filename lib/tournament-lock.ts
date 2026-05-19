import type { SupabaseClient } from "@supabase/supabase-js";

/** Partido inaugural (México vs Sudáfrica, #1). */
export const INAUGURAL_MATCH_NUMBER = 1;

/** Pronósticos permitidos hasta N minutos antes del pitazo inaugural. */
export const MINUTES_BEFORE_INAUGURAL = 5;

/** Respaldo si la BD aún no tiene partidos (12:00 CDMX, 11 jun 2026). */
export const FALLBACK_INAUGURAL_KICKOFF_ISO = "2026-06-11T18:00:00.000Z";

export type TournamentLockState = {
  open: boolean;
  deadlineIso: string;
  inauguralIso: string;
  inauguralLabel: string;
  msRemaining: number;
};

export function deadlineFromKickoff(kickoffIso: string): Date {
  const kickoff = new Date(kickoffIso);
  return new Date(kickoff.getTime() - MINUTES_BEFORE_INAUGURAL * 60_000);
}

export function lockStateFromKickoff(
  kickoffIso: string,
  now: Date = new Date()
): TournamentLockState {
  const kickoff = new Date(kickoffIso);
  const deadline = deadlineFromKickoff(kickoffIso);
  const open = now.getTime() < deadline.getTime();
  return {
    open,
    deadlineIso: deadline.toISOString(),
    inauguralIso: kickoff.toISOString(),
    inauguralLabel: formatKickoffEs(kickoff),
    msRemaining: Math.max(0, deadline.getTime() - now.getTime()),
  };
}

export function formatKickoffEs(d: Date): string {
  return d.toLocaleString("es-CO", {
    timeZone: "America/Mexico_City",
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDeadlineEs(d: Date): string {
  return d.toLocaleString("es-CO", {
    timeZone: "America/Mexico_City",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export async function fetchInauguralKickoffIso(
  supabase: SupabaseClient
): Promise<string> {
  const { data: inaugural } = await supabase
    .from("matches")
    .select("match_date")
    .eq("match_number", INAUGURAL_MATCH_NUMBER)
    .maybeSingle();

  if (inaugural?.match_date) return inaugural.match_date;

  const { data: first } = await supabase
    .from("matches")
    .select("match_date")
    .order("match_number", { ascending: true })
    .limit(1)
    .maybeSingle();

  return first?.match_date ?? FALLBACK_INAUGURAL_KICKOFF_ISO;
}

export async function fetchTournamentLockState(
  supabase: SupabaseClient,
  now: Date = new Date()
): Promise<TournamentLockState> {
  const kickoffIso = await fetchInauguralKickoffIso(supabase);
  return lockStateFromKickoff(kickoffIso, now);
}

export function isHonorPredictionComplete(row: {
  champion_team_id: string | null;
  runner_up_team_id: string | null;
  third_place_team_id: string | null;
  top_scorer_name: string | null;
  best_player_name: string | null;
  best_goalkeeper_name: string | null;
  best_young_player_name: string | null;
}): boolean {
  return (
    !!row.champion_team_id &&
    !!row.runner_up_team_id &&
    !!row.third_place_team_id &&
    !!row.top_scorer_name?.trim() &&
    !!row.best_player_name?.trim() &&
    !!row.best_goalkeeper_name?.trim() &&
    !!row.best_young_player_name?.trim()
  );
}
