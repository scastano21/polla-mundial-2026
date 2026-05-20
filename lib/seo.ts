/** URL canónica pública — en producción: NEXT_PUBLIC_APP_URL=https://www.chocogol.site */

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

export function isLocalhostUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

/**
 * Base URL de la app (invites, sitemap, Mercado Pago, enlaces de auth en servidor).
 * Prioridad: NEXT_PUBLIC_APP_URL (si no es localhost) → dominio de producción en Vercel → localhost.
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv && !isLocalhostUrl(fromEnv)) {
    return stripTrailingSlash(fromEnv);
  }

  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProd) {
    const host = vercelProd.replace(/^https?:\/\//i, "");
    return `https://${stripTrailingSlash(host)}`;
  }

  if (process.env.VERCEL === "1" && process.env.VERCEL_URL?.trim()) {
    return `https://${stripTrailingSlash(process.env.VERCEL_URL.trim())}`;
  }

  if (fromEnv) return stripTrailingSlash(fromEnv);
  return "http://localhost:3000";
}

export const SITE_NAME = "Polla Mundialista 2026";

export const SITE_DESCRIPTION =
  "Quiniela y polla privada del FIFA Mundial 2026: pronósticos de todos los partidos, grupos con amigos, tabla en vivo y transparencia. USA, Canadá y México.";
