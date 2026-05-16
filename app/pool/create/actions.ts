"use server";

import { redirect } from "next/navigation";
import { DEFAULT_MAX_POOL_MEMBERS } from "@/lib/constants";
import { generateInviteCode } from "@/lib/invite-code";
import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function createPoolAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    return { error: "El nombre es obligatorio" };
  }

  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    redirect("/login?redirect=/pool/create");
  }

  const svc = createServiceClient();
  let invite = generateInviteCode();

  for (let attempt = 0; attempt < 5; attempt++) {
    const payload = {
      name,
      description: description || null,
      invite_code: invite,
      admin_id: user.id,
      max_members: DEFAULT_MAX_POOL_MEMBERS,
    };

    const { data: pool, error } = await svc
      .from("pools")
      .insert(payload)
      .select("id")
      .single();

    if (!error && pool) {
      await svc.from("scoring_rules").insert({ pool_id: pool.id });
      await svc.from("pool_members").insert({
        pool_id: pool.id,
        user_id: user.id,
      });
      redirect(`/pool/${pool.id}`);
    }

    if (error?.code === "23505") {
      invite = generateInviteCode();
      continue;
    }

    return { error: error?.message ?? "No se pudo crear la polla" };
  }

  return { error: "No se pudo generar un código único. Intenta de nuevo." };
}
