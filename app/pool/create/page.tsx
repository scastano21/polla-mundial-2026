"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPoolAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-yellow-500 text-black hover:bg-yellow-400"
    >
      {pending ? "Creando..." : "Crear polla gratis"}
    </Button>
  );
}

export default function CreatePoolPage() {
  const [state, formAction] = useFormState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await createPoolAction(formData)) ?? null;
    },
    null
  );

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="mb-6 text-2xl font-black text-white">Crear polla</h1>
        <form action={formAction} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          {state?.error ? (
            <p className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">
              {state.error}
            </p>
          ) : null}
          <div>
            <Label htmlFor="name">Nombre del grupo</Label>
            <Input
              id="name"
              name="name"
              required
              className="mt-1 bg-zinc-950"
              placeholder="Los del barrio"
            />
          </div>
          <div>
            <Label htmlFor="desc">Descripción (opcional)</Label>
            <Input id="desc" name="description" className="mt-1 bg-zinc-950" />
          </div>
          <SubmitButton />
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
