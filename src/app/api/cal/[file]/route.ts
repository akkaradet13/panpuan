import { getUidByCalendarToken } from "@/modules/core/users";
import { buildIcs } from "@/modules/rides/ics";
import { userIcsEvents } from "@/modules/rides/rides";

// GET /api/cal/{calendar_token}.ics — personal feed of every ride the user signed up for
export async function GET(_req: Request, ctx: RouteContext<"/api/cal/[file]">) {
  const token = (await ctx.params).file.replace(/\.ics$/, "");
  const uid = await getUidByCalendarToken(token);
  if (!uid) return new Response("Not found", { status: 404 });
  const ics = buildIcs("PanPuan · ทริปของฉัน", await userIcsEvents(uid));
  return new Response(ics, {
    headers: { "content-type": "text/calendar; charset=utf-8", "cache-control": "private, no-store" },
  });
}
