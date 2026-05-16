"use server";

import { redirect } from "next/navigation";
import { DEFAULT_MAX_POOL_MEMBERS } from "@/lib/constants";
import { createServiceClient } from "@/lib/supabase/service";
import { createServerSupabase } from "@/lib/supabase/server";

export async function joinPoolById(poolId: string) {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/dashboard`);
  }

  const svc = createServiceClient();
  const { data: pool } = await svc.from("pools").select("id, max_members").eq("id", poolId).maybeSingle();
  if (!pool) return;

  const { count } = await svc
    .from("pool_members")
    .select("*", { count: "exact", head: true })
    .eq("pool_id", poolId);
  if ((count ?? 0) >= (pool.max_members ?? DEFAULT_MAX_POOL_MEMBERS)) return;

  const { data: existing } = await sb
    .from("pool_members")
    .select("id")
    .eq("pool_id", poolId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) {
    redirect(`/pool/${poolId}`);
  }

  await sb.from("pool_members").insert({ pool_id: poolId, user_id: user.id });
  redirect(`/pool/${poolId}`);
}
