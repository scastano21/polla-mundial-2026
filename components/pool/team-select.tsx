"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Team = { id: string; name: string };

/** Selector de equipo que muestra el nombre, no el UUID en el trigger. */
export function TeamSelect({
  value,
  onValueChange,
  teams,
  placeholder = "Elegir equipo",
  disabled,
  className,
}: {
  value: string;
  onValueChange: (id: string) => void;
  teams: Team[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const label = teams.find((t) => t.id === value)?.name;

  return (
    <Select
      value={value || undefined}
      onValueChange={(v) => onValueChange(v ?? "")}
      disabled={disabled}
    >
      <SelectTrigger className={cn("mt-1 w-full bg-zinc-950", className)}>
        <span className={cn("truncate", !label && "text-zinc-500")}>
          {label ?? placeholder}
        </span>
      </SelectTrigger>
      <SelectContent>
        {teams.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
