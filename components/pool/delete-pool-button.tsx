"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deletePoolAsAdmin } from "@/app/pool/delete-pool-action";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  poolId: string;
  poolName: string;
  className?: string;
  /** compact = texto corto en lista; danger = bloque destacado en ajustes */
  layout?: "compact" | "danger";
};

export function DeletePoolButton({ poolId, poolName, className, layout = "compact" }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (
      !window.confirm(
        `¿Eliminar la polla «${poolName}»?\n\nSe borrarán miembros, pronósticos, cuadro de honor y reglas de esta polla. No se puede deshacer.`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const r = await deletePoolAsAdmin(poolId);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Polla eliminada");
      router.push("/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  if (layout === "danger") {
    return (
      <div className={cn("rounded-xl border border-red-500/40 bg-red-950/20 p-4", className)}>
        <p className="font-bold text-red-200">Zona de peligro</p>
        <p className="mt-2 text-sm text-red-200/80">
          Eliminar la polla borra todos los datos asociados (jugadores, pronósticos, honor y puntuaciones).
        </p>
        <Button
          type="button"
          variant="destructive"
          className="mt-4"
          disabled={busy}
          onClick={run}
        >
          {busy ? "Eliminando…" : "Eliminar esta polla"}
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      className={cn("shrink-0", className)}
      disabled={busy}
      onClick={run}
    >
      {busy ? "…" : "Eliminar"}
    </Button>
  );
}
