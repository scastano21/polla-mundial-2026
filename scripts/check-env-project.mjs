import fs from "node:fs";

const paths = [
  "C:/Users/secas/polla-mundial-2026/.env.local",
  "C:/Users/secas/.cursor/projects/C-Users-secas-AppData-Local-Temp-7630dc13-b639-4287-bca7-fc2990cf5c24/polla-mundial/.env.local",
];

for (const p of paths) {
  console.log("\n---", p);
  if (!fs.existsSync(p)) {
    console.log("  (no existe)");
    continue;
  }
  const t = fs.readFileSync(p, "utf8");
  const url = t.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim();
  const anon = t.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$/m)?.[1]?.trim();
  const refFromJwt = (jwt) => {
    try {
      return JSON.parse(Buffer.from(jwt.split(".")[1], "base64url")).ref;
    } catch {
      return "?";
    }
  };
  const urlRef = url?.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
  console.log("  URL:", url || "(vacío)");
  console.log("  URL ref:", urlRef || "?");
  console.log("  ANON ref:", anon ? refFromJwt(anon) : "(vacío)");
  console.log("  Coinciden:", urlRef && anon ? urlRef === refFromJwt(anon) : "?");
}
