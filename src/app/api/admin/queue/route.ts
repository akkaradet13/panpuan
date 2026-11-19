import { listClubsByStatus } from "@/modules/core/clubs";
import { handle } from "@/modules/core/http";
import { listRoutesByStatus } from "@/modules/routes/routes";
import { requireSuperAdmin } from "../_guard";

// GET /api/admin/queue — clubs and routes waiting for verification, plus suspended ones (to restore)
export function GET(req: Request) {
  return handle(async () => {
    await requireSuperAdmin(req);
    const [clubs, routes, suspendedClubs, suspendedRoutes] = await Promise.all([
      listClubsByStatus("unverified"),
      listRoutesByStatus("unverified"),
      listClubsByStatus("suspended"),
      listRoutesByStatus("suspended"),
    ]);
    const c = (x: { id: string; name: string; slug: string; status: string }) => ({ id: x.id, name: x.name, slug: x.slug, status: x.status });
    return { clubs: [...clubs, ...suspendedClubs].map(c), routes: [...routes, ...suspendedRoutes].map(c) };
  });
}
