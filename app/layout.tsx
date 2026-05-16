import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { NavigationProgress } from "@/components/providers/NavigationProgress";
import { SiteFooter } from "@/components/site-footer";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "quiniela",
    "polla",
    "Mundial 2026",
    "FIFA 2026",
    "pronósticos Mundial",
    "quiniela amigos",
    "grupo privado futbol",
    "USA Canada Mexico 2026",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: "Polla Mundialista" }],
  creator: "Polla Mundialista 2026",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "./",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={cn(
          "min-h-screen bg-zinc-950 text-zinc-50 antialiased",
          inter.variable,
          jetbrains.variable
        )}
      >
        <NavigationProgress />
        {children}
        <SiteFooter />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
