"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppRouter } from "@/hooks/use-app-router";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isAdminFromUserMetadata } from "@/lib/tournament-admin";
import { Button } from "@/components/ui/button";
import { DonateNudge } from "@/components/donate-nudge";
import { toast } from "sonner";

export function SiteHeader() {
  const router = useAppRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const denied = document.cookie
      .split("; ")
      .find((c) => c.startsWith("flash_tournament_admin_denied="));
    if (denied) {
      document.cookie =
        "flash_tournament_admin_denied=; Path=/; Max-Age=0; SameSite=Lax";
      toast.error(
        "El panel «Admin torneo» es solo para quien administra los resultados del Mundial, no para admins de cada polla."
      );
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "denegado") {
      params.delete("admin");
      const qs = params.toString();
      router.replace(`${window.location.pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    }
  }, [router]);

  useEffect(() => {
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch (e) {
      console.error("[SiteHeader] Supabase:", e);
      setReady(true);
      return;
    }

    const syncAdmin = async (u: User) => {
      if (isAdminFromUserMetadata(u)) {
        setIsAdmin(true);
        return;
      }

      const res = await fetch("/api/me", { credentials: "include", cache: "no-store" });
      if (res.ok) {
        const body = (await res.json()) as { isAdmin?: boolean };
        if (body.isAdmin === true) {
          setIsAdmin(true);
          return;
        }
      }

      const { data: viaRpc, error: rpcErr } = await supabase.rpc("am_i_tournament_admin");
      if (!rpcErr && viaRpc === true) {
        setIsAdmin(true);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", u.id)
        .maybeSingle();
      if (error) {
        console.warn("[SiteHeader] profiles:", error.message);
        setIsAdmin(false);
        return;
      }
      setIsAdmin(!!data?.is_admin);
    };

    const init = async () => {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      setUser(u);
      if (u) await syncAdmin(u);
      else setIsAdmin(false);
      setReady(true);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) void syncAdmin(u);
      else setIsAdmin(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      setUser(null);
      setIsAdmin(false);
      router.push("/");
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    router.push("/");
    router.refresh();
  };

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-black text-yellow-400">
          Polla 2026
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-3 text-sm font-medium text-zinc-300">
          <Link href="/fixture" className="hover:text-white">
            Fixture
          </Link>
          <Link href="/donate" className="hover:text-white">
            Donar
          </Link>
          <Link href="/dashboard" className="hover:text-white">
            Mis pollas
          </Link>
          {ready && isAdmin && (
            <Link href="/admin" className="hover:text-white" title="Administración del torneo (resultados)">
              Admin torneo
            </Link>
          )}
          {!ready ? (
            <span className="h-9 w-20 animate-pulse rounded-lg bg-zinc-800" aria-hidden />
          ) : user ? (
            <div className="flex items-center gap-2">
              <span className="max-w-[140px] truncate text-xs text-zinc-500" title={user.email ?? ""}>
                {user.email}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-zinc-600 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                onClick={() => void signOut()}
              >
                Salir
              </Button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-white hover:bg-zinc-700"
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
    <DonateNudge />
    </>
  );
}
