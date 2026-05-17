import type { SupabaseClient } from "@supabase/supabase-js";

/** Crea public.profiles si el usuario existe en Auth pero no tiene fila (trigger ausente o fallido). */
export async function ensureMyProfile(supabase: SupabaseClient) {
  const { error } = await supabase.rpc("ensure_my_profile");
  if (error && !error.message.includes("not_authenticated")) {
    console.warn("[ensure-profile]", error.message);
  }
}
