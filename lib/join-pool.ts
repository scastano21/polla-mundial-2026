import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_MAX_POOL_MEMBERS } from "@/lib/constants";
import { ensureMyProfile } from "@/lib/ensure-profile";
import { createServiceClient, tryCreateServiceClient } from "@/lib/supabase/service";

export async function joinPoolAsUser(
  supabase: SupabaseClient,
  poolId: string,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  await ensureMyProfile(supabase);

  try {
    const svc = createServiceClient();
    const { data: pool } = await svc.from("pools").select("max_members").eq("id", poolId).maybeSingle();
    if (!pool) return { ok: false, error: "Polla no encontrada." };

    const { count } = await svc
      .from("pool_members")
      .select("*", { count: "exact", head: true })
      .eq("pool_id", poolId);

    if ((count ?? 0) >= (pool.max_members ?? DEFAULT_MAX_POOL_MEMBERS)) {
      return { ok: false, error: "La polla está llena." };
    }

    const { error } = await svc.from("pool_members").upsert(
      { pool_id: poolId, user_id: userId },
      { onConflict: "pool_id,user_id", ignoreDuplicates: true }
    );
    if (!error) return { ok: true };
    return { ok: false, error: error.message };
  } catch (e) {
    console.warn("[join-pool] service:", e instanceof Error ? e.message : e);
  }

  const { error: rpcErr } = await supabase.rpc("join_pool", { p_pool_id: poolId });
  if (!rpcErr) return { ok: true };

  const msg = rpcErr.message ?? "";
  if (msg.includes("pool_full")) return { ok: false, error: "La polla está llena." };
  if (msg.includes("pool_not_found")) return { ok: false, error: "Polla no encontrada." };
  if (msg.includes("not_authenticated")) return { ok: false, error: "Debes iniciar sesión." };

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
