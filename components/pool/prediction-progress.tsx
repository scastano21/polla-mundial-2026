"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isHonorPredictionComplete } from "@/lib/tournament-lock";

type Props = {
  poolId: string;
  className?: string;
};

export function PredictionProgress({ poolId, className = "" }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [matchTotal, setMatchTotal] = useState(0);
  const [matchDone, setMatchDone] = useState(0);
  const [honorDone, setHonorDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { count: total } = await supabase
        .from("matches")
        .select("id", { count: "exact", head: true });
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: preds } = await supabase
        .from("predictions")
        .select("match_id")
        .eq("pool_id", poolId)
        .eq("user_id", user.id);

      const done = (preds ?? []).length;
      const { data: honor } = await supabase
        .from("honor_predictions")
        .select(
          "champion_team_id, runner_up_team_id, third_place_team_id, top_scorer_name, best_player_name, best_goalkeeper_name, best_young_player_name"
        )
        .eq("pool_id", poolId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setMatchTotal(total ?? 0);
        setMatchDone(done);
        setHonorDone(honor ? isHonorPredictionComplete(honor) : false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [poolId, supabase]);

  if (matchTotal === 0) return null;

  const missing = Math.max(0, matchTotal - matchDone);

  return (
    <p className={`text-sm text-zinc-400 ${className}`}>
      Llevas <span className="font-semibold text-white">{matchDone}</span> de{" "}
      <span className="font-semibold text-white">{matchTotal}</span> partidos guardados
      {missing > 0 ? (
        <>
          {" "}
          — <span className="text-yellow-500">{missing} sin pronóstico = 0 pts</span>
        </>
      ) : (
        " — todos los partidos cubiertos"
      )}
      . {honorDone ? "Cuadro de honor completo." : "Completa también el cuadro de honor."}
    </p>
  );
}
