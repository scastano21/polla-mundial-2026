import type { SupabaseClient } from "@supabase/supabase-js";
import { tryCreateServiceClient } from "@/lib/supabase/service";
import { ensureMyProfile } from "@/lib/ensure-profile";

export async function joinPoolAsUser(
  supabase: SupabaseClient,
  poolId: string,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  const { error: rpcErr } = await supabase.rpc("join_pool", { p_pool_id: poolId });
  if (!rpcErr) return { ok: true };

  const msg = rpcErr.message ?? "";
  if (msg.includes("pool_full")) return { ok: false, error: "La polla está llena." };
  if (msg.includes("pool_not_found")) return { ok: false, error: "Polla no encontrada." };
  if (msg.includes("not_authenticated")) return { ok: false, error: "Debes iniciar sesión." };

  if (
    !msg.includes("Could not find the function") &&
    !msg.includes("schema cache")
  ) {
    console.warn("[join-pool] join_pool RPC:", msg);
  }

  await ensureMyProfile(supabase);

  const svc = tryCreateServiceClient();
  if (svc) {
    const { error } = await svc.from("pool_members").upsert(
      { pool_id: poolId, user_id: userId },
      { onConflict: "pool_id,user_id", ignoreDuplicates: true }
    );
    if (!error) return { ok: true };
    return { ok: false, error: error.message };
  }

  const { error: insErr } = await supabase
    .from("pool_members")
    .insert({ pool_id: poolId, user_id: userId });

  if (insErr) {
    if (insErr.code === "23505") return { ok: true };
    return { ok: false, error: insErr.message };
  }

  return { ok: true };
}
