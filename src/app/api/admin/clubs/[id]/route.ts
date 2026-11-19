import { revalidatePath } from "next/cache";
import { setClubStatus } from "@/modules/core/clubs";
import { handle, readJson } from "@/modules/core/http";
import { syncClubOnRides } from "@/modules/rides/rides";
import { parseStatus, requireSuperAdmin } from "../../_guard";

// PATCH /api/admin/clubs/{id}  { status: "verified" | "suspended" | "unverified" }
export function PATCH(req: Request, ctx: RouteContext<"/api/admin/clubs/[id]">) {
  return handle(async () => {
    const admin = await requireSuperAdmin(req);
    const { id } = await ctx.params;
    const status = parseStatus(await readJson(req));
    await setClubStatus(id, status, admin.uid);
    await syncClubOnRides(id, { club_status: status }); // rides of a suspended club disappear too
    revalidatePath("/clubs");
    revalidatePath("/rides");
  });
}
