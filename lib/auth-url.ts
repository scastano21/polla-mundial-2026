import { getSiteUrl } from "@/lib/seo";

/**
 * Base URL para enlaces de auth (confirmación, recuperar contraseña).
 * En el navegador, si NEXT_PUBLIC_APP_URL apunta a localhost en producción,
 * usa window.location.origin (dominio real de Vercel).
 */
export function getAuthRedirectBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const live = window.location.origin;
    if (!fromEnv || fromEnv.includes("localhost") || fromEnv.includes("127.0.0.1")) {
      return live;
    }
    return fromEnv;
  }
  return getSiteUrl();
}

export function authRedirectTo(path: string): string {
  const base = getAuthRedirectBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
