import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/landing/Hero";
import { HomeUserGuide } from "@/components/landing/HomeUserGuide";
import { AdSlot } from "@/components/ads/AdSlot";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  applicationCategory: "SportsApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "COP" },
  url: getSiteUrl(),
  inLanguage: "es-CO",
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <Hero />
      <div className="mx-auto w-full max-w-4xl px-4">
        <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME?.trim() || ""} className="my-6" />
      </div>
      <HomeUserGuide />
    </>
  );
}
