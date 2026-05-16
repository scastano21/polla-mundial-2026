"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

export type DeletePoolResult = { ok: true } | { ok: false; error: string };

export async function deletePoolAsAdmin(poolId: string): Promise<DeletePoolResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  const { data: pool, error: fetchErr } = await supabase
    .from("pools")
    .select("id, admin_id, name")
    .eq("id", poolId)
    .maybeSingle();

  if (fetchErr || !pool) {
    return { ok: false, error: "Polla no encontrada." };
  }
  if (pool.admin_id !== user.id) {
    return { ok: false, error: "Solo el admin puede eliminar esta polla." };
  }

  const { error: delErr } = await supabase.from("pools").delete().eq("id", poolId).eq("admin_id", user.id);
  if (delErr) {
    return { ok: false, error: delErr.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/pool/${poolId}`);
  return { ok: true };
}
