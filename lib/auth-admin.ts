import { createServerSupabase } from "@/lib/supabase/server";
import { isTournamentAdmin } from "@/lib/tournament-admin";

export async function getSessionUser() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) return { ok: false as const, status: 401, error: "No autenticado" };

  const supabase = await createServerSupabase();
  const admin = await isTournamentAdmin(supabase, user);

  if (!admin) {
    return { ok: false as const, status: 403, error: "Sin permisos de administrador" };
  }

  return { ok: true as const, userId: user.id };
}
