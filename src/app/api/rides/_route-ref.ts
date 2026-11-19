import "server-only";

import { HttpError } from "@/modules/core/http";
import type { RouteRef } from "@/modules/rides/rides";
import { getRoute } from "@/modules/routes/routes";

/** Copies what rides needs from the routes module (modules don't import each other; the app layer does). */
export async function routeRef(routeId: string | null): Promise<RouteRef | null> {
  if (!routeId) return null;
  const r = await getRoute(routeId);
  if (!r) throw new HttpError(400, "ไม่พบเส้นทางที่เลือก");
  return { id: r.id, name: r.name, slug: r.slug, distance_km: r.distance_km };
}
