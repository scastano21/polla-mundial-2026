"use client";

import { useEffect, useMemo, useState } from "react";
import { getFlagUrlCandidates } from "@/lib/flags";
import { cn } from "@/lib/utils";

const dims = {
  xs: "h-3.5 w-5",
  sm: "h-5 w-8",
  md: "h-8 w-12",
  lg: "h-11 w-16",
};

export function Flag({
  code,
  name,
  size = "sm",
}: {
  code: string;
  name: string;
  size?: keyof typeof dims;
}) {
  const candidates = useMemo(() => getFlagUrlCandidates(code), [code]);
  const [idx, setIdx] = useState(0);
  const [exhausted, setExhausted] = useState(false);

  useEffect(() => {
    setIdx(0);
    setExhausted(false);
  }, [code]);

  const isPlaceholder = code.trim().toLowerCase().startsWith("ph-");

  if (candidates.length === 0 || exhausted) {
    return (
      <span
        title={name}
        className={cn(
          dims[size],
          "inline-flex shrink-0 items-center justify-center rounded-sm border border-zinc-700 bg-zinc-800 text-[10px] text-zinc-500",
          isPlaceholder && "opacity-50"
        )}
        aria-hidden
      >
        —
      </span>
    );
  }

  const src = candidates[Math.min(idx, candidates.length - 1)];

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- CDN externo, varios fallbacks */}
      <img
        key={src}
        src={src}
        alt={`Bandera de ${name}`}
        className={cn(
          dims[size],
          "rounded-sm object-cover shadow-sm",
          isPlaceholder && "opacity-40"
        )}
        loading="lazy"
        decoding="async"
        onError={() => {
          if (idx + 1 < candidates.length) {
            setIdx((i) => i + 1);
          } else {
            setExhausted(true);
          }
        }}
      />
    </>
  );
}

export function TeamDisplay({
  team,
  align = "left",
  size = "sm",
}: {
  team: { name: string; code: string } | null;
  align?: "left" | "right";
  size?: keyof typeof dims;
}) {
  if (!team) {
    return (
      <span className="text-sm font-semibold text-zinc-500">
        Por definir
      </span>
    );
  }
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        align === "right" && "flex-row-reverse"
      )}
    >
      <Flag code={team.code} name={team.name} size={size} />
      <span className="text-sm font-semibold leading-tight">{team.name}</span>
    </div>
  );
}
