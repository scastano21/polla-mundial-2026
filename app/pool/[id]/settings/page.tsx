import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DeletePoolButton } from "@/components/pool/delete-pool-button";
import { SiteHeader } from "@/components/site-header";
import { createServerSupabase } from "@/lib/supabase/server";
import { COPY } from "@/lib/copy";
import { getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function PoolSettingsPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/pool/${params.id}/settings`);

  const { data: pool } = await supabase.from("pools").select("*").eq("id", params.id).maybeSingle();
  if (!pool) notFound();
  if (pool.admin_id !== user.id) redirect(`/pool/${pool.id}`);

  const inviteUrl = `${getSiteUrl()}/pool/join/${pool.invite_code}`;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-2xl font-black text-white">Ajustes de la polla</h1>
        <p className="mt-2 text-sm text-zinc-400">{pool.name}</p>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="font-bold text-white">Invitar</h2>
          <p className="mt-2 text-sm text-zinc-400">{COPY.invite.body}</p>
          <p className="mt-4 break-all font-mono text-sm text-yellow-400">{inviteUrl}</p>
          <p className="mt-4 text-xs text-zinc-500">
            Premium (MercadoPago) y edición de cupos: próximo paso en producción.
          </p>
        </div>

        <DeletePoolButton poolId={pool.id} poolName={pool.name} layout="danger" className="mt-8" />

        <p className="mt-8 text-center text-sm">
          <Link href={`/pool/${pool.id}`} className="text-yellow-500 hover:underline">
            Volver
          </Link>
        </p>
      </main>
    </>
  );
}
