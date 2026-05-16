"use client";

import { getFlagUrl } from "@/lib/flags";
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
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- URLs externas (flagcdn / flagpedia) */}
      <img
        src={getFlagUrl(code, 40)}
        alt={`Bandera de ${name}`}
        className={cn(
          dims[size],
          "rounded-sm object-cover shadow-sm",
          code.startsWith("ph-") && "opacity-40"
        )}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.opacity = "0.2";
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
