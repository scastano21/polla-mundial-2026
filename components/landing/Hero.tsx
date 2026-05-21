import Image from "next/image";
import Link from "next/link";
import { COPY } from "@/lib/copy";

/** Hero desktop 1376×768 — hospedada en electricolor.com.co */
export const HERO_IMAGE_URL =
  "https://electricolor.com.co/wp-content/uploads/2026/05/hero.wepb_.webp";

export function Hero() {
  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-black">
      <Image
        src={HERO_IMAGE_URL}
        alt="Polla del Mundial FIFA 2026 — Chocogol"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-mundial-gradient opacity-15" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-20">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-yellow-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
            FIFA MUNDIAL 2026
          </span>
          <span className="text-xs text-zinc-500">USA · CAN · MEX · 11 jun – 19 jul</span>
        </div>

        <h1 className="mb-4 text-5xl font-black leading-none text-white md:text-7xl">
          ¿Quién sabe más de
          <br />
          <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            fútbol
          </span>{" "}
          en tu grupo?
        </h1>
        <p className="mb-8 max-w-xl text-xl text-zinc-300">{COPY.hero.subtitle}</p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/register"
            className="rounded-xl bg-yellow-500 px-8 py-3.5 text-base font-bold text-black shadow-lg shadow-yellow-500/20 transition-all hover:bg-yellow-400"
          >
            {COPY.hero.cta_main}
          </Link>
          <Link
            href="/pool/join"
            className="rounded-xl border border-white/20 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
          >
            {COPY.hero.cta_join}
          </Link>
        </div>

        <p className="mt-4 text-sm">
          <Link href="#guia" className="text-zinc-400 underline-offset-4 hover:text-yellow-400 hover:underline">
            Guía: cómo funcionan grupos, varias pollas, tabla y transparencia
          </Link>
        </p>

        <div className="mt-8 flex flex-wrap gap-6">
          {[
            { icon: "☕", text: "Donativo opcional para mantener el sitio" },
            { icon: "⚡", text: "Puntos automáticos" },
            { icon: "🔒", text: "Grupos privados" },
            { icon: "📱", text: "Funciona en el celular" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm text-zinc-400">
              <span>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
