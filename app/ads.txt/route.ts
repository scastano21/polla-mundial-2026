import { ADSENSE_PUBLISHER_LINE } from "@/lib/adsense-config";

/** Sirve ads.txt con text/plain explícito (rastreador de Google / AdSense). */
export function GET() {
  return new Response(`${ADSENSE_PUBLISHER_LINE}\n`, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
