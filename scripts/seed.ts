/**
 * Ejecutar: npm run seed
 * Carga .env.local primero (como Next.js), luego .env si hace falta.
 *
 * Equipos y calendario de grupos según el sorteo oficial 2026 (Wikipedia + FIFA Match Centre).
 * Eliminatorias 73–104: cruces oficiales por huecos; equipos null hasta que existan resultados.
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  WC2026_GROUP_MATCHES,
  WC2026_KNOCKOUT_MATCHES,
  WC2026_TEAMS,
} from "./wc2026-data";
import { getFlagUrlCandidates } from "../lib/flags";

const root = process.cwd();
config({ path: resolve(root, ".env.local") });
config({ path: resolve(root, ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. " +
      "Defínelos en .env.local o en .env (en la raíz del proyecto)."
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PHASES = [
  { name: "Fase de Grupos", slug: "groups", order_index: 1 },
  { name: "Dieciseisavos de final", slug: "round_of_32", order_index: 2 },
  { name: "Octavos de final", slug: "round_of_16", order_index: 3 },
  { name: "Cuartos de final", slug: "quarterfinals", order_index: 4 },
  { name: "Semifinales", slug: "semifinals", order_index: 5 },
  { name: "Tercer puesto", slug: "third_place", order_index: 6 },
  { name: "Final", slug: "final", order_index: 7 },
];

function flagUrl(code: string) {
  return getFlagUrlCandidates(code)[0] ?? "";
}

async function main() {
  console.log("Limpiando datos existentes...");
  await supabase.from("predictions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("matches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("group_standings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("teams").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("phases").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("Insertando fases...");
  const { data: insertedPhases, error: pErr } = await supabase
    .from("phases")
    .insert(PHASES)
    .select("id, slug");
  if (pErr) throw pErr;
  const phaseId = Object.fromEntries((insertedPhases ?? []).map((p) => [p.slug, p.id])) as Record<
    string,
    string
  >;

  console.log("Insertando equipos (48)...");
  const teamRows = WC2026_TEAMS.map((t) => ({
    name: t.name,
    name_en: t.name_en,
    code: t.code,
    group_letter: t.group_letter,
    flag_url: flagUrl(t.code),
  }));
  const { data: teamsIns, error: tErr } = await supabase.from("teams").insert(teamRows).select("id, code, group_letter");
  if (tErr) throw tErr;

  const byCode = new Map((teamsIns ?? []).map((x) => [x.code, x.id] as const));

  console.log("Insertando 72 partidos de grupos + 32 eliminatorias...");
  const groupPhase = phaseId.groups;
  const matchRows: Record<string, unknown>[] = [];

  for (const m of WC2026_GROUP_MATCHES) {
    const hid = byCode.get(m.home_code);
    const aid = byCode.get(m.away_code);
    if (!hid || !aid) {
      throw new Error(`Código de equipo desconocido en partido ${m.match_number}: ${m.home_code} vs ${m.away_code}`);
    }
    matchRows.push({
      phase_id: groupPhase,
      match_number: m.match_number,
      group_letter: m.group_letter,
      home_team_id: hid,
      away_team_id: aid,
      match_date: m.match_date,
      venue: m.venue,
      city: m.city,
      country_host: m.country_host,
      status: "scheduled",
    });
  }

  for (const k of WC2026_KNOCKOUT_MATCHES) {
    const pid = phaseId[k.phase_slug];
    if (!pid) throw new Error(`Fase desconocida: ${k.phase_slug}`);
    matchRows.push({
      phase_id: pid,
      match_number: k.match_number,
      group_letter: null,
      home_team_id: null,
      away_team_id: null,
      match_date: k.match_date,
      venue: k.venue,
      city: k.city,
      country_host: k.country_host,
      status: "scheduled",
      elimination_slot_label: k.elimination_slot_label,
    });
  }

  matchRows.sort((a, b) => (a.match_number as number) - (b.match_number as number));

  const { error: mErr } = await supabase.from("matches").insert(matchRows);
  if (mErr) throw mErr;

  console.log(`Listo: ${matchRows.length} partidos insertados (objetivo 104).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
