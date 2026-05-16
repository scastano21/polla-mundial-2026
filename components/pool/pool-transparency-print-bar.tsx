"use client";

import { Button } from "@/components/ui/button";

export function PoolTransparencyPrintBar() {
  return (
    <div className="print:hidden flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
      <Button
        type="button"
        variant="outline"
        className="border-zinc-600"
        onClick={() => window.print()}
      >
        Imprimir / guardar PDF
      </Button>
      <p className="text-xs text-zinc-500">
        En el cuadro de impresión del navegador elige “Guardar como PDF” si quieres un archivo.
      </p>
    </div>
  );
}
