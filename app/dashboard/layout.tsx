import type { Metadata } from "next";

/** Panel de usuario tras login — no debe competir por búsquedas genéricas. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
