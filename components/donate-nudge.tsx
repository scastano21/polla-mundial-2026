"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { COPY } from "@/lib/copy";

/** Solo oculta el aviso en esta visita; al recargar la página vuelve a mostrarse (sin sessionStorage). */
export function DonateNudge() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const n = COPY.donate.nudge;

  if (pathname?.startsWith("/donate")) return null;
  if (pathname === "/login" || pathname?.startsWith("/login/")) return null;
  if (pathname === "/register" || pathname?.startsWith("/register/")) return null;
  if (dismissed) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-3 sm:p-4">
      <div className="pointer-events-auto flex max-w-lg flex-wrap items-center justify-center gap-3 rounded-2xl border border-yellow-500/25 bg-zinc-900/95 px-4 py-3 text-center text-sm leading-relaxed text-zinc-200 shadow-lg backdrop-blur">
        <span>
          {n.before}{" "}
          <Link href="/donate" className="font-bold text-yellow-400 underline-offset-2 hover:underline">
            {n.linkCta}
          </Link>
          {n.after}
        </span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-lg border border-zinc-600 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800"
          aria-label="Cerrar aviso"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
