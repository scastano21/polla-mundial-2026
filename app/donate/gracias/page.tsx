"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import { SiteHeader } from "@/components/site-header";
import { COPY } from "@/lib/copy";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function ThanksInner() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const id = searchParams.get("id");

  useEffect(() => {
    if (status !== "error" && status !== "pending") {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ["#eab308", "#fff"] });
    }
  }, [status]);

  const ok = status !== "error" && status !== "pending";

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-black text-white">
        {ok ? "¡Gracias!" : status === "pending" ? "Pago pendiente" : "Algo salió mal"}
      </h1>
      <p className="mt-4 text-sm text-zinc-400">
        {ok
          ? COPY.donate.thanks("hincha")
          : status === "pending"
            ? "Tu pago está siendo procesado."
            : "Intenta de nuevo más tarde."}
      </p>
      {id && <p className="mt-2 font-mono text-xs text-zinc-600">Ref: {id}</p>}
      <Link
        href="/"
        className={cn(
          buttonVariants({ size: "lg" }),
          "mt-8 inline-flex bg-yellow-500 text-black hover:bg-yellow-400"
        )}
      >
        Volver al inicio
      </Link>
    </main>
  );
}

export default function DonateThanksPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<p className="p-10 text-center text-zinc-500">Cargando…</p>}>
        <ThanksInner />
      </Suspense>
    </>
  );
}
