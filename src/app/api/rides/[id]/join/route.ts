import { requireUser } from "@/modules/core/auth";
import { handle, HttpError } from "@/modules/core/http";
import { getOrCreateUser } from "@/modules/core/users";
import { notifyUsers } from "@/modules/notify/notify";
import { getRide, joinRide, leaveRide } from "@/modules/rides/rides";

// POST /api/rides/{id}/join — sign up (going, or waitlist when full)
export function POST(req: Request, ctx: RouteContext<"/api/rides/[id]/join">) {
  return handle(async () => {
    const p = await getOrCreateUser(await requireUser(req));
    return joinRide((await ctx.params).id, { uid: p.uid, display_name: p.display_name, photo_url: p.photo_url });
  });
}

// DELETE /api/rides/{id}/join — cancel sign-up; the first waitlisted rider is promoted and notified
export function DELETE(req: Request, ctx: RouteContext<"/api/rides/[id]/join">) {
  return handle(async () => {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    const { promoted } = await leaveRide(id, user.uid);
    if (promoted) {
      const ride = await getRide(id);
      if (!ride) throw new HttpError(404, "ไม่พบทริปนี้");
      await notifyUsers(
        [promoted],
        { title: `🎉 ได้ที่แล้ว: ${ride.title}`, body: "มีคนสละที่ คุณได้ไปปั่นด้วยแล้ว", url: `/rides/${id}`, tag: `ride-${id}` },
        { pref: "ride_changes", dedupe: { rideId: id, kind: "promoted", start: new Date(ride.start_at) } },
      ).catch((e) => console.error("push failed", e));
    }
    return { ok: true };
  });
}
