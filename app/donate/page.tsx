import { SiteHeader } from "@/components/site-header";
import { DonationWidget } from "@/components/donations/DonationWidget";
import { COPY } from "@/lib/copy";
import Link from "next/link";

export default function DonatePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="mb-2 text-2xl font-black text-white">{COPY.donate.title}</h1>
        <p className="mb-8 text-sm text-zinc-400">{COPY.donate.subtitle}</p>
        <DonationWidget />
        <p className="mt-8 text-center text-sm">
          <Link href="/" className="text-yellow-500 hover:underline">
            Volver al inicio
          </Link>
        </p>
      </main>
    </>
  );
}
