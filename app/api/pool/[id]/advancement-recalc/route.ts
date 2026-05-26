import { NextResponse } from "next/server";
import { recalculateAdvancementPoints } from "@/lib/recalculate-advancement-points";
import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/** Recalcula puntos por clasificados KO del usuario en esta polla. */
export async function POST(
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

  try {
    const svc = createServiceClient();
    await recalculateAdvancementPoints(svc, { poolId, userId: user.id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
