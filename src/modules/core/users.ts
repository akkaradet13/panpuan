import "server-only";

import { randomBytes } from "node:crypto";
import type { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebase/admin";
import { BIKE_TYPES, PACE_LEVELS, type BikeType, type PaceLevel, type UserProfile } from "./profile-options";

const users = adminDb.collection("users");

export const newCalendarToken = () => randomBytes(24).toString("base64url");

/** Returns the user's profile, creating it from the Google account on first login. */
export async function getOrCreateUser(token: DecodedIdToken): Promise<UserProfile> {
  const ref = users.doc(token.uid);
  try {
    await ref.create({
      display_name: (token.name ?? "นักปั่น").slice(0, 40),
      photo_url: token.picture ?? "",
      bike_types: [],
      pace_level: "medium",
      calendar_token: newCalendarToken(),
      created_at: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    if ((e as { code?: number }).code !== 6) throw e; // 6 = ALREADY_EXISTS
  }
  const d = (await ref.get()).data()!;
  return {
    uid: token.uid,
    display_name: d.display_name,
    photo_url: d.photo_url,
    bike_types: d.bike_types,
    pace_level: d.pace_level,
    calendar_token: d.calendar_token,
  };
}

type ProfileUpdate = Partial<Pick<UserProfile, "display_name" | "bike_types" | "pace_level">>;

/** Whitelists and validates a PATCH body. Returns an error message (Thai) on bad input. */
export function parseProfileUpdate(body: unknown): ProfileUpdate | string {
  if (!body || typeof body !== "object") return "ข้อมูลไม่ถูกต้อง";
  const b = body as Record<string, unknown>;
  const out: ProfileUpdate = {};
  if ("display_name" in b) {
    const name = typeof b.display_name === "string" ? b.display_name.trim() : "";
    if (name.length < 1 || name.length > 40) return "ชื่อต้องยาว 1–40 ตัวอักษร";
    out.display_name = name;
  }
  if ("bike_types" in b) {
    const list = b.bike_types;
    if (!Array.isArray(list) || !list.every((t) => typeof t === "string" && t in BIKE_TYPES)) return "ประเภทจักรยานไม่ถูกต้อง";
    out.bike_types = [...new Set(list as BikeType[])];
  }
  if ("pace_level" in b) {
    if (typeof b.pace_level !== "string" || !(b.pace_level in PACE_LEVELS)) return "ระดับความเร็วไม่ถูกต้อง";
    out.pace_level = b.pace_level as PaceLevel;
  }
  return out;
}

export async function updateUser(uid: string, update: ProfileUpdate) {
  await users.doc(uid).update({ ...update, updated_at: FieldValue.serverTimestamp() });
}
