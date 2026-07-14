import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { buildPredictionProjection } from "../lib/bracket/predicted-projection";
import {
  advancementPointsForRound,
  countAdvancementHits,
  isAdvancementRoundReady,
  KNOCKOUT_ADVANCEMENT_ROUNDS,
  projectedPairMatchesOfficial,
  pairAtMatchNumber,
  teamsInMatchNumberRange,
} from "../lib/bracket/knockout-projection-eligibility";
import { pointsForPrediction } from "../lib/scoring";

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

loadEnv();

const USERNAME = process.argv[2] ?? "veracorrea1990";

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", USERNAME)
    .maybeSingle();

  if (!profile) {
    console.log("Usuario no encontrado:", USERNAME);
    return;
  }

  console.log("=== Usuario ===");
  console.log(profile);

  const { data: memberships } = await supabase
    .from("pool_members")
    .select(
      "pool_id, total_points, advancement_points, exact_scores, correct_results, rank, joined_at, pools(name)"
    )
    .eq("user_id", profile.id);

  for (const m of memberships ?? []) {
    const pool = Array.isArray(m.pools) ? m.pools[0] : m.pools;
    console.log("\n=== Polla:", pool?.name, m.pool_id, "===");
    console.log({
      total_points: m.total_points,
      advancement_points: m.advancement_points,
      exact_scores: m.exact_scores,
      correct_results: m.correct_results,
      rank: m.rank,
    });

    const { data: rules } = await supabase
      .from("scoring_rules")
      .select("exact_score_points, correct_result_points, advancement_team_points")
      .eq("pool_id", m.pool_id)
      .maybeSingle();

    const exactPts = rules?.exact_score_points ?? 5;
    const resultPts = rules?.correct_result_points ?? 2;
    const advPts = rules?.advancement_team_points ?? 3;

    const { data: preds } = await supabase
      .from("predictions")
      .select(
        "match_id, predicted_home_score, predicted_away_score, predicted_advance_team_id, points_earned, is_locked"
      )
      .eq("pool_id", m.pool_id)
      .eq("user_id", profile.id);

    const { data: matches } = await supabase
      .from("matches")
      .select(
        "id, match_number, group_letter, home_team_id, away_team_id, status, home_score, away_score, home_penalties, away_penalties"
      )
      .order("match_number");

    const matchById = new Map((matches ?? []).map((x) => [x.id, x]));

    let sumPointsEarned = 0;
    let sumExactFromPreds = 0;
    let sumResultOnlyFromPreds = 0;
    let groupPts = 0;
    let koPtsEligible = 0;
    let koPtsIneligible = 0;
    let koPtsStoredButIneligible = 0;

    const predMap = new Map<
      string,
      { home: number; away: number; advanceTeamId: string | null }
    >();
    for (const p of preds ?? []) {
      predMap.set(p.match_id, {
        home: p.predicted_home_score,
        away: p.predicted_away_score,
        advanceTeamId: p.predicted_advance_team_id,
      });
    }

    const projection = buildPredictionProjection(matches ?? [], predMap);

    for (const p of preds ?? []) {
      const match = matchById.get(p.match_id);
      if (!match) continue;
      const earned = p.points_earned ?? 0;
      sumPointsEarned += earned;

      if (match.status === "finished" && match.home_score != null && match.away_score != null) {
        const calc = pointsForPrediction(
          { exact_score_points: exactPts, correct_result_points: resultPts },
          p.predicted_home_score,
          p.predicted_away_score,
          match.home_score,
          match.away_score
        );
        if (calc.exact) sumExactFromPreds++;
        else if (calc.correctResultOnly) sumResultOnlyFromPreds++;

        const isKo = match.match_number >= 73;
        let eligible = true;
        if (isKo) {
          const projected = pairAtMatchNumber(projection.knockoutPairs, match.match_number);
          eligible = projectedPairMatchesOfficial(
            projected,
            match.home_team_id,
            match.away_team_id
          );
        }

        if (!isKo) groupPts += earned;
        else if (eligible) koPtsEligible += earned;
        else {
          koPtsIneligible += calc.points;
          if (earned > 0) koPtsStoredButIneligible += earned;
        }
      }
    }

    let expectedAdvancement = 0;
    const advancementBreakdown: { round: string; hits: number; ready: boolean }[] = [];
    const officialPairs = (matches ?? [])
      .filter((x) => x.match_number >= 73 && x.match_number <= 104)
      .map((x) => ({
        match_number: x.match_number,
        home_team_id: x.home_team_id,
        away_team_id: x.away_team_id,
      }));

    for (const round of KNOCKOUT_ADVANCEMENT_ROUNDS) {
      const ready = isAdvancementRoundReady(round, matches ?? []);
      const official = teamsInMatchNumberRange(officialPairs, round.min, round.max);
      const predicted = teamsInMatchNumberRange(projection.knockoutPairs, round.min, round.max);
      const roundPts = advancementPointsForRound(round, advPts);
      const points = ready ? countAdvancementHits(official, predicted, roundPts) : 0;
      expectedAdvancement += points;
      advancementBreakdown.push({
        round: round.label,
        hits: ready && official.size > 0 && roundPts > 0 ? points / roundPts : 0,
        ready,
      });
    }

    const { data: honor } = await supabase
      .from("honor_predictions")
      .select("points_earned")
      .eq("pool_id", m.pool_id)
      .eq("user_id", profile.id)
      .maybeSingle();

    const honorPts = honor?.points_earned ?? 0;
    const expectedFromPreds = sumPointsEarned;
    const expectedTotalApprox = expectedFromPreds + (m.advancement_points ?? 0);

    console.log("\n--- Desglose pronósticos ---");
    console.log("Partidos guardados:", preds?.length ?? 0);
    console.log("Suma points_earned en predictions:", sumPointsEarned);
    console.log("  Grupos (points_earned):", groupPts);
    console.log("  KO elegible (points_earned):", koPtsEligible);
    console.log("  KO no elegible (calcularía 0):", koPtsIneligible);
    console.log("  KO con points_earned>0 pero cruce no coincide:", koPtsStoredButIneligible);
    console.log("Exactos detectados en preds:", sumExactFromPreds, "| BD exact_scores:", m.exact_scores);
    console.log("Resultados detectados:", sumResultOnlyFromPreds, "| BD correct_results:", m.correct_results);

    console.log("\n--- Clasificados KO ---");
    console.log("advancement_points en BD:", m.advancement_points);
    console.log("advancement esperado (reglas actuales):", expectedAdvancement);
    console.log("Por ronda:", advancementBreakdown);
    console.log("r32Ready:", projection.r32Ready, "| groupsComplete:", projection.groupsComplete);

    console.log("\n--- Honor ---");
    console.log("points_earned honor:", honorPts);

    console.log("\n--- Conciliación ---");
    console.log("total_points BD:", m.total_points);
    console.log("advancement_points BD:", m.advancement_points);
    console.log("Si total = preds + advancement:", sumPointsEarned, "+", m.advancement_points, "=", sumPointsEarned + (m.advancement_points ?? 0));
    console.log("Honor aparte (debería estar en total si ya cerró):", honorPts);

    const finishedGroup = (matches ?? []).filter(
      (x) => x.group_letter && x.status === "finished"
    ).length;
    const finishedKo = (matches ?? []).filter(
      (x) => !x.group_letter && x.match_number >= 73 && x.status === "finished"
    ).length;
    console.log("\nPartidos cerrados: grupos", finishedGroup, "| KO", finishedKo);

    const wrongPreds = (preds ?? [])
      .map((p) => {
        const match = matchById.get(p.match_id);
        if (!match || match.status !== "finished" || match.home_score == null) return null;
        const calc = pointsForPrediction(
          { exact_score_points: exactPts, correct_result_points: resultPts },
          p.predicted_home_score,
          p.predicted_away_score,
          match.home_score,
          match.away_score
        );
        let should = calc.points;
        if (match.match_number >= 73) {
          const projected = pairAtMatchNumber(projection.knockoutPairs, match.match_number);
          if (
            !projectedPairMatchesOfficial(
              projected,
              match.home_team_id,
              match.away_team_id
            )
          ) {
            should = 0;
          }
        }
        if ((p.points_earned ?? 0) !== should) {
          return {
            mn: match.match_number,
            pred: `${p.predicted_home_score}-${p.predicted_away_score}`,
            real: `${match.home_score}-${match.away_score}`,
            stored: p.points_earned,
            should,
          };
        }
        return null;
      })
      .filter(Boolean);
    if (wrongPreds.length) {
      console.log("\n--- Predicciones con points_earned distinto a lo esperado ---");
      console.log(wrongPreds.slice(0, 20));
      if (wrongPreds.length > 20) console.log("... y", wrongPreds.length - 20, "más");
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
