/**

 * Admin del torneo: profiles.is_admin + JWT app_metadata.tournament_admin

 *

 * Uso: npm run set-admin -- tu-correo@gmail.com

 */

import { config } from "dotenv";

import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { grantTournamentAdminForUserId } from "../lib/grant-tournament-admin";



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



  let userId: string | null = null;

  for (let page = 1; page <= 100; page++) {

    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });

    if (error) {

      console.error("Error listando usuarios:", error.message);

      process.exit(1);

    }

    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === emailArg);

    if (hit) {

      userId = hit.id;

      break;

    }

    if (data.users.length < 200) break;

  }



  if (!userId) {

    console.error(`No existe usuario en Auth: ${emailArg}`);

    process.exit(1);

  }



  const { error: rpcErr } = await supabase.rpc("grant_tournament_admin", { p_email: emailArg });

  if (!rpcErr) {

    await grantTournamentAdminForUserId(supabase, userId, emailArg);

    console.log("OK (SQL grant_tournament_admin + JWT app_metadata)");

  } else {

    const result = await grantTournamentAdminForUserId(supabase, userId, emailArg);

    if (!result.ok) {

      console.error(result.error);

      process.exit(1);

    }

    console.log("OK (profiles + JWT app_metadata; RPC no disponible)");

  }



  const { data: u } = await supabase.auth.admin.getUserById(userId);

  console.log(`  id:       ${userId}`);

  console.log(`  email:    ${emailArg}`);

  console.log(`  JWT:      tournament_admin=${u.user?.app_metadata?.tournament_admin === true}`);

  console.log("\nIMPORTANTE: cierra sesión en la web y vuelve a entrar (JWT nuevo).");

  console.log("En Vercel añade también (opcional respaldo):");

  console.log(`  TOURNAMENT_ADMIN_EMAILS=${emailArg}`);

}



main().catch((e) => {

  console.error(e);

  process.exit(1);

});


