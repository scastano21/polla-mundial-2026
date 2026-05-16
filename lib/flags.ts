/**
 * Banderas desde CDNs públicos. flagcdn a veces falla (extensiones, red, códigos compuestos).
 * Prioridad: flag-icons (SVG vía jsDelivr) → flagcdn PNG → flagpedia (algunas subregiones).
 */
const FLAG_ICONS_VER = "7.2.3";
const JSDELIVR_FLAGS = `https://cdn.jsdelivr.net/npm/flag-icons@${FLAG_ICONS_VER}/flags/4x3`;

export function getFlagUrlCandidates(code: string): string[] {
  const c = code.trim().toLowerCase();
  if (!c || c.startsWith("ph-")) return [];

  const svg = `${JSDELIVR_FLAGS}/${c}.svg`;
  const pngCdn = `https://flagcdn.com/w40/${c}.png`;

  if (c === "gb-eng" || c === "gb-sct" || c === "gb-wls" || c.startsWith("gb-")) {
    return [svg, `https://flagpedia.net/data/flags/w40/${c}.png`, pngCdn];
  }

  return [svg, pngCdn];
}

/** Primera URL candidata (retrocompatibilidad). */
export function getFlagUrl(code: string, _size: 40 | 80 | 160 = 40): string {
  return getFlagUrlCandidates(code)[0] ?? "";
}

export function teamFlagUrl(code: string): string {
  return getFlagUrl(code, 40);
}
