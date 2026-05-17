import { readFile } from "node:fs/promises";
import path from "node:path";
import { normalizeTeamFlagCode } from "@/lib/flags";

export const runtime = "nodejs";

const CACHE = "public, max-age=31536000, immutable";

function flagIconsPath(code: string): string {
  return path.join(
    process.cwd(),
    "node_modules",
    "flag-icons",
    "flags",
    "4x3",
    `${code}.svg`
  );
}

async function serveFromFlagCdn(code: string): Promise<Response | null> {
  const url = `https://flagcdn.com/w80/${code}.png`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const body = await res.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": CACHE,
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: { code: string } }
) {
  const code = normalizeTeamFlagCode(params.code);
  if (!code) {
    return new Response("Invalid code", { status: 400 });
  }

  try {
    const svg = await readFile(flagIconsPath(code), "utf-8");
    return new Response(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": CACHE,
      },
    });
  } catch {
    const proxied = await serveFromFlagCdn(code);
    if (proxied) return proxied;
    return new Response("Flag not found", { status: 404 });
  }
}
