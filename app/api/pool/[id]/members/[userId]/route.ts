import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/** DELETE: admin de la polla expulsa a un integrante (no al admin de la polla). */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  const poolId = params.id;
  const targetUserId = params.userId;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const sb = await createServerSupabase();
  const { data: pool } = await sb.from("pools").select("admin_id").eq("id", poolId).maybeSingle();
  if (!pool) {
    return NextResponse.json({ error: "Polla no encontrada" }, { status: 404 });
  }

  if (pool.admin_id !== user.id) {
    return NextResponse.json({ error: "Solo el admin de la polla puede expulsar integrantes" }, { status: 403 });
  }

  if (targetUserId === pool.admin_id) {
    return NextResponse.json({ error: "No puedes expulsarte a ti mismo como admin" }, { status: 400 });
  }

  let svc;
  try {
    svc = createServiceClient();
  } catch {
    return NextResponse.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." }, { status: 503 });
  }

  const { data: member } = await svc
    .from("pool_members")
    .select("id")
    .eq("pool_id", poolId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: "Integrante no encontrado en esta polla" }, { status: 404 });
  }

  await svc.from("predictions").delete().eq("pool_id", poolId).eq("user_id", targetUserId);
  await svc.from("honor_predictions").delete().eq("pool_id", poolId).eq("user_id", targetUserId);

  const { error: delErr } = await svc
    .from("pool_members")
    .delete()
    .eq("pool_id", poolId)
    .eq("user_id", targetUserId);

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  await svc.rpc("recalculate_pool_rankings", { p_pool_id: poolId });

  return NextResponse.json({ ok: true });
}
