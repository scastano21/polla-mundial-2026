import { NextResponse } from "next/server";
import { fetchTournamentLockState } from "@/lib/tournament-lock";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createServerSupabase();
  const state = await fetchTournamentLockState(supabase);
  return NextResponse.json(state);
}
