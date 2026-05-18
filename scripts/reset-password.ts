/**
 * Restablece la contraseña de un usuario en Supabase Auth (misma BD local y Vercel).
 *
 * Uso: npm run reset-password -- tu-correo@gmail.com NuevaClaveSegura123
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const email = process.argv[2]?.trim().toLowerCase();
const password = process.argv[3];

if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}
if (!email || !password || password.length < 6) {
  console.error('Uso: npm run reset-password -- "correo@gmail.com" "nueva_clave_min_6"');
  process.exit(1);
}

async function main() {
  const sb = createClient(url!, serviceKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let userId: string | null = null;
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      console.error(error.message);
      process.exit(1);
    }
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (hit) {
      userId = hit.id;
      break;
    }
    if (data.users.length < 200) break;
  }

  if (!userId) {
    console.error(`No hay usuario con email: ${email}`);
    console.error("Proyecto Supabase:", url);
    process.exit(1);
  }

  const { error } = await sb.auth.admin.updateUserById(userId, { password });
  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }

  console.log("Contraseña actualizada.");
  console.log("  Proyecto:", url);
  console.log("  Email:   ", email);
  console.log("\nEntra en http://localhost:3000/login con la clave nueva.");
  console.log("(Local y Vercel usan la misma cuenta si la URL de Supabase es la misma.)");
}

main();
