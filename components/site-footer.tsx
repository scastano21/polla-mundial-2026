import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEVELOPER_NAME = "Sebastián Castaño";
const CONTACT_EMAIL = "secasta21@gmail.com";
/** Colombia +57, sin espacios ni símbolos para wa.me */
const WHATSAPP_PHONE_E164 = "573153242501";

const ENTERPRISE_WHATSAPP_MESSAGE = encodeURIComponent(
  "Hola Sebastián, me interesa conocer Polla para empresas (quiniela / polla corporativa para el Mundial)."
);

const whatsappHref = `https://wa.me/${WHATSAPP_PHONE_E164}?text=${ENTERPRISE_WHATSAPP_MESSAGE}`;

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-900 bg-zinc-950 py-10 text-center text-xs text-zinc-500">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-6">
        <p className="text-sm text-zinc-400">
          Desarrollado por <span className="font-semibold text-zinc-300">{DEVELOPER_NAME}</span>.
          <br />
          Todos los derechos reservados.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-zinc-400">
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-yellow-500/90 hover:underline">
            {CONTACT_EMAIL}
          </a>
          <a href={whatsappHref} className="hover:underline" target="_blank" rel="noopener noreferrer">
            WhatsApp {WHATSAPP_PHONE_E164.replace(/^57/, "")}
          </a>
        </div>
        <Link
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300"
          )}
        >
          Polla para empresas
        </Link>
        <p className="text-[11px] text-zinc-600">Polla Mundialista 2026</p>
      </div>
    </footer>
  );
}
