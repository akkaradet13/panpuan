import { requireUser } from "@/modules/core/auth";
import { joinClub, leaveClub } from "@/modules/core/clubs";
import { handle } from "@/modules/core/http";

// POST /api/clubs/{id}/join — join (open) or request to join (approval)
export function POST(req: Request, ctx: RouteContext<"/api/clubs/[id]/join">) {
  return handle(async () => joinClub((await ctx.params).id, await requireUser(req)));
}

// DELETE /api/clubs/{id}/join — leave, or cancel a pending request
export function DELETE(req: Request, ctx: RouteContext<"/api/clubs/[id]/join">) {
  return handle(async () => leaveClub((await ctx.params).id, (await requireUser(req)).uid));
}
