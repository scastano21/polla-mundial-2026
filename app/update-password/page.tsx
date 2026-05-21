"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAppRouter } from "@/hooks/use-app-router";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function UpdatePasswordPage() {
  const router = useAppRouter();
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined") return;
      const hash = window.location.hash?.replace(/^#/, "");
      if (hash?.includes("access_token")) {
        const params = new URLSearchParams(hash);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) {
            toast.error(error.message);
            setChecking(false);
            return;
          }
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
      const { data } = await supabase.auth.getSession();
      if (!cancelled) {
        setReady(!!data.session);
        setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Contraseña actualizada");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
        <h1 className="text-2xl font-black text-white">Nueva contraseña</h1>
        {checking ? (
          <p className="text-zinc-500">Comprobando enlace…</p>
        ) : !ready ? (
          <p className="rounded-2xl border border-amber-900/50 bg-amber-950/30 p-6 text-sm text-amber-200">
            Enlace inválido o caducado. Pide otro desde{" "}
            <Link href="/forgot-password" className="text-yellow-400 underline">
              recuperar contraseña
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div>
              <Label htmlFor="pw">Nueva contraseña</Label>
              <Input
                id="pw"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 bg-zinc-950"
              />
            </div>
            <div>
              <Label htmlFor="pw2">Confirmar</Label>
              <Input
                id="pw2"
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 bg-zinc-950"
              />
            </div>
            <Button type="submit" className="w-full bg-yellow-500 text-black hover:bg-yellow-400">
              Guardar contraseña
            </Button>
          </form>
        )}
      </main>
    </>
  );
}
