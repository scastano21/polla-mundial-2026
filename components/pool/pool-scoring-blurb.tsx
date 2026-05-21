export type PoolScoringRulesRow = {
  exact_score_points: number | null;
  correct_result_points: number | null;
  correct_champion: number | null;
  correct_runner_up: number | null;
  correct_third_place: number | null;
  correct_top_scorer: number | null;
  correct_best_player: number | null;
  correct_best_goalkeeper: number | null;
  correct_best_young: number | null;
} | null;

export function PoolScoringBlurb({ rules }: { rules: PoolScoringRulesRow }) {
  const e = rules?.exact_score_points ?? 5;
  const r = rules?.correct_result_points ?? 2;
  const ch = rules?.correct_champion ?? 10;
  const ru = rules?.correct_runner_up ?? 5;
  const tp = rules?.correct_third_place ?? 3;
  const ts = rules?.correct_top_scorer ?? 5;
  const bp = rules?.correct_best_player ?? 3;
  const bk = rules?.correct_best_goalkeeper ?? 3;
  const by = rules?.correct_best_young ?? 2;

  return (
    <aside className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 text-sm text-zinc-300">
      <p className="mb-2 font-bold text-white">Cómo suman los puntos</p>
      <ul className="list-inside list-disc space-y-1 text-zinc-400">
        <li>
          <strong className="text-zinc-200">Tabla:</strong> gana quien sume más puntos; si empatan, sube quien tenga más{" "}
          <strong className="text-yellow-500">marcadores exactos</strong>.
        </li>
        <li>
          <strong className="text-zinc-200">Por partido:</strong> marcador exacto <strong className="text-yellow-500">{e} pts</strong>;
          solo 1-X-2 <strong className="text-yellow-500">{r} pts</strong> (sin doble bonus).
        </li>
        <li>
          <strong className="text-zinc-200">Cuadro de honor</strong> (una sola vez, antes del Mundial): cuando el admin cierre los
          ganadores oficiales, suman quien acierte campeón ({ch}), subcampeón ({ru}), tercero ({tp}), goleador ({ts}), mejor jugador (
          {bp}), mejor portero ({bk}), mejor joven ({by}). Los nombres de jugadores se comparan en minúsculas y pueden coincidir si uno
          contiene al otro (evita fallar por un apellido de más o de menos).
        </li>
        <li>
          <strong className="text-zinc-200">Eliminatoria:</strong> al terminar todos los partidos de grupos, la app asigna equipos en
          dieciseisavos según la tabla FIFA (495 combinaciones de mejores terceros); luego completa octavos–final con los ganadores de
          cada cruce.
        </li>
      </ul>
    </aside>
  );
}
