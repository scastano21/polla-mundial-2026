/**
 * Banderas: emoji para códigos ISO-2 (siempre visible) + SVG en /public/flags + CDN.
 */

export function normalizeTeamFlagCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const c = code.trim().toLowerCase();
  if (!c || c.startsWith("ph-")) return null;
  if (!/^[a-z0-9-]+$/.test(c)) return null;
  return c;
}

/** Emoji 🇲🇽 para códigos de 2 letras (mx, br, …). */
export function flagEmoji(code: string | null | undefined): string | null {
  const c = normalizeTeamFlagCode(code);
  if (!c || c.length !== 2 || c.includes("-")) return null;
  const upper = c.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return null;
  return String.fromCodePoint(
    ...upper.split("").map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65)
  );
}

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
