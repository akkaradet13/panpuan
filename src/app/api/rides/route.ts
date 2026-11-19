import { revalidatePath } from "next/cache";
import { requireUser } from "@/modules/core/auth";
import { requireClubAdmin } from "@/modules/core/clubs";
import { handle, readJson } from "@/modules/core/http";
import { createRide, parseRideDetails, parseStart } from "@/modules/rides/rides";
import { routeRef } from "./_route-ref";

// POST /api/rides  { club_id, day, hour, minute, title, meet_name, meet_point?, pace_min_kmh, pace_max_kmh, drop_policy, max_riders?, note, route_id? }
export function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser(req);
    const body = ((await readJson(req)) ?? {}) as Record<string, unknown>;
    const club = await requireClubAdmin(String(body.club_id ?? ""), user);
    const details = parseRideDetails(body);
    const ride = await createRide(user.uid, club, await routeRef(details.route_id), parseStart(body), details);
    revalidatePath("/rides");
    revalidatePath("/");
    return ride;
  });
}
