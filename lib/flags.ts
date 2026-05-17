/**
 * Banderas: API propia (/api/flag/[code]) + flagcdn como respaldo.
 * No depende de public/flags ni de emojis (Windows suele no mostrarlos).
 */

/** Códigos FIFA-3 u otros alias → ISO usado por flag-icons / flagcdn */
const CODE_ALIASES: Record<string, string> = {
  mex: "mx",
  bra: "br",
  arg: "ar",
  usa: "us",
  eng: "gb-eng",
  sco: "gb-sct",
  wal: "gb-wls",
  nir: "gb-nir",
  kor: "kr",
  rsa: "za",
  ger: "de",
  ned: "nl",
  sui: "ch",
  esp: "es",
  fra: "fr",
  por: "pt",
  cro: "hr",
  uru: "uy",
  col: "co",
  chi: "cl",
  per: "pe",
  ecu: "ec",
  par: "py",
  bol: "bo",
  ven: "ve",
  jpn: "jp",
  aus: "au",
  irn: "ir",
  ksa: "sa",
  qat: "qa",
  mar: "ma",
  tun: "tn",
  sen: "sn",
  nga: "ng",
  gha: "gh",
  cam: "cm",
  civ: "ci",
  alg: "dz",
  egy: "eg",
  can: "ca",
  crc: "cr",
  pan: "pa",
  hon: "hn",
  jam: "jm",
  hti: "ht",
  cub: "cu",
};

export function normalizeTeamFlagCode(code: string | null | undefined): string | null {
  if (!code) return null;
  let c = code.trim().toLowerCase();
  if (!c || c.startsWith("ph-")) return null;
  c = CODE_ALIASES[c] ?? c;
  if (!/^[a-z0-9-]+$/.test(c)) return null;
  return c;
}

/** URL estable en el mismo dominio (Vercel siempre tiene flag-icons en node_modules). */
export function getFlagApiUrl(code: string | null | undefined): string | null {
  const c = normalizeTeamFlagCode(code);
  if (!c) return null;
  return `/api/flag/${encodeURIComponent(c)}`;
}

export function getFlagSrcCandidates(code: string | null | undefined): string[] {
  const c = normalizeTeamFlagCode(code);
  if (!c) return [];

  const api = `/api/flag/${encodeURIComponent(c)}`;
  const cdnPng = `https://flagcdn.com/w80/${c}.png`;
  const cdnSvg = `https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/flags/4x3/${c}.svg`;

  return [api, cdnPng, cdnSvg];
}

/** Emoji solo como último recurso en UI (p. ej. accesibilidad); no usar como fuente principal. */
export function flagEmoji(code: string | null | undefined): string | null {
  const c = normalizeTeamFlagCode(code);
  if (!c || c.length !== 2 || c.includes("-")) return null;
  const upper = c.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return null;
  return String.fromCodePoint(
    ...upper.split("").map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65)
  );
}
