import { getSiteUrl, isLocalhostUrl } from "@/lib/seo";

/**
 * Base URL para enlaces de auth (confirmación, recuperar contraseña).
 * En el navegador usa el dominio real si el env sigue en localhost.
 */
export function getAuthRedirectBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const live = window.location.origin;
    if (!fromEnv || isLocalhostUrl(fromEnv)) return live;
    return fromEnv;
  }

  return getSiteUrl();
}

export function authRedirectTo(path: string): string {
  const base = getAuthRedirectBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
