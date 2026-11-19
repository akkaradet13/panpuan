import { revalidatePath } from "next/cache";
import { requireUser } from "@/modules/core/auth";
import { parseClubInput, updateClub } from "@/modules/core/clubs";
import { handle, readJson } from "@/modules/core/http";

// PATCH /api/clubs/{id} — club admin edits club info (slug stays the same)
export function PATCH(req: Request, ctx: RouteContext<"/api/clubs/[id]">) {
  return handle(async () => {
    const actor = await requireUser(req);
    const { slug } = await updateClub((await ctx.params).id, actor, parseClubInput(await readJson(req)));
    revalidatePath("/clubs");
    revalidatePath(`/clubs/${slug}`);
    return { slug };
  });
}
