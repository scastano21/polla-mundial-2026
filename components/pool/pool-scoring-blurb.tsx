export type PoolScoringRulesRow = {
  exact_score_points: number | null;
  correct_result_points: number | null;
  advancement_team_points?: number | null;
  correct_champion: number | null;
  correct_runner_up: number | null;
  correct_third_place: number | null;
  correct_top_scorer: number | null;
  correct_best_player: number | null;
  correct_best_goalkeeper: number | null;
  correct_best_young: number | null;
} | null;

import { cn } from "@/lib/utils";

export function PoolScoringBlurb({
  rules,
  className,
}: {
  rules: PoolScoringRulesRow;
  className?: string;
}) {
  const e = rules?.exact_score_points ?? 5;
  const r = rules?.correct_result_points ?? 2;
  const adv = rules?.advancement_team_points ?? 3;
  const ch = rules?.correct_champion ?? 10;
  const ru = rules?.correct_runner_up ?? 5;
  const tp = rules?.correct_third_place ?? 3;
  const ts = rules?.correct_top_scorer ?? 5;
  const bp = rules?.correct_best_player ?? 3;
  const bk = rules?.correct_best_goalkeeper ?? 3;
  const by = rules?.correct_best_young ?? 2;

  return (
    <aside
      className={cn(
        "rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 text-sm text-zinc-300",
        className
      )}
    >
      <p className="mb-2 font-bold text-white">Cómo suman los puntos</p>
      <ul className="list-inside list-disc space-y-1 text-zinc-400">
        <li>
          <strong className="text-zinc-200">Tabla:</strong> gana quien sume más puntos; si empatan, sube quien tenga más{" "}
          <strong className="text-yellow-500">marcadores exactos</strong>; si siguen empatados, quien se{" "}
          <strong className="text-yellow-500">unió primero</strong> a la polla.
        </li>
        <li>
          <strong className="text-zinc-200">Por partido:</strong> marcador exacto <strong className="text-yellow-500">{e} pts</strong>;
          solo 1-X-2 <strong className="text-yellow-500">{r} pts</strong> (sin doble bonus).
        </li>
        <li>
          <strong className="text-zinc-200">Eliminatoria (dieciseisavos en adelante):</strong> solo sumas por marcador si ese cruce existía en{" "}
          <strong className="text-yellow-500">tu proyección</strong> (tablas de grupos + eliminatoria simulada). Si el partido oficial no
          coincide con tu cuadro proyectado, no sumas por ese marcador. Cuando sí coincide, aplican las mismas reglas de exacto ({e} pts) y
          resultado ({r} pts).
        </li>
        <li>
          <strong className="text-zinc-200">Por clasificados (eliminatoria):</strong>{" "}
          <strong className="text-yellow-500">{adv} pts</strong> por cada equipo que tengas en una ronda KO según tu
          proyección y que oficialmente llegue a esa misma ronda (incluye el{" "}
          <strong className="text-zinc-200">tercer puesto</strong>); en la{" "}
          <strong className="text-zinc-200">final</strong> suman{" "}
          <strong className="text-yellow-500">6 pts</strong> por cada clasificado. Suman cuando el cuadro de esa ronda
          queda definido (dieciseisavos al cerrar grupos; octavos cuando terminen los dieciseisavos y se asignen los
          cruces; y así sucesivamente en cuartos, semifinal, tercer puesto y final).
        </li>
        <li>
          <strong className="text-zinc-200">Cuadro de honor</strong> (una sola vez, antes del Mundial): cuando el admin cierre los
          ganadores oficiales, suman quien acierte campeón ({ch}), subcampeón ({ru}), tercero ({tp}), goleador ({ts}), mejor jugador (
          {bp}), mejor portero ({bk}), mejor joven ({by}). Los nombres de jugadores se comparan en minúsculas y pueden coincidir si uno
          contiene al otro (evita fallar por un apellido de más o de menos). También ignora tildes y typos
          menores en los nombres.
        </li>
        <li>
          <strong className="text-zinc-200">Eliminatoria (oficial):</strong> cuando el admin cierra grupos, la app asigna dieciseisavos con la
          matriz FIFA de 8 mejores terceros (495 combinaciones) y avanza octavos–final con resultados reales.
        </li>
        <li>
          <strong className="text-zinc-200">Tu proyección:</strong> en Pronósticos ves tablas y cruces simulados según tus marcadores de
          grupos (sin cambiar el torneo oficial hasta que se publiquen resultados).
        </li>
      </ul>
    </aside>
  );
}
