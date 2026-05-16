import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

/** Rutas públicas indexables — sin pollas privadas ni códigos de invitación. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  const paths = [
    { path: "/", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/pool/join", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/pool/create", changeFrequency: "monthly" as const, priority: 0.85 },
    { path: "/register", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/donate", changeFrequency: "monthly" as const, priority: 0.6 },
    { path: "/fixture", changeFrequency: "weekly" as const, priority: 0.75 },
  ] as const;

  return paths.map(({ path, changeFrequency, priority }) => ({
    url: path === "/" ? `${base}/` : `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
