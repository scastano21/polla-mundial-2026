/**
 * URL y anon key públicos de Supabase (mismo proyecto).
 * En producción no usamos fallbacks del CLI local: si falta la anon key en Vercel
 * pero sí la URL, el cliente caía en la clave demo y Supabase respondía "Invalid API key".
 */

const FALLBACK_URL = "http://127.0.0.1:54321";
const FALLBACK_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

export function getSupabasePublicConfig(): { url: string; anonKey: string } {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    if (!url || !anonKey) {
      throw new Error(
        "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno de producción. " +
          "En Vercel: Settings → Environment Variables (ambas para Production), sin comillas ni espacios al inicio/final, " +
          "y vuelve a desplegar. La anon key es la «anon public» del mismo proyecto que la URL."
      );
    }
    return { url, anonKey };
  }

  if (url && anonKey) {
    return { url, anonKey };
  }

  return {
    url: url || FALLBACK_URL,
    anonKey: anonKey || FALLBACK_ANON,
  };
}
