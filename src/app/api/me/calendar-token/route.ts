import { requireUser } from "@/modules/core/auth";
import { handle } from "@/modules/core/http";
import { getOrCreateUser, resetCalendarToken } from "@/modules/core/users";

// POST /api/me/calendar-token — issue a new secret ICS URL (the old one stops working)
export function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser(req);
    await getOrCreateUser(user);
    return { calendar_token: await resetCalendarToken(user.uid) };
  });
}
