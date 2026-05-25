import { NextResponse } from "next/server";
import { buildPredictionProjection } from "@/lib/bracket/predicted-projection";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const poolId = params.id;
  const { data: membership } = await supabase
    .from("pool_members")
    .select("id")
    .eq("pool_id", poolId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: pool } = await supabase.from("pools").select("admin_id").eq("id", poolId).maybeSingle();
  if (!membership && pool?.admin_id !== user.id) {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  const { data: matches } = await supabase
    .from("matches")
    .select("id, match_number, group_letter, home_team_id, away_team_id")
    .order("match_number");

  const { data: preds } = await supabase
    .from("predictions")
    .select(
      "match_id, predicted_home_score, predicted_away_score, predicted_advance_team_id"
    )
    .eq("pool_id", poolId)
    .eq("user_id", user.id);

  const predMap = new Map<
    string,
    { home: number; away: number; advanceTeamId: string | null }
  >();
  for (const p of preds ?? []) {
    predMap.set(p.match_id, {
      home: p.predicted_home_score,
      away: p.predicted_away_score,
      advanceTeamId: p.predicted_advance_team_id ?? null,
    });
  }

  const projection = buildPredictionProjection(matches ?? [], predMap);

  const teamIds = new Set<string>();
  for (const rows of Object.values(projection.standingsByGroup)) {
    for (const r of rows) teamIds.add(r.team_id);
  }
  for (const k of projection.knockoutPairs) {
    if (k.home_team_id) teamIds.add(k.home_team_id);
    if (k.away_team_id) teamIds.add(k.away_team_id);
  }

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, code")
    .in("id", Array.from(teamIds));

  const teamMap = Object.fromEntries((teams ?? []).map((t) => [t.id, t]));

  return NextResponse.json({
    ...projection,
    teams: teamMap,
  });
}
