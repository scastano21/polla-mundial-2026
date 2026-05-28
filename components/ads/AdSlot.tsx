"use client";

import { useEffect, useId } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type Props = {
  className?: string;
  /** AdSense slot id (solo números). */
  slot: string;
  /** AdSense format. */
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  /** Responsive/full-width when format=auto. */
  fullWidthResponsive?: boolean;
};

const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || "ca-pub-1924830807495595";

export function AdSlot({
  className,
  slot,
  format = "auto",
  fullWidthResponsive = true,
}: Props) {
  const id = useId();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!slot) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // no-op
    }
  }, [id, slot]);

  // Evita renderizar anuncios en dev.
  if (process.env.NODE_ENV !== "production") return null;
  if (!slot) return null;

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <ins
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
}

