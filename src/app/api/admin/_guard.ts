import "server-only";

import { isSuperAdmin, requireUser } from "@/modules/core/auth";
import { HttpError } from "@/modules/core/http";

export async function requireSuperAdmin(req: Request) {
  const user = await requireUser(req);
  if (!isSuperAdmin(user)) throw new HttpError(403, "เฉพาะ super admin");
  return user;
}

export function parseStatus(body: unknown) {
  const s = (body as { status?: unknown } | null)?.status;
  if (s !== "unverified" && s !== "verified" && s !== "suspended") throw new HttpError(400, "สถานะไม่ถูกต้อง");
  return s;
}
