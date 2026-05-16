/**
 * Marca un usuario como administrador del torneo (is_admin en public.profiles).
 * Usa la service role (ignora RLS), útil si el SQL en el editor no actualizó filas.
 *
 * Uso: npx tsx scripts/set-admin.ts tu-correo@gmail.com
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
  console.error('Pasa el email: npx tsx scripts/set-admin.ts "correo@gmail.com"');
  process.exit(1);
}

const supabaseUrl = url;
const supabaseServiceKey = serviceKey;

async function main() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

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
    if (page > 100) {
      console.error("No encontré el email en las primeras páginas de usuarios.");
      process.exit(1);
    }
  }

  if (!userId) {
    console.error(`No existe ningún usuario en Auth con email exacto: ${emailArg}`);
    console.error("Revisa mayúsculas, y si escribiste bien el correo (p. ej. sebastian vs sebascossio).");
    process.exit(1);
  }

  const { data: prof, error: pErr } = await supabase.from("profiles").select("id, username, is_admin").eq("id", userId).maybeSingle();
  if (pErr) {
    console.error("Error leyendo profiles:", pErr.message);
    process.exit(1);
  }
  if (!prof) {
    console.error(`Existe en Auth (${userId}) pero no hay fila en public.profiles. Entra una vez a la web con esa cuenta para crear el perfil, y vuelve a ejecutar este script.`);
    process.exit(1);
  }

  const { error: uErr } = await supabase.from("profiles").update({ is_admin: true }).eq("id", userId);
  if (uErr) {
    console.error("Error actualizando is_admin:", uErr.message);
    process.exit(1);
  }

  console.log("Listo. Usuario admin del torneo:");
  console.log(`  id:       ${userId}`);
  console.log(`  email:    ${emailArg}`);
  console.log(`  username: ${prof.username}`);
  console.log(`  is_admin: true (antes era ${prof.is_admin})`);
  console.log("\nCierra sesión en la web y vuelve a entrar (o recarga fuerte) para ver «Admin torneo».");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
