import Link from "next/link";
import { tryCreateServiceClient } from "@/lib/supabase/service";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const svc = tryCreateServiceClient();
  let pools = 0;
  let users = 0;
  let pending = 0;

  if (svc) {
    const [a, b, c] = await Promise.all([
      svc.from("pools").select("*", { count: "exact", head: true }),
      svc.from("profiles").select("*", { count: "exact", head: true }),
      svc.from("matches").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
    ]);
    pools = a.count ?? 0;
    users = b.count ?? 0;
    pending = c.count ?? 0;
  } else {
    const sb = await createServerSupabase();
    const pc = await sb.from("pools").select("*", { count: "exact", head: true });
    pools = pc.count ?? 0;
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">
          Panel de administración
        </p>
        <h1 className="text-3xl font-black">FIFA Mundial 2026</h1>
        {!svc && (
          <p className="mt-2 text-xs text-amber-400">
            Añade SUPABASE_SERVICE_ROLE_KEY en .env.local para ver conteos completos en local.
          </p>
        )}
      </header>

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-400">Pollas</p>
          <p className="text-3xl font-black text-white">{pools}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-400">Usuarios</p>
          <p className="text-3xl font-black text-white">{users}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-400">Partidos pendientes</p>
          <p className="text-3xl font-black text-white">{pending}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/results"
          className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-6 font-bold text-yellow-200 hover:bg-yellow-500/20"
        >
          Ingresar resultados →
        </Link>
        <Link
          href="/admin/honor"
          className="rounded-xl border border-zinc-700 bg-zinc-900 p-6 font-bold hover:border-zinc-500"
        >
          Cuadro de honor (final) →
        </Link>
      </div>
    </main>
  );
}
