import type { MetadataRoute } from "next";
import { listClubs } from "@/modules/core/clubs";
import { listUpcomingRides } from "@/modules/rides/rides";
import { listRoutes } from "@/modules/routes/routes";

export const revalidate = 3600;

const BASE = "https://panpuan.net";
const u = (path: string) => BASE + encodeURI(path);

// Only verified clubs/routes (unverified pages are noindex), districts with verified content, rides not finished.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [clubs, routes, rides] = await Promise.all([listClubs(), listRoutes(), listUpcomingRides()]);
  const vClubs = clubs.filter((c) => c.status === "verified");
  const vRoutes = routes.filter((r) => r.status === "verified");
  const districts = new Set([...vClubs.map((c) => c.district), ...vRoutes.map((r) => r.district)]);
  return [
    { url: BASE },
    { url: u("/rides") },
    { url: u("/routes") },
    { url: u("/clubs") },
    ...vRoutes.map((r) => ({ url: u(`/routes/${r.slug}`) })),
    ...vClubs.map((c) => ({ url: u(`/clubs/${c.slug}`) })),
    ...[...districts].map((d) => ({ url: u(`/districts/${d}`) })),
    ...rides.filter((r) => r.status !== "cancelled").map((r) => ({ url: u(`/rides/${r.id}`) })),
  ];
}
