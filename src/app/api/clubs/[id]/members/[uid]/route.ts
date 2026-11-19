import { requireUser } from "@/modules/core/auth";
import { manageMember, parseMemberAction } from "@/modules/core/clubs";
import { handle, readJson } from "@/modules/core/http";

// PATCH /api/clubs/{id}/members/{uid}  { action: "approve" | "promote" | "demote" | "remove" }
export function PATCH(req: Request, ctx: RouteContext<"/api/clubs/[id]/members/[uid]">) {
  return handle(async () => {
    const actor = await requireUser(req);
    const { id, uid } = await ctx.params;
    await manageMember(id, actor, uid, parseMemberAction(await readJson(req)));
  });
}
