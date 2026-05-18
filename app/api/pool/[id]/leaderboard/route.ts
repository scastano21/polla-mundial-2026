import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-admin";
import { loadLeaderboardFromDb } from "@/lib/pool-leaderboard";
import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const poolId = params.id;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const sb = await createServerSupabase();
  const { data: pool } = await sb.from("pools").select("admin_id").eq("id", poolId).maybeSingle();
  if (!pool) {
    return NextResponse.json({ error: "Polla no encontrada" }, { status: 404 });
  }

  let svc;
  try {
    svc = createServiceClient();
  } catch {
    return NextResponse.json(
      {
        error:
          "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor (Vercel → Environment Variables).",
      },
      { status: 503 }
    );
  }

  const { data: membership } = await svc
    .from("pool_members")
    .select("id")
    .eq("pool_id", poolId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership && pool.admin_id !== user.id) {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  const members = await loadLeaderboardFromDb(svc, poolId);
  return NextResponse.json({ members, count: members.length });
}
