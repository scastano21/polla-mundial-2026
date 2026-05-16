import type { Metadata } from "next";

/** Enlace con código de invitación: no indexar. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PoolJoinCodeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
