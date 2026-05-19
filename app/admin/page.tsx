import Link from "next/link";
import { tryCreateServiceClient } from "@/lib/supabase/service";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const svc = tryCreateServiceClient();
  let pools = 0;
  let users = 0;
  let pending = 0;
  let authUsers = 0;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  if (svc) {
    const [a, b, c, authList] = await Promise.all([
      svc.from("pools").select("*", { count: "exact", head: true }),
      svc.from("profiles").select("*", { count: "exact", head: true }),
      svc.from("matches").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
      svc.auth.admin.listUsers({ page: 1, perPage: 1 }),
    ]);
    pools = a.count ?? 0;
    users = b.count ?? 0;
    pending = c.count ?? 0;
    const listData = authList.data;
    authUsers =
      listData && "total" in listData
        ? (listData.total ?? listData.users.length)
        : (listData?.users?.length ?? 0);
  } else {
    const sb = await createServerSupabase();
    const [pc, prof] = await Promise.all([
      sb.from("pools").select("*", { count: "exact", head: true }),
      sb.from("profiles").select("*", { count: "exact", head: true }),
    ]);
    pools = pc.count ?? 0;
    users = prof.count ?? 0;
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">
          Panel de administración
        </p>
        <h1 className="text-3xl font-black">FIFA Mundial 2026</h1>
        {!svc && (
          <p className="mt-2 rounded-lg border border-amber-500/40 bg-amber-950/30 p-3 text-sm text-amber-200">
            Falta <strong>SUPABASE_SERVICE_ROLE_KEY</strong> en este entorno (en Vercel → Settings →
            Environment Variables → Production). Sin ella el panel no puede contar usuarios ni leer
            todas las pollas. La URL debe ser{" "}
            <span className="font-mono text-amber-100">zpmjazocmuxswkmkzibt.supabase.co</span>
            {supabaseUrl && !supabaseUrl.includes("zpmjazocmuxswkmkzibt") && (
              <>
                {" "}
                — ahora tienes otra:{" "}
                <span className="font-mono">{supabaseUrl.replace(/^https?:\/\//, "")}</span>
              </>
            )}
            .
          </p>
        )}
        {svc && authUsers > 0 && users === 0 && (
          <p className="mt-2 text-xs text-amber-400">
            Hay {authUsers} cuenta(s) en Auth pero 0 perfiles: ejecuta el trigger/SQL de perfiles o
            que cada usuario entre una vez a la app.
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
