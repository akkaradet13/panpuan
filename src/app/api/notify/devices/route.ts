import { requireUser } from "@/modules/core/auth";
import { handle, readJson } from "@/modules/core/http";
import { listDevices, registerDevice, removeDevice } from "@/modules/notify/notify";

// GET /api/notify/devices — my devices
export function GET(req: Request) {
  return handle(async () => listDevices((await requireUser(req)).uid));
}

// POST /api/notify/devices  { device_id, token, platform } — register / refresh this device's FCM token
export function POST(req: Request) {
  return handle(async () => registerDevice((await requireUser(req)).uid, await readJson(req)));
}

// DELETE /api/notify/devices?id=... — stop notifications on a device
export function DELETE(req: Request) {
  return handle(async () => removeDevice((await requireUser(req)).uid, new URL(req.url).searchParams.get("id") ?? ""));
}
