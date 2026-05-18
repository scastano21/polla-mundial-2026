import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { isTournamentAdmin } from "@/lib/tournament-admin";

export const dynamic = "force-dynamic";

/** Diagnóstico: GET /api/me → email, userId, isAdmin (misma lógica que el header). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ loggedIn: false, isAdmin: false });
  }

  const supabase = await createServerSupabase();
  const isAdmin = await isTournamentAdmin(supabase, user);

  return NextResponse.json({
    loggedIn: true,
    userId: user.id,
    email: user.email,
    isAdmin,
  });
}
