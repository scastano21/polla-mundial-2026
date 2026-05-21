"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppRouter } from "@/hooks/use-app-router";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function JoinPoolLandingPage() {
  const router = useAppRouter();
  const [code, setCode] = useState("");

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (c.length < 4) return;
    router.push(`/pool/join/${c}`);
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="mb-2 text-2xl font-black text-white">Unirme a una polla</h1>
        <p className="mb-6 text-sm text-zinc-400">Pega el código de invitación que te compartió el admin.</p>
        <form onSubmit={go} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div>
            <Label htmlFor="code">Código</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 bg-zinc-950 font-mono uppercase"
              placeholder="ABC12X"
              maxLength={8}
            />
          </div>
          <Button type="submit" className="w-full bg-yellow-500 text-black hover:bg-yellow-400">
            Continuar
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link href="/dashboard" className="text-yellow-400 hover:underline">
            Volver al panel
          </Link>
        </p>
      </main>
    </>
  );
}
