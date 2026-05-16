export function getFlagUrl(code: string, size: 40 | 80 | 160 = 40): string {
  const c = code.toLowerCase();
  if (c === "gb-eng" || c === "gb-sct") {
    return `https://flagpedia.net/data/flags/w${size}/${c}.png`;
  }
  return `https://flagcdn.com/w${size}/${c}.png`;
}

export function teamFlagUrl(code: string): string {
  return getFlagUrl(code, 40);
}
