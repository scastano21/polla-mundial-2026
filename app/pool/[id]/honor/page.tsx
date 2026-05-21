"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { COPY } from "@/lib/copy";
import { TournamentLockBanner } from "@/components/tournament-lock-banner";
import type { TournamentLockState } from "@/lib/tournament-lock";

type Team = { id: string; name: string };

export default function PoolHonorPage() {
  const params = useParams();
  const poolId = params.id as string;
  const supabase = useMemo(() => createClient(), []);

  const [teams, setTeams] = useState<Team[]>([]);
  const [champion, setChampion] = useState("");
  const [runner, setRunner] = useState("");
  const [third, setThird] = useState("");
  const [scorer, setScorer] = useState("");
  const [best, setBest] = useState("");
  const [keeper, setKeeper] = useState("");
  const [young, setYoung] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lock, setLock] = useState<TournamentLockState | null>(null);

  useEffect(() => {
    (async () => {
      const { data: t } = await supabase.from("teams").select("id, name").order("name");
      setTeams((t ?? []) as Team[]);
      const lockRes = await fetch("/api/tournament/lock-status", { cache: "no-store" });
      if (lockRes.ok) setLock((await lockRes.json()) as TournamentLockState);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: row } = await supabase
        .from("honor_predictions")
        .select("*")
        .eq("pool_id", poolId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (row) {
        setChampion(row.champion_team_id ?? "");
        setRunner(row.runner_up_team_id ?? "");
        setThird(row.third_place_team_id ?? "");
        setScorer(row.top_scorer_name ?? "");
        setBest(row.best_player_name ?? "");
        setKeeper(row.best_goalkeeper_name ?? "");
        setYoung(row.best_young_player_name ?? "");
      }
      setLoading(false);
    })();
  }, [poolId, supabase]);

  const globalClosed = lock !== null && !lock.open;
  const readOnly = globalClosed;

  const save = async () => {
    if (readOnly) {
      toast.error("El plazo del cuadro de honor ya cerró.");
      return;
    }
    if (!champion || !runner || !third || !scorer.trim() || !best.trim() || !keeper.trim() || !young.trim()) {
      toast.error("Completa todos los campos del cuadro de honor antes de guardar.");
      return;
    }
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("honor_predictions").upsert(
      {
        user_id: user.id,
        pool_id: poolId,
        champion_team_id: champion || null,
        runner_up_team_id: runner || null,
        third_place_team_id: third || null,
        top_scorer_name: scorer || null,
        best_player_name: best || null,
        best_goalkeeper_name: keeper || null,
        best_young_player_name: young || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,pool_id" }
    );
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Cuadro de honor guardado");
  };

  if (loading) {
    return (
      <>
        <SiteHeader />
        <p className="p-10 text-center text-zinc-400">Cargando…</p>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-2xl font-black text-white">{COPY.honor.title}</h1>
        <p className="mt-2 text-sm text-zinc-400">{COPY.honor.subtitle}</p>
        <p className="mt-1 text-xs text-yellow-600/90">{COPY.honor.deadline}</p>
        <TournamentLockBanner className="mt-4" />

        <div className="mt-8 space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div>
            <Label>{COPY.honor.sections.champion}</Label>
            <Select
              value={champion || undefined}
              onValueChange={(v) => setChampion(v ?? "")}
              disabled={readOnly}
            >
              <SelectTrigger className="mt-1 bg-zinc-950">
                <SelectValue placeholder="Elegir equipo" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{COPY.honor.sections.runner_up}</Label>
            <Select
              value={runner || undefined}
              onValueChange={(v) => setRunner(v ?? "")}
              disabled={readOnly}
            >
              <SelectTrigger className="mt-1 bg-zinc-950">
                <SelectValue placeholder="Elegir equipo" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{COPY.honor.sections.third}</Label>
            <Select
              value={third || undefined}
              onValueChange={(v) => setThird(v ?? "")}
              disabled={readOnly}
            >
              <SelectTrigger className="mt-1 bg-zinc-950">
                <SelectValue placeholder="Elegir equipo" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{COPY.honor.sections.top_scorer}</Label>
            <Input
              className="mt-1 bg-zinc-950"
              value={scorer}
              onChange={(e) => setScorer(e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div>
            <Label>{COPY.honor.sections.best_player}</Label>
            <Input
              className="mt-1 bg-zinc-950"
              value={best}
              onChange={(e) => setBest(e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div>
            <Label>{COPY.honor.sections.best_keeper}</Label>
            <Input
              className="mt-1 bg-zinc-950"
              value={keeper}
              onChange={(e) => setKeeper(e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div>
            <Label>{COPY.honor.sections.best_young}</Label>
            <Input
              className="mt-1 bg-zinc-950"
              value={young}
              onChange={(e) => setYoung(e.target.value)}
              disabled={readOnly}
            />
          </div>
          <p className="text-xs text-zinc-500">{COPY.honor.hint_text}</p>
          {!readOnly && (
            <Button
              type="button"
              data-skip-nav-progress
              onClick={save}
              disabled={saving}
              className="w-full bg-yellow-500 text-black hover:bg-yellow-400"
            >
              {saving ? "Guardando…" : "Guardar definitivo"}
            </Button>
          )}
        </div>

        <p className="mt-6 text-center text-sm">
          <Link href={`/pool/${poolId}`} className="text-yellow-500 hover:underline">
            Volver a la polla
          </Link>
        </p>
      </main>
    </>
  );
}
