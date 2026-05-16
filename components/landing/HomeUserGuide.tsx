import Link from "next/link";
import { COPY } from "@/lib/copy";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HomeUserGuide() {
  const g = COPY.homeGuide;

  return (
    <section
      id="guia"
      className="scroll-mt-24 border-t border-zinc-800 bg-zinc-950 py-16 text-zinc-200"
      aria-labelledby="guia-titulo"
    >
      <div className="mx-auto max-w-5xl px-6">
        <h2 id="guia-titulo" className="text-3xl font-black text-white md:text-4xl">
          {g.title}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-400">{g.intro}</p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {g.sections.map((sec) => (
            <article
              key={sec.title}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-sm"
            >
              <h3 className="text-lg font-bold text-yellow-400">{sec.title}</h3>
              <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-relaxed text-zinc-300 marker:text-zinc-600">
                {sec.bullets.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </article>
          ))}

          <article className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-6 md:col-span-2">
            <h3 className="text-lg font-bold text-yellow-400">{g.donateCardTitle}</h3>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-300">{g.donateCardBody}</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <Link href="/donate" className={cn(buttonVariants({ size: "lg" }), "bg-yellow-500 text-black hover:bg-yellow-400")}>
                Ir a donar
              </Link>
              <span className="max-w-md text-xs leading-relaxed text-zinc-500">{g.donateCardFootnote}</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
