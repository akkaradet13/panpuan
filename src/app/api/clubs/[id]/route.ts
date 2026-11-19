import { revalidatePath } from "next/cache";
import { requireUser } from "@/modules/core/auth";
import { parseClubInput, updateClub } from "@/modules/core/clubs";
import { handle, readJson } from "@/modules/core/http";
import { syncClubOnRides } from "@/modules/rides/rides";

// PATCH /api/clubs/{id} — club admin edits club info (slug stays the same)
export function PATCH(req: Request, ctx: RouteContext<"/api/clubs/[id]">) {
  return handle(async () => {
    const actor = await requireUser(req);
    const { id } = await ctx.params;
    const input = parseClubInput(await readJson(req));
    const { slug } = await updateClub(id, actor, input);
    await syncClubOnRides(id, { club_name: input.name }); // rides keep a copy of the club name
    revalidatePath("/clubs");
    revalidatePath(`/clubs/${slug}`);
    return { slug };
  });
}
