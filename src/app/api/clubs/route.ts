import { revalidatePath } from "next/cache";
import { requireUser } from "@/modules/core/auth";
import { createClub, parseClubInput } from "@/modules/core/clubs";
import { handle, readJson } from "@/modules/core/http";

// POST /api/clubs — create a club; the creator becomes its first admin.
export function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser(req);
    const club = await createClub(user, parseClubInput(await readJson(req)));
    revalidatePath("/clubs");
    return club;
  });
}
