/**
 * Banderas servidas desde /public/flags (copiadas de flag-icons en build).
 * Fallback a CDN solo si falta el archivo local.
 */

export function normalizeTeamFlagCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const c = code.trim().toLowerCase();
  if (!c || c.startsWith("ph-")) return null;
  if (!/^[a-z0-9-]+$/.test(c)) return null;
  return c;
}

/** Rutas a probar en orden (misma origen primero). */
export function getFlagSrcCandidates(code: string | null | undefined): string[] {
  const c = normalizeTeamFlagCode(code);
  if (!c) return [];

  const local = `/flags/${c}.svg`;
  const cdnSvg = `https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/flags/4x3/${c}.svg`;
  const cdnPng = `https://flagcdn.com/w40/${c}.png`;

  if (c === "gb-eng" || c === "gb-sct" || c === "gb-wls") {
    return [local, `https://flagpedia.net/data/flags/w40/${c}.png`, cdnSvg, cdnPng];
  }

  return [local, cdnSvg, cdnPng];
}

/** @deprecated */
export function getFlagIconClasses(code: string | null | undefined): string | null {
  return normalizeTeamFlagCode(code) ? "fi" : null;
}
