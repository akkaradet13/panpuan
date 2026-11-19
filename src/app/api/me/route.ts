import { NextResponse } from "next/server";
import { getUser } from "@/modules/core/auth";
import { getOrCreateUser, parseProfileUpdate, updateUser } from "@/modules/core/users";

const unauthorized = () => NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

// GET /api/me — own profile (created on first call after Google login)
export async function GET(req: Request) {
  const token = await getUser(req);
  if (!token) return unauthorized();
  return NextResponse.json(await getOrCreateUser(token));
}

// PATCH /api/me — update display_name, bike_types, pace_level
export async function PATCH(req: Request) {
  const token = await getUser(req);
  if (!token) return unauthorized();
  const update = parseProfileUpdate(await req.json().catch(() => null));
  if (typeof update === "string") return NextResponse.json({ error: update }, { status: 400 });
  await getOrCreateUser(token);
  await updateUser(token.uid, update);
  return NextResponse.json(await getOrCreateUser(token));
}
