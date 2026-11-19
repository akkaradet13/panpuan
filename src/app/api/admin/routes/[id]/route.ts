import { revalidatePath } from "next/cache";
import { handle, readJson } from "@/modules/core/http";
import { setRouteStatus } from "@/modules/routes/routes";
import { parseStatus, requireSuperAdmin } from "../../_guard";

// PATCH /api/admin/routes/{id}  { status: "verified" | "suspended" | "unverified" }
export function PATCH(req: Request, ctx: RouteContext<"/api/admin/routes/[id]">) {
  return handle(async () => {
    const admin = await requireSuperAdmin(req);
    await setRouteStatus((await ctx.params).id, parseStatus(await readJson(req)), admin.uid);
    revalidatePath("/routes");
  });
}
