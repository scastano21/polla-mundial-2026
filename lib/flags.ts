/**
 * Banderas vía paquete `flag-icons` (CSS embebido en el build).
 * No depende de CDN externos — evita bloqueos en Vercel / navegador.
 */

/** Código ISO / flag-icons (ej. mx, gb-eng). null si no hay bandera. */
export function normalizeTeamFlagCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const c = code.trim().toLowerCase();
  if (!c || c.startsWith("ph-")) return null;
  if (!/^[a-z0-9-]+$/.test(c)) return null;
  return c;
}

/** Clases CSS flag-icons: `fi fi-mx`. */
export function getFlagIconClasses(code: string | null | undefined): string | null {
  const c = normalizeTeamFlagCode(code);
  if (!c) return null;
  return `fi fi-${c}`;
}
