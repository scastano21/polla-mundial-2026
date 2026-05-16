"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_MAX_POOL_MEMBERS } from "@/lib/constants";
import { generateInviteCode } from "@/lib/invite-code";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CreatePoolPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Debes iniciar sesión");
      router.push("/login?redirect=/pool/create");
      return;
    }

    setLoading(true);
    let invite = generateInviteCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: pool, error } = await supabase
        .from("pools")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          invite_code: invite,
          admin_id: user.id,
          max_members: DEFAULT_MAX_POOL_MEMBERS,
          is_premium: false,
        })
        .select("id")
        .single();

      if (!error && pool) {
        await supabase.from("scoring_rules").insert({ pool_id: pool.id });
        await supabase.from("pool_members").insert({
          pool_id: pool.id,
          user_id: user.id,
        });
        toast.success("Polla creada");
        router.push(`/pool/${pool.id}`);
        router.refresh();
        setLoading(false);
        return;
      }
      if (error?.code === "23505") {
        invite = generateInviteCode();
        continue;
      }
      toast.error(error?.message ?? "No se pudo crear la polla");
      setLoading(false);
      return;
    }
    toast.error("Intenta de nuevo");
    setLoading(false);
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="mb-6 text-2xl font-black text-white">Crear polla</h1>
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div>
            <Label htmlFor="name">Nombre del grupo</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 bg-zinc-950"
              placeholder="Los del barrio"
            />
          </div>
          <div>
            <Label htmlFor="desc">Descripción (opcional)</Label>
            <Input
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 bg-zinc-950"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 text-black hover:bg-yellow-400"
          >
            {loading ? "Creando..." : "Crear polla gratis"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link href="/dashboard" className="text-yellow-400 hover:underline">
            Volver
          </Link>
        </p>
      </main>
    </>
  );
}
