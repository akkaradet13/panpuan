import type { MetadataRoute } from "next";
import { listClubs } from "@/modules/core/clubs";

export const revalidate = 3600;

const BASE = "https://panpuan.net";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const clubs = await listClubs();
  return [
    { url: BASE },
    { url: `${BASE}/clubs` },
    ...clubs.filter((c) => c.status === "verified").map((c) => ({ url: `${BASE}/clubs/${encodeURIComponent(c.slug)}` })),
  ];
}
