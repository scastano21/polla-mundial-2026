import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { rebuildMemberTotals } from "../lib/rebuild-member-totals";

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

async function main() {
  loadEnv();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log("Reconstruyendo totales (partidos + clasificados + honor)…");
  const result = await rebuildMemberTotals(supabase);
  console.log(result);

  const pool = "adc1440d-be7d-4bf2-a8bb-1d87f87a6e39";
  const { data: members } = await supabase
    .from("pool_members")
    .select("total_points, advancement_points, rank, profiles(display_name, username)")
    .eq("pool_id", pool)
    .order("rank");

  console.log("\nPolla Aquí está Javier tras corrección:");
  for (const m of members ?? []) {
    const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    console.log(
      `#${m.rank}`,
      p?.display_name ?? p?.username,
      "total=",
      m.total_points,
      "adv=",
      m.advancement_points
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
