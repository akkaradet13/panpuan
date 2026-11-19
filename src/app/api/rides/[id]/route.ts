import { revalidatePath } from "next/cache";
import { requireUser } from "@/modules/core/auth";
import { requireClubAdmin } from "@/modules/core/clubs";
import { fmtDateTime } from "@/modules/core/format";
import { handle, HttpError, readJson } from "@/modules/core/http";
import { notifyUsers } from "@/modules/notify/notify";
import { changeRide, getRide, parseRideDetails, parseStart, type RideChange } from "@/modules/rides/rides";
import { routeRef } from "../_route-ref";

// PATCH /api/rides/{id}
//   { action: "postpone", day, hour, minute, status_note }  -> push "postpone" to everyone signed up
//   { action: "cancel", status_note }                       -> push "cancel"
//   { action: "edit", ...details }                          -> no push
export function PATCH(req: Request, ctx: RouteContext<"/api/rides/[id]">) {
  return handle(async () => {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    const ride = await getRide(id);
    if (!ride) throw new HttpError(404, "ไม่พบทริปนี้");
    await requireClubAdmin(ride.club_id, user);

    const b = ((await readJson(req)) ?? {}) as Record<string, unknown>;
    const note = typeof b.status_note === "string" ? b.status_note.trim().slice(0, 200) : "";
    let change: RideChange;
    if (b.action === "postpone") change = { kind: "postpone", start: parseStart(b), status_note: note };
    else if (b.action === "cancel") change = { kind: "cancel", status_note: note };
    else if (b.action === "edit") {
      const details = parseRideDetails(b);
      change = { kind: "edit", details, route: await routeRef(details.route_id) };
    } else throw new HttpError(400, "คำสั่งไม่ถูกต้อง");

    const result = await changeRide(id, change);
    revalidatePath("/rides");
    revalidatePath(`/rides/${id}`);

    if (change.kind !== "edit") {
      const msg =
        change.kind === "cancel"
          ? { title: `❌ ยกเลิกทริป: ${result.title}`, body: note || "แอดมินยกเลิกทริปนี้แล้ว" }
          : { title: `📅 เลื่อนทริป: ${result.title}`, body: `วันใหม่ ${fmtDateTime(result.start)}${note ? ` · ${note}` : ""}` };
      await notifyUsers(result.uids, { ...msg, url: `/rides/${id}`, tag: `ride-${id}` }, {
        pref: "ride_changes",
        dedupe: { rideId: id, kind: change.kind, start: result.start },
      }).catch((e) => console.error("push failed", e));
    }
    return { ok: true };
  });
}
