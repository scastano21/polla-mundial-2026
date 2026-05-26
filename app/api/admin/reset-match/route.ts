import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { createServiceClient } from "@/lib/supabase/service";
import { resetMatchToScheduled } from "@/lib/reset-match-scoring";
import { recalculateAdvancementPoints } from "@/lib/recalculate-advancement-points";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const matchId = body.matchId as string;
  if (!matchId) {
    return NextResponse.json({ error: "Falta matchId" }, { status: 400 });
  }

  const supabase = createServiceClient();
  try {
    await resetMatchToScheduled(supabase, matchId);
    try {
      await recalculateAdvancementPoints(supabase);
    } catch (recalcErr) {
      console.error("recalculateAdvancementPoints", recalcErr);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
