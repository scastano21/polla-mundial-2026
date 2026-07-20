import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { rebuildMemberTotals } from "@/lib/rebuild-member-totals";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/** Reconstruye total_points = partidos + clasificados + honor en todas las pollas. */
export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const supabase = createServiceClient();
    const result = await rebuildMemberTotals(supabase);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
