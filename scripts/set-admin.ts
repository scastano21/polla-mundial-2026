/**
 * Marca un usuario como administrador del torneo (is_admin en public.profiles).
 * Crea el perfil si falta. Usa service role.
 *
 * Uso: npm run set-admin -- tu-correo@gmail.com
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
config({ path: resolve(root, ".env.local") });
config({ path: resolve(root, ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const emailArg = process.argv[2]?.trim().toLowerCase();

if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}
if (!emailArg) {
  console.error('Pasa el email: npm run set-admin -- "correo@gmail.com"');
  process.exit(1);
}

async function main() {
  const supabase = createClient(url!, serviceKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: rpcErr } = await supabase.rpc("grant_tournament_admin", {
    p_email: emailArg,
  });

  if (!rpcErr) {
    console.log("Listo (grant_tournament_admin).");
    console.log(`  email: ${emailArg}`);
    console.log("\nCierra sesión en la web y vuelve a entrar para ver «Admin torneo».");
    return;
  }

  if (
    !rpcErr.message.includes("Could not find the function") &&
    !rpcErr.message.includes("schema cache")
  ) {
    console.warn("RPC grant_tournament_admin:", rpcErr.message);
    console.warn("Intentando modo manual (upsert en profiles)...");
  }

  let userId: string | null = null;
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("Error listando usuarios:", error.message);
      process.exit(1);
    }
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === emailArg);
    if (hit) {
      userId = hit.id;
      break;
    }
    if (data.users.length < perPage) break;
    page += 1;
    if (page > 100) break;
  }

  if (!userId) {
    console.error(`No existe ningún usuario en Auth con email: ${emailArg}`);
    console.error("Regístrate primero en la app con ese correo y vuelve a ejecutar.");
    process.exit(1);
  }

  const username = `user_${userId.replace(/-/g, "").slice(0, 8)}`;
  const displayName = emailArg.split("@")[0];

  const { error: uErr } = await supabase.from("profiles").upsert(
    {
      id: userId,
      username,
      display_name: displayName,
      is_admin: true,
    },
    { onConflict: "id" }
  );

  if (uErr) {
    const { error: updErr } = await supabase
      .from("profiles")
      .update({ is_admin: true })
      .eq("id", userId);
    if (updErr) {
      console.error("Error marcando admin:", updErr.message);
      process.exit(1);
    }
  }

  console.log("Listo. Usuario admin del torneo:");
  console.log(`  id:    ${userId}`);
  console.log(`  email: ${emailArg}`);
  console.log("\nCierra sesión y vuelve a entrar (o recarga fuerte) para ver «Admin torneo».");
  console.log(
    "\nSi sigue sin funcionar, ejecuta en Supabase SQL Editor:\n  supabase/migrations/20260217120000_ensure_profile_grant_admin.sql"
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
