const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 6): string {
  let out = "";
  const cryptoObj = globalThis.crypto;
  for (let i = 0; i < length; i++) {
    const idx = cryptoObj
      ? cryptoObj.getRandomValues(new Uint8Array(1))[0] % CHARSET.length
      : Math.floor(Math.random() * CHARSET.length);
    out += CHARSET[idx];
  }
  return out;
}
