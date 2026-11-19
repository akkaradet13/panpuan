import { requireUser } from "@/modules/core/auth";
import { handle, readJson } from "@/modules/core/http";
import { parseReview, upsertReview } from "@/modules/routes/routes";

// POST /api/routes/{id}/reviews  { rating: 1-5, comment } — one review per user, posting again edits it
export function POST(req: Request, ctx: RouteContext<"/api/routes/[id]/reviews">) {
  return handle(async () => {
    const user = await requireUser(req);
    await upsertReview(user, (await ctx.params).id, parseReview(await readJson(req)));
  });
}
