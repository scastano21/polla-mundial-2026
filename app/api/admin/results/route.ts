import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { createServiceClient } from "@/lib/supabase/service";
import { rebuildGroupStandings } from "@/lib/rebuild-standings";
import { recalculatePointsForMatch } from "@/lib/recalculate-match-points";
import { tryAdvanceWorldCupBracket } from "@/lib/bracket/wc2026-knockout";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const matchId = body.matchId as string;
  const homeScore = Number(body.homeScore);
  const awayScore = Number(body.awayScore);
  const homePenalties =
    body.homePenalties === "" || body.homePenalties == null
      ? null
      : Number(body.homePenalties);
  const awayPenalties =
    body.awayPenalties === "" || body.awayPenalties == null
      ? null
      : Number(body.awayPenalties);

  if (!matchId || Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: match, error: mErr } = await supabase
    .from("matches")
    .select("id, home_score, away_score, group_letter, phases!inner(slug)")
    .eq("id", matchId)
    .single();

  if (mErr || !match) {
    return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  }

  const rawPhase = match.phases as { slug: string } | { slug: string }[] | null;
  const phaseSlug = Array.isArray(rawPhase) ? rawPhase[0]?.slug : rawPhase?.slug;
  if (!phaseSlug) {
    return NextResponse.json({ error: "Fase no encontrada" }, { status: 500 });
  }
  const prevHome = match.home_score;
  const prevAway = match.away_score;

  await supabase.from("result_audit_log").insert({
    match_id: matchId,
    admin_id: auth.userId,
    old_home_score: prevHome,
    old_away_score: prevAway,
    new_home_score: homeScore,
    new_away_score: awayScore,
  });

  const { error: uErr } = await supabase
    .from("matches")
    .update({
      home_score: homeScore,
      away_score: awayScore,
      home_penalties: homePenalties,
      away_penalties: awayPenalties,
      status: "finished",
      updated_at: new Date().toISOString(),
      updated_by: auth.userId,
    })
    .eq("id", matchId);

  if (uErr) {
    return NextResponse.json({ error: uErr.message }, { status: 500 });
  }

  await supabase
    .from("predictions")
    .update({ is_locked: true, updated_at: new Date().toISOString() })
    .eq("match_id", matchId);

  if (phaseSlug === "groups" && match.group_letter) {
    await rebuildGroupStandings(supabase, match.group_letter);
  }

  await recalculatePointsForMatch(
    supabase,
    matchId,
    homeScore,
    awayScore,
    prevHome,
    prevAway
  );

  const bracket = await tryAdvanceWorldCupBracket(supabase);

  return NextResponse.json({
    success: true,
    bracket: {
      r32Message: bracket.r32.message,
      r32Updated: bracket.r32.updated,
      knockoutPropagated: bracket.propagated,
    },
  });
}
