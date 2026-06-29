import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { recalculateAdvancementPoints } from "../lib/recalculate-advancement-points";

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

loadEnv();

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log("Recalculando puntos por clasificados en todas las pollas…");
  await recalculateAdvancementPoints(supabase);
  console.log("Listo.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
