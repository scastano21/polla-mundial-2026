import Link from "next/link";
import { redirect } from "next/navigation";
import { DeletePoolButton } from "@/components/pool/delete-pool-button";
import { SiteHeader } from "@/components/site-header";
import { createServerSupabase } from "@/lib/supabase/server";
import { COPY } from "@/lib/copy";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const { data: asAdmin } = await supabase.from("pools").select("*").eq("admin_id", user.id);

  const { data: memberships } = await supabase
    .from("pool_members")
    .select("pool_id, pools(id, name, invite_code, is_premium, max_members)")
    .eq("user_id", user.id);

  type PoolRow = {
    id: string;
    name: string;
    invite_code: string;
    is_premium: boolean;
    max_members: number;
  };

  const memberPools: PoolRow[] = (memberships ?? []).flatMap((m) => {
    const p = m.pools as PoolRow | PoolRow[] | null;
    if (!p) return [];
    return Array.isArray(p) ? p : [p];
  });

  const byId = new Map<string, (typeof memberPools)[0] & { role?: string }>();
  for (const p of asAdmin ?? []) {
    byId.set(p.id, { ...p, role: "admin" });
  }
  for (const p of memberPools) {
    if (!byId.has(p.id)) byId.set(p.id, { ...p, role: "miembro" });
  }

  const pools = Array.from(byId.values());

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-2 text-3xl font-black text-white">Mis pollas</h1>
        <p className="mb-8 text-sm text-zinc-400">{COPY.empty.no_pools_body}</p>

        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/pool/create"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-yellow-500 text-black hover:bg-yellow-400"
            )}
          >
            {COPY.empty.no_pools_cta}
          </Link>
          <Link
            href="/pool/join"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-zinc-600")}
          >
            Unirme con código
          </Link>
        </div>

        <ul className="space-y-3">
          {pools.map((p) => (
            <li key={p.id}>
              <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href={`/pool/${p.id}`}
                  className="min-w-0 flex-1 transition-colors hover:opacity-90"
                >
                  <p className="font-bold text-white">{p.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Código: <span className="font-mono text-yellow-500">{p.invite_code}</span> ·{" "}
                    {p.role}
                  </p>
                </Link>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {p.role === "admin" && <DeletePoolButton poolId={p.id} poolName={p.name} />}
                  <Link
                    href={`/pool/${p.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-zinc-600")}
                  >
                    Abrir
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {pools.length === 0 && (
          <p className="rounded-xl border border-dashed border-zinc-700 p-6 text-center text-zinc-500">
            {COPY.empty.no_pools_title}
          </p>
        )}
      </main>
    </>
  );
}
