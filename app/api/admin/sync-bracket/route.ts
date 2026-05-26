import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { createServiceClient } from "@/lib/supabase/service";
import { tryAdvanceWorldCupBracket } from "@/lib/bracket/wc2026-knockout";
import { recalculateAdvancementPoints } from "@/lib/recalculate-advancement-points";

/** POST: recalcula cruces R32 (si la fase de grupos está cerrada) y propaga eliminatoria. */
export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = createServiceClient();
  try {
    const bracket = await tryAdvanceWorldCupBracket(supabase);
    try {
      await recalculateAdvancementPoints(supabase);
    } catch (e) {
      console.error("recalculateAdvancementPoints", e);
    }
    return NextResponse.json({
      success: true,
      r32: bracket.r32,
      propagated: bracket.propagated,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
