/** URL canónica pública — en producción debe ser `NEXT_PUBLIC_APP_URL=https://tu-dominio.com` */

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}

export const SITE_NAME = "Polla Mundialista 2026";

export const SITE_DESCRIPTION =
  "Quiniela y polla privada del FIFA Mundial 2026: pronósticos de todos los partidos, grupos con amigos, tabla en vivo y transparencia. USA, Canadá y México.";
