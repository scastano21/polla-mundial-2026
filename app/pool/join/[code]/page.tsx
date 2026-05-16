import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createServerSupabase } from "@/lib/supabase/server";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEFAULT_MAX_POOL_MEMBERS } from "@/lib/constants";
import { joinPoolById } from "./actions";

export const dynamic = "force-dynamic";

export default async function JoinPoolCodePage({ params }: { params: { code: string } }) {
  const code = params.code.trim().toUpperCase();
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/pool/join/${encodeURIComponent(code)}`);

  const { data: inviteRows, error: inviteErr } = await supabase.rpc("pool_by_invite_code", {
    p_code: code,
  });

  if (inviteErr) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-white">Configuración pendiente</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Falta aplicar la migración SQL en Supabase:{" "}
            <code className="rounded bg-zinc-800 px-1 text-xs">pool_by_invite_code</code> (
            {inviteErr.message})
          </p>
          <Link
            href="/pool/join"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-6 inline-flex bg-yellow-500 text-black hover:bg-yellow-400"
            )}
          >
            Volver
          </Link>
        </main>
      </>
    );
  }

  type InvitePoolRow = {
    id: string;
    name: string;
    invite_code: string;
    max_members: number | null;
    is_premium: boolean | null;
    admin_id: string;
    member_count: number;
  };

  const pool = (Array.isArray(inviteRows) ? inviteRows[0] : null) as InvitePoolRow | null;

  if (!pool) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-white">Código no encontrado</h1>
          <p className="mt-2 text-sm text-zinc-400">Revisa mayúsculas y evita confundir O con 0.</p>
          <Link
            href="/pool/join"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-6 inline-flex bg-yellow-500 text-black hover:bg-yellow-400"
            )}
          >
            Probar otro código
          </Link>
        </main>
      </>
    );
  }

  const members = Number(pool.member_count ?? 0);
  const full = members >= (pool.max_members ?? DEFAULT_MAX_POOL_MEMBERS);

  const { data: already } = await supabase
    .from("pool_members")
    .select("id")
    .eq("pool_id", pool.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (already) {
    redirect(`/pool/${pool.id}`);
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-2xl font-black text-white">{pool.name}</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Cupos: {members} / {pool.max_members ?? DEFAULT_MAX_POOL_MEMBERS}
          {pool.is_premium ? " · Premium" : ""}
        </p>
        {full ? (
          <p className="mt-6 rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-200">
            Este grupo está lleno. Pide al admin que active Premium o liberen un cupo.
          </p>
        ) : (
          <form action={joinPoolById.bind(null, pool.id)} className="mt-8">
            <Button type="submit" className="w-full bg-yellow-500 text-black hover:bg-yellow-400">
              Unirme a esta polla
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm">
          <Link href="/dashboard" className="text-yellow-400 hover:underline">
            Cancelar
          </Link>
        </p>
      </main>
    </>
  );
}
