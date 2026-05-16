import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { createServiceClient } from "@/lib/supabase/service";
import { applyHonorFinalScoring } from "@/lib/honor-points";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const isFinal = Boolean(body.isFinal);
  const supabase = createServiceClient();

  const row = {
    tournament_year: 2026,
    champion_team_id: body.championTeamId ?? null,
    runner_up_team_id: body.runnerUpTeamId ?? null,
    third_place_team_id: body.thirdPlaceTeamId ?? null,
    top_scorer_name: body.topScorerName ?? null,
    best_player_name: body.bestPlayerName ?? null,
    best_goalkeeper_name: body.bestGoalkeeperName ?? null,
    best_young_player_name: body.bestYoungPlayerName ?? null,
    is_final: isFinal,
    updated_by: auth.userId,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("honor_results")
    .select("id")
    .eq("tournament_year", 2026)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from("honor_results").update(row).eq("id", existing.id);
  } else {
    await supabase.from("honor_results").insert(row);
  }

  if (isFinal) {
    await applyHonorFinalScoring(supabase, {
      champion_team_id: row.champion_team_id,
      runner_up_team_id: row.runner_up_team_id,
      third_place_team_id: row.third_place_team_id,
      top_scorer_name: row.top_scorer_name,
      best_player_name: row.best_player_name,
      best_goalkeeper_name: row.best_goalkeeper_name,
      best_young_player_name: row.best_young_player_name,
    });
  }

  return NextResponse.json({ success: true });
}
