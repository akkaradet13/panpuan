import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "./firebase/admin";

/** Verifies `Authorization: Bearer <Firebase ID token>`. Returns null when missing or invalid. */
export async function getUser(req: Request): Promise<DecodedIdToken | null> {
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  try {
    return await adminAuth.verifyIdToken(token);
  } catch {
    return null;
  }
}

export const isSuperAdmin = (user: DecodedIdToken | null) => user?.super_admin === true;
