import { requireUser } from "@/modules/core/auth";
import { handle, readJson } from "@/modules/core/http";
import { getPrefs, setPrefs } from "@/modules/notify/notify";

// GET /api/notify/prefs
export function GET(req: Request) {
  return handle(async () => getPrefs((await requireUser(req)).uid));
}

// PATCH /api/notify/prefs  { ride_reminder?, ride_changes?, club_new_ride? }
export function PATCH(req: Request) {
  return handle(async () => setPrefs((await requireUser(req)).uid, await readJson(req)));
}
