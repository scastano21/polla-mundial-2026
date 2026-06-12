"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { PoolLeaderboardRow } from "@/lib/pool-leaderboard";
import { sortAndRankLeaderboard } from "@/lib/pool-leaderboard";

export function PoolLeaderboardTable({
  poolId,
  initialRows,
  memberCountHint,
  isAdmin = false,
  poolAdminId,
}: {
  poolId: string;
  initialRows: PoolLeaderboardRow[];
  memberCountHint?: number | null;
  isAdmin?: boolean;
  poolAdminId?: string;
}) {
  const [rows, setRows] = useState(initialRows);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    setRows(sortAndRankLeaderboard(initialRows));
  }, [initialRows]);

  const reload = async () => {
    const res = await fetch(`/api/pool/${poolId}/leaderboard`, {
      credentials: "include",
      cache: "no-store",
    });
    const body = (await res.json()) as { members?: PoolLeaderboardRow[]; error?: string };
    if (!res.ok) throw new Error(body.error ?? "No se pudo cargar la tabla");
    if (body.members) setRows(sortAndRankLeaderboard(body.members));
  };

  useEffect(() => {
    if (initialRows.length > 0) return;
    if (memberCountHint != null && memberCountHint === 0) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setApiError(null);
      try {
        await reload();
      } catch (e) {
        if (!cancelled) setApiError(e instanceof Error ? e.message : "Error de red al cargar miembros");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolId, initialRows.length, memberCountHint]);

  const removeMember = async (userId: string, name: string) => {
    if (!confirm(`¿Expulsar a ${name} de esta polla? Se borran sus pronósticos aquí.`)) return;
    setRemovingId(userId);
    try {
      const res = await fetch(`/api/pool/${poolId}/members/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(body.error ?? "No se pudo expulsar");
        return;
      }
      toast.success(`${name} fue expulsado de la polla`);
      await reload();
    } catch {
      toast.error("Error de red");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading && rows.length === 0) {
    return <p className="text-sm text-zinc-500">Cargando integrantes…</p>;
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-700 p-4 text-sm text-zinc-500">
        <p>Aún no hay integrantes en esta polla, o no se pudieron cargar.</p>
        {apiError && (
          <p className="mt-2 text-amber-400">
            {apiError}
            {apiError.includes("SERVICE_ROLE") &&
              " Añádela en Vercel y vuelve a desplegar."}
          </p>
        )}
        {memberCountHint != null && memberCountHint > 0 && !apiError && (
          <p className="mt-2 text-amber-400">
            Hay {memberCountHint} inscrito(s) en la base de datos pero la app no puede listarlos.
            Ejecuta <code className="text-zinc-400">FIX_POOL_MEMBERS_PRODUCTION.sql</code> en Supabase y
            configura <code className="text-zinc-400">SUPABASE_SERVICE_ROLE_KEY</code> en Vercel.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-900 text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Jugador</th>
            <th className="px-3 py-2 text-center">Pts</th>
            <th className="px-3 py-2 text-center">Exactos</th>
            <th className="px-3 py-2 text-center">Resultado</th>
            {isAdmin && <th className="px-3 py-2 text-center">Admin</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((m, i) => {
            const name = m.display_name || m.username || "Jugador";
            const canRemove = isAdmin && poolAdminId && m.user_id !== poolAdminId;
            return (
              <tr key={m.user_id} className="border-t border-zinc-800">
                <td className="px-3 py-2 text-zinc-400">{i + 1}</td>
                <td className="px-3 py-2 font-medium text-white">{name}</td>
                <td className="px-3 py-2 text-center font-bold text-yellow-400">{m.total_points}</td>
                <td className="px-3 py-2 text-center text-zinc-400">{m.exact_scores}</td>
                <td className="px-3 py-2 text-center text-zinc-400">{m.correct_results}</td>
                {isAdmin && (
                  <td className="px-3 py-2 text-center">
                    {canRemove ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={removingId === m.user_id}
                        className="h-7 border-red-900/60 text-xs text-red-400 hover:bg-red-950/40"
                        onClick={() => removeMember(m.user_id, name)}
                      >
                        {removingId === m.user_id ? "…" : "Expulsar"}
                      </Button>
                    ) : (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-500">
        Desempate: más puntos totales, luego más marcadores exactos, luego quien se unió primero a la polla.
      </p>
    </div>
  );
}
