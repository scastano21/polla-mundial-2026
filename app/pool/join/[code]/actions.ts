"use server";

import { redirect } from "next/navigation";
import { joinPoolAsUser } from "@/lib/join-pool";
import { createServerSupabase } from "@/lib/supabase/server";

export async function joinPoolById(poolId: string) {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/dashboard`);
  }

  const result = await joinPoolAsUser(sb, poolId, user.id);
  if (!result.ok) {
    redirect(`/pool/join?error=${encodeURIComponent(result.error ?? "No se pudo unir")}`);
  }

  redirect(`/pool/${poolId}`);
}
