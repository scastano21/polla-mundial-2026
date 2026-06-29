import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { createServiceClient } from "@/lib/supabase/service";
import { recalculateAdvancementPoints } from "@/lib/recalculate-advancement-points";

/** POST: recalcula +3 por clasificado KO en todas las pollas (p. ej. tras cerrar grupos). */
export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = createServiceClient();
  try {
    await recalculateAdvancementPoints(supabase);
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
