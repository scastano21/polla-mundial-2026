"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type Team = { id: string; name: string };

export default function AdminHonorPage() {
  const supabase = useMemo(() => createClient(), []);
  const [teams, setTeams] = useState<Team[]>([]);
  const [champion, setChampion] = useState("");
  const [runner, setRunner] = useState("");
  const [third, setThird] = useState("");
  const [scorer, setScorer] = useState("");
  const [best, setBest] = useState("");
  const [keeper, setKeeper] = useState("");
  const [young, setYoung] = useState("");
  const [isFinal, setIsFinal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: t } = await supabase.from("teams").select("id, name").order("name");
      setTeams((t ?? []) as Team[]);
      const { data: hr } = await supabase
        .from("honor_results")
        .select("*")
        .eq("tournament_year", 2026)
        .maybeSingle();
      if (hr) {
        setChampion(hr.champion_team_id ?? "");
        setRunner(hr.runner_up_team_id ?? "");
        setThird(hr.third_place_team_id ?? "");
        setScorer(hr.top_scorer_name ?? "");
        setBest(hr.best_player_name ?? "");
        setKeeper(hr.best_goalkeeper_name ?? "");
        setYoung(hr.best_young_player_name ?? "");
        setIsFinal(Boolean(hr.is_final));
      }
      setLoading(false);
    })();
  }, [supabase]);

  const save = async () => {
    const res = await fetch("/api/admin/honor-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        championTeamId: champion || null,
        runnerUpTeamId: runner || null,
        thirdPlaceTeamId: third || null,
        topScorerName: scorer || null,
        bestPlayerName: best || null,
        bestGoalkeeperName: keeper || null,
        bestYoungPlayerName: young || null,
        isFinal,
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(j.error ?? "Error");
      return;
    }
    toast.success("Guardado");
  };

  if (loading) return <p className="p-8 text-zinc-400">Cargando…</p>;

  return (
    <main className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-2xl font-black">Cuadro de honor (oficial)</h1>
      <p className="text-sm text-zinc-400">
        Activa &quot;Resultado oficial&quot; solo cuando FIFA lo confirme: se reparten puntos del
        cuadro de honor en todas las pollas.
      </p>

      <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div>
          <Label>Campeón</Label>
          <Select value={champion || undefined} onValueChange={(v) => setChampion(v ?? "")}>
            <SelectTrigger className="mt-1 bg-zinc-950">
              <SelectValue placeholder="Equipo" />
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
          <Label>Subcampeón</Label>
          <Select value={runner || undefined} onValueChange={(v) => setRunner(v ?? "")}>
            <SelectTrigger className="mt-1 bg-zinc-950">
              <SelectValue placeholder="Equipo" />
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
          <Label>Tercer puesto</Label>
          <Select value={third || undefined} onValueChange={(v) => setThird(v ?? "")}>
            <SelectTrigger className="mt-1 bg-zinc-950">
              <SelectValue placeholder="Equipo" />
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
          <Label>Goleador</Label>
          <Input className="mt-1 bg-zinc-950" value={scorer} onChange={(e) => setScorer(e.target.value)} />
        </div>
        <div>
          <Label>Mejor jugador</Label>
          <Input className="mt-1 bg-zinc-950" value={best} onChange={(e) => setBest(e.target.value)} />
        </div>
        <div>
          <Label>Mejor portero</Label>
          <Input className="mt-1 bg-zinc-950" value={keeper} onChange={(e) => setKeeper(e.target.value)} />
        </div>
        <div>
          <Label>Mejor sub-21</Label>
          <Input className="mt-1 bg-zinc-950" value={young} onChange={(e) => setYoung(e.target.value)} />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
          <div>
            <p className="font-bold text-yellow-200">Resultado oficial</p>
            <p className="text-xs text-zinc-400">Calcula puntos en todas las pollas.</p>
          </div>
          <Switch checked={isFinal} onCheckedChange={setIsFinal} />
        </div>
        <Button
          type="button"
          data-skip-nav-progress
          onClick={save}
          className="w-full bg-yellow-500 font-bold text-black"
        >
          Guardar
        </Button>
      </div>
    </main>
  );
}
