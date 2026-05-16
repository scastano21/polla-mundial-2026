"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username || email.split("@")[0] },
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    toast.success("Cuenta creada. Si Supabase pide confirmar email, revisa tu bandeja.");
    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
        <h1 className="text-2xl font-black text-white">Crear cuenta</h1>
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div>
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 bg-zinc-950"
              placeholder="tu_usuario"
            />
          </div>
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
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 bg-zinc-950"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-yellow-500 text-black hover:bg-yellow-400">
            {loading ? "Creando..." : "Registrarme"}
          </Button>
        </form>
        <p className="text-center text-sm text-zinc-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-yellow-400 hover:underline">
            Entrar
          </Link>
        </p>
      </main>
    </>
  );
}
