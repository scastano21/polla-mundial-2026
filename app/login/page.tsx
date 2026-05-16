"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    router.push(redirect);
    router.refresh();
  };

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-black text-white">Entrar</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 bg-zinc-950"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link href="/forgot-password" className="text-xs text-yellow-400 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 bg-zinc-950"
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-yellow-500 text-black hover:bg-yellow-400">
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
      <p className="text-center text-sm text-zinc-500">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-yellow-400 hover:underline">
          Regístrate
        </Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<p className="p-10 text-center text-zinc-500">Cargando…</p>}>
        <LoginForm />
      </Suspense>
    </>
  );
}
