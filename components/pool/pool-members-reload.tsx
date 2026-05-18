"use client";

import { useEffect } from "react";

/** En producción, si el SSR no trajo miembros, reintenta por API y recarga una vez. */
export function PoolMembersReload({
  poolId,
  serverMemberCount,
}: {
  poolId: string;
  serverMemberCount: number;
}) {
  useEffect(() => {
    if (serverMemberCount > 0) return;

    const key = `pool-members-reload-${poolId}`;
    if (sessionStorage.getItem(key)) return;

    (async () => {
      const res = await fetch(`/api/pool/${poolId}/leaderboard`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const body = (await res.json()) as { members?: unknown[] };
      if (body.members?.length) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
      }
    })();
  }, [poolId, serverMemberCount]);

  return null;
}
