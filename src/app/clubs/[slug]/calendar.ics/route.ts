import { getClubBySlug } from "@/modules/core/clubs";
import { decodeParam } from "@/modules/core/JsonLd";
import { buildIcs } from "@/modules/rides/ics";
import { clubIcsEvents } from "@/modules/rides/rides";

// GET /clubs/{slug}/calendar.ics — all rides of a club (public)
export async function GET(_req: Request, ctx: RouteContext<"/clubs/[slug]/calendar.ics">) {
  const club = await getClubBySlug(decodeParam((await ctx.params).slug));
  if (!club) return new Response("Not found", { status: 404 });
  return new Response(buildIcs(`PanPuan · ${club.name}`, await clubIcsEvents(club.id)), {
    headers: { "content-type": "text/calendar; charset=utf-8", "cache-control": "public, s-maxage=900" },
  });
}
