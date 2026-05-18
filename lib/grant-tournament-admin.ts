import type { SupabaseClient } from "@supabase/supabase-js";

/** Marca admin en profiles + JWT (app_metadata). */
export async function grantTournamentAdminForUserId(
  service: SupabaseClient,
  userId: string,
  email: string
): Promise<{ ok: boolean; error?: string }> {
  const { error: metaErr } = await service.auth.admin.updateUserById(userId, {
    app_metadata: { tournament_admin: true },
  });
  if (metaErr) {
    return { ok: false, error: `app_metadata: ${metaErr.message}` };
  }

  const username = `user_${userId.replace(/-/g, "").slice(0, 8)}`;
  const displayName = email.split("@")[0] || "admin";

  const { error: profErr } = await service.from("profiles").upsert(
    {
      id: userId,
      username,
      display_name: displayName,
      is_admin: true,
    },
    { onConflict: "id" }
  );

  if (profErr) {
    const { error: updErr } = await service
      .from("profiles")
      .update({ is_admin: true })
      .eq("id", userId);
    if (updErr) {
      return { ok: false, error: `profiles: ${updErr.message}` };
    }
  }

  return { ok: true };
}
