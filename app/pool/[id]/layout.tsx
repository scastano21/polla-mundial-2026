import type { Metadata } from "next";

/** Pollas por UUID: mejor no indexar (privacidad, sin contenido público estable). */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PoolIdLayout({ children }: { children: React.ReactNode }) {
  return children;
}
