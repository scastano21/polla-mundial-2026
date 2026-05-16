import { getFlagIconClasses } from "@/lib/flags";
import { cn } from "@/lib/utils";

const flagTextSize = {
  xs: "text-[14px]",
  sm: "text-[20px]",
  md: "text-[32px]",
  lg: "text-[44px]",
} as const;

const placeholderBox = {
  xs: "h-3.5 w-5",
  sm: "h-5 w-8",
  md: "h-8 w-12",
  lg: "h-11 w-16",
} as const;

export function Flag({
  code,
  name,
  size = "sm",
}: {
  code: string;
  name: string;
  size?: keyof typeof flagTextSize;
}) {
  const iconClasses = getFlagIconClasses(code);
  const isPlaceholder = code.trim().toLowerCase().startsWith("ph-");

  if (!iconClasses) {
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

  return (
    <span
      role="img"
      aria-label={`Bandera de ${name}`}
      title={name}
      className={cn(
        iconClasses,
        flagTextSize[size],
        "inline-block shrink-0 overflow-hidden rounded-sm shadow-sm leading-none",
        isPlaceholder && "opacity-40"
      )}
    />
  );
}

export function TeamDisplay({
  team,
  align = "left",
  size = "sm",
}: {
  team: { name: string; code: string } | null;
  align?: "left" | "right";
  size?: keyof typeof flagTextSize;
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
