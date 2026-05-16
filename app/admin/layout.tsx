import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="border-b border-zinc-800 bg-zinc-900/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <Link href="/admin" className="font-black text-yellow-400">
            Admin
          </Link>
          <nav className="flex flex-wrap gap-3 text-sm text-zinc-400">
            <Link href="/admin/results" className="hover:text-white">
              Resultados
            </Link>
            <Link href="/admin/honor" className="hover:text-white">
              Cuadro de honor
            </Link>
            <Link href="/fixture" className="hover:text-white">
              Fixture público
            </Link>
            <Link href="/" className="hover:text-white">
              Sitio
            </Link>
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
