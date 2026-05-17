"use client";

import { useEffect, useMemo, useState } from "react";
import { flagEmoji, getFlagSrcCandidates } from "@/lib/flags";
import { cn } from "@/lib/utils";

const imgSize = {
  xs: "h-3.5 w-5",
  sm: "h-5 w-8",
  md: "h-8 w-12",
  lg: "h-11 w-16",
} as const;

const placeholderBox = imgSize;

export function Flag({
  code,
  name,
  size = "sm",
}: {
  code: string;
  name: string;
  size?: keyof typeof imgSize;
}) {
  const candidates = useMemo(() => getFlagSrcCandidates(code), [code]);
  const emojiFallback = useMemo(() => flagEmoji(code), [code]);
  const [idx, setIdx] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setIdx(0);
    setImgFailed(false);
  }, [code]);

  const isPlaceholder = code.trim().toLowerCase().startsWith("ph-");

  if (!candidates.length || imgFailed) {
    if (emojiFallback && !isPlaceholder) {
      return (
        <span
          role="img"
          aria-label={`Bandera de ${name}`}
          title={name}
          className={cn(
            "inline-flex shrink-0 items-center justify-center text-xl leading-none",
            size === "xs" && "text-sm",
            size === "md" && "text-3xl",
            size === "lg" && "text-4xl"
          )}
        >
          {emojiFallback}
        </span>
      );
    }
    return (
      <span
        title={name}
        className={cn(
          placeholderBox[size],
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt={`Bandera de ${name}`}
        className={cn(
          imgSize[size],
          "shrink-0 rounded-sm object-cover shadow-sm ring-1 ring-black/20",
          isPlaceholder && "opacity-40"
        )}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => {
          if (idx + 1 < candidates.length) {
            setIdx((i) => i + 1);
          } else {
            setImgFailed(true);
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
  size?: keyof typeof imgSize;
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
