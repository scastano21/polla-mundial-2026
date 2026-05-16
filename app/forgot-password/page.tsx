"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const origin =
      (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
        (typeof window !== "undefined" ? window.location.origin : "")) || "";
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${origin}/update-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Revisa tu correo (y la carpeta de spam)");
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
        <h1 className="text-2xl font-black text-white">Recuperar contraseña</h1>
        {sent ? (
          <p className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-sm text-zinc-300">
            Si existe una cuenta con ese email, te enviamos un enlace para elegir una nueva contraseña.
            Asegúrate de que en Supabase (Authentication → URL configuration) esté permitida la URL{" "}
            <code className="text-yellow-400">…/update-password</code>.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div>
              <Label htmlFor="email">Email de tu cuenta</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 bg-zinc-950"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-yellow-500 text-black hover:bg-yellow-400">
              {loading ? "Enviando…" : "Enviar enlace"}
            </Button>
          </form>
        )}
        <p className="text-center text-sm text-zinc-500">
          <Link href="/login" className="text-yellow-400 hover:underline">
            Volver a entrar
          </Link>
        </p>
      </main>
    </>
  );
}
