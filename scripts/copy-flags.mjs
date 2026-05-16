/**
 * Copia SVG de flag-icons a public/flags para servir desde el mismo dominio (Vercel).
 * Se ejecuta en postinstall y prebuild.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "node_modules", "flag-icons", "flags", "4x3");
const dest = path.join(root, "public", "flags");

if (!fs.existsSync(src)) {
  console.warn("[copy-flags] flag-icons no instalado; ejecuta npm install");
  process.exit(0);
}

fs.mkdirSync(dest, { recursive: true });
fs.cpSync(src, dest, { recursive: true });
console.log("[copy-flags] Banderas copiadas a public/flags");
