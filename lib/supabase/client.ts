import { createBrowserClient } from "@supabase/ssr";

/** Valores demo de Supabase local para que `next build` funcione sin .env (sustituir en producción). */
const FALLBACK_URL = "http://127.0.0.1:54321";
const FALLBACK_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? FALLBACK_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? FALLBACK_ANON;
  return createBrowserClient(url, key);
}
