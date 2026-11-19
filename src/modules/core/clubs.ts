import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue, type DocumentSnapshot, type Transaction } from "firebase-admin/firestore";
import { isSuperAdmin } from "./auth";
import { LINK_LABELS, MEMBER_ACTIONS, type Club, type ClubInput, type ClubLinks, type LinkKey, type MemberAction } from "./club-types";
import { isDistrict } from "./districts";
import { adminDb } from "./firebase/admin";
import { HttpError } from "./http";
import { getOrCreateUser } from "./users";

const clubs = adminDb.collection("clubs");
const members = adminDb.collection("club_members");
const memberId = (clubId: string, uid: string) => `${clubId}_${uid}`;
const RESERVED_SLUGS = new Set(["new"]); // static routes under /clubs

/** Thai-friendly slug: keeps letters (incl. Thai vowels/tone marks) and digits, joins the rest with "-". */
export function slugify(name: string) {
  return name
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

export function parseClubInput(body: unknown): ClubInput {
  if (!body || typeof body !== "object") throw new HttpError(400, "ข้อมูลไม่ถูกต้อง");
  const b = body as Record<string, unknown>;
  const text = (key: string, min: number, max: number, label: string) => {
    const v = typeof b[key] === "string" ? (b[key] as string).trim() : "";
    if (v.length < min) throw new HttpError(400, `${label}ต้องยาวอย่างน้อย ${min} ตัวอักษร`);
    if (v.length > max) throw new HttpError(400, `${label}ยาวได้ไม่เกิน ${max} ตัวอักษร`);
    return v;
  };

  const district = typeof b.district === "string" && isDistrict(b.district) ? b.district : null;
  if (!district) throw new HttpError(400, "กรุณาเลือกอำเภอ");
  if (b.join_policy !== "open" && b.join_policy !== "approval") throw new HttpError(400, "กรุณาเลือกวิธีเข้ากลุ่ม");

  const rawLinks = (b.links && typeof b.links === "object" ? b.links : {}) as Record<string, unknown>;
  const links: ClubLinks = {};
  for (const key of Object.keys(LINK_LABELS) as LinkKey[]) {
    const v = typeof rawLinks[key] === "string" ? (rawLinks[key] as string).trim() : "";
    if (!v) continue;
    if (!/^https:\/\/[^\s]+$/.test(v) || v.length > 300 || !URL.canParse(v)) {
      throw new HttpError(400, `ลิงก์ ${LINK_LABELS[key]} ต้องเป็น URL ที่ขึ้นต้นด้วย https://`);
    }
    links[key] = v;
  }

  return {
    name: text("name", 3, 80, "ชื่อกลุ่ม"),
    description: text("description", 20, 2000, "คำอธิบายกลุ่ม"),
    district,
    home_meet_name: text("home_meet_name", 0, 100, "จุดนัด"),
    regular_schedule: text("regular_schedule", 0, 100, "วันเวลาปั่นประจำ"),
    join_policy: b.join_policy,
    links,
  };
}

function toClub(d: DocumentSnapshot): Club {
  const x = d.data()!;
  return {
    id: d.id,
    name: x.name,
    slug: x.slug,
    description: x.description,
    district: x.district,
    home_meet_name: x.home_meet_name ?? "",
    home_meet_point: x.home_meet_point ? { lat: x.home_meet_point.latitude, lng: x.home_meet_point.longitude } : null,
    regular_schedule: x.regular_schedule ?? "",
    logo_url: x.logo_url ?? "",
    links: x.links ?? {},
    join_policy: x.join_policy,
    member_count: x.member_count ?? 0,
    status: x.status,
  };
}

/** Public lookup: suspended clubs are treated as missing (404). */
export async function getClubBySlug(slug: string): Promise<Club | null> {
  const d = (await clubs.where("slug", "==", slug).limit(1).get()).docs[0];
  return d && d.get("status") !== "suspended" ? toClub(d) : null;
}

export type ClubRef = { id: string; name: string; slug: string; status: Club["status"] };

/**
 * For other modules (rides): returns the club if the user is an active admin (or super admin) and the club is
 * not suspended; throws otherwise. One read of clubs + one of club_members by id.
 */
export async function requireClubAdmin(clubId: string, actor: DecodedIdToken): Promise<ClubRef> {
  const [club, me] = await adminDb.getAll(clubs.doc(clubId), members.doc(memberId(clubId, actor.uid)));
  assertCanAdmin(club, me, actor);
  return { id: club.id, name: club.get("name"), slug: club.get("slug"), status: club.get("status") };
}

export async function getClub(id: string): Promise<Club | null> {
  const d = await clubs.doc(id).get();
  return d.exists && d.get("status") !== "suspended" ? toClub(d) : null;
}

export async function listClubsByStatus(status: Club["status"]): Promise<Club[]> {
  return (await clubs.where("status", "==", status).get()).docs.map(toClub);
}

/** Super admin only (checked by the caller). */
export async function setClubStatus(id: string, status: Club["status"], by: string) {
  const ref = clubs.doc(id);
  if (!(await ref.get()).exists) throw new HttpError(404, "ไม่พบกลุ่มนี้");
  await ref.update({
    status,
    verified_by: status === "verified" ? by : null,
    verified_at: status === "verified" ? FieldValue.serverTimestamp() : null,
    updated_at: FieldValue.serverTimestamp(),
  });
}

/** All non-suspended clubs, biggest first. ponytail: full scan, fine for hundreds of clubs. */
export async function listClubs(): Promise<Club[]> {
  const snap = await clubs.where("status", "in", ["unverified", "verified"]).get();
  return snap.docs.map(toClub).sort((a, b) => b.member_count - a.member_count);
}

export async function createClub(token: DecodedIdToken, input: ClubInput) {
  let base = slugify(input.name);
  if (!base) throw new HttpError(400, "ชื่อกลุ่มต้องมีตัวอักษรหรือตัวเลข");
  if (RESERVED_SLUGS.has(base)) base = `${base}-club`;

  const profile = await getOrCreateUser(token);
  const ref = clubs.doc();
  const slug = await adminDb.runTransaction(async (tx) => {
    let slug = base;
    for (let n = 2; !(await tx.get(clubs.where("slug", "==", slug).limit(1))).empty; n++) slug = `${base}-${n}`;
    const now = FieldValue.serverTimestamp();
    tx.create(ref, {
      ...input,
      slug,
      home_meet_point: null,
      logo_url: "",
      member_count: 1,
      status: "unverified",
      verified_by: null,
      verified_at: null,
      created_by: token.uid,
      created_at: now,
      updated_at: now,
    });
    tx.create(members.doc(memberId(ref.id, token.uid)), {
      club_id: ref.id,
      uid: token.uid,
      display_name: profile.display_name,
      photo_url: profile.photo_url,
      role: "admin",
      status: "active",
      joined_at: now,
    });
    return slug;
  });
  return { id: ref.id, slug };
}

/** Joins an open club, or requests to join an approval club. Idempotent. */
export async function joinClub(clubId: string, token: DecodedIdToken) {
  const profile = await getOrCreateUser(token);
  return adminDb.runTransaction(async (tx) => {
    const clubRef = clubs.doc(clubId);
    const memRef = members.doc(memberId(clubId, token.uid));
    const [club, mem] = await tx.getAll(clubRef, memRef);
    if (!club.exists || club.get("status") === "suspended") throw new HttpError(404, "ไม่พบกลุ่มนี้");
    if (mem.exists) return { status: mem.get("status") as string };

    const status = club.get("join_policy") === "open" ? "active" : "pending";
    tx.create(memRef, {
      club_id: clubId,
      uid: token.uid,
      display_name: profile.display_name,
      photo_url: profile.photo_url,
      role: "member",
      status,
      joined_at: FieldValue.serverTimestamp(),
    });
    if (status === "active") tx.update(clubRef, { member_count: FieldValue.increment(1) });
    return { status };
  });
}

/** A club must always keep at least one active admin. */
async function assertNotLastAdmin(tx: Transaction, clubId: string) {
  const admins = await tx.get(
    members.where("club_id", "==", clubId).where("role", "==", "admin").where("status", "==", "active").limit(2),
  );
  if (admins.size < 2) throw new HttpError(409, "กลุ่มต้องมีแอดมินอย่างน้อย 1 คน ตั้งแอดมินคนอื่นก่อน");
}

/** Leave a club, or cancel a pending request. */
export async function leaveClub(clubId: string, uid: string) {
  await adminDb.runTransaction(async (tx) => {
    const memRef = members.doc(memberId(clubId, uid));
    const mem = await tx.get(memRef);
    if (!mem.exists) return;
    if (mem.get("role") === "admin") await assertNotLastAdmin(tx, clubId);
    tx.delete(memRef);
    if (mem.get("status") === "active") tx.update(clubs.doc(clubId), { member_count: FieldValue.increment(-1) });
  });
}

export function parseMemberAction(body: unknown): MemberAction {
  const action = (body as { action?: unknown } | null)?.action;
  if (!MEMBER_ACTIONS.includes(action as MemberAction)) throw new HttpError(400, "คำสั่งไม่ถูกต้อง");
  return action as MemberAction;
}

/** Throws unless the actor is an active admin of a non-suspended club, or a super admin. */
function assertCanAdmin(club: DocumentSnapshot, me: DocumentSnapshot, actor: DecodedIdToken) {
  if (!club.exists) throw new HttpError(404, "ไม่พบกลุ่มนี้");
  if (isSuperAdmin(actor)) return;
  if (club.get("status") === "suspended") throw new HttpError(403, "กลุ่มนี้ถูกระงับ");
  if (me.get("role") !== "admin" || me.get("status") !== "active") throw new HttpError(403, "เฉพาะแอดมินกลุ่มเท่านั้น");
}

/** Club admin edits club info. The slug never changes (stable URLs). */
export async function updateClub(clubId: string, actor: DecodedIdToken, input: ClubInput) {
  return adminDb.runTransaction(async (tx) => {
    const clubRef = clubs.doc(clubId);
    const [club, me] = await tx.getAll(clubRef, members.doc(memberId(clubId, actor.uid)));
    assertCanAdmin(club, me, actor);
    tx.update(clubRef, { ...input, updated_at: FieldValue.serverTimestamp() });
    return { slug: club.get("slug") as string };
  });
}

/** Club admin (or super admin) approves, promotes, demotes or removes a member. */
export async function manageMember(clubId: string, actor: DecodedIdToken, targetUid: string, action: MemberAction) {
  if (targetUid === actor.uid && action !== "approve") throw new HttpError(400, "จัดการสิทธิ์ของตัวเองไม่ได้ ใช้ปุ่มออกจากกลุ่มแทน");
  await adminDb.runTransaction(async (tx) => {
    const clubRef = clubs.doc(clubId);
    const targetRef = members.doc(memberId(clubId, targetUid));
    const [club, me, target] = await tx.getAll(clubRef, members.doc(memberId(clubId, actor.uid)), targetRef);
    assertCanAdmin(club, me, actor);
    if (!target.exists) throw new HttpError(404, "ไม่พบสมาชิกคนนี้");

    const role = target.get("role");
    const status = target.get("status");
    switch (action) {
      case "approve":
        if (status !== "pending") return;
        tx.update(targetRef, { status: "active", joined_at: FieldValue.serverTimestamp() });
        tx.update(clubRef, { member_count: FieldValue.increment(1) });
        return;
      case "promote":
        if (status !== "active") throw new HttpError(409, "ต้องอนุมัติให้เป็นสมาชิกก่อน");
        tx.update(targetRef, { role: "admin" });
        return;
      case "demote":
        if (role !== "admin") return;
        await assertNotLastAdmin(tx, clubId);
        tx.update(targetRef, { role: "member" });
        return;
      case "remove": // also used to reject a pending request
        if (role === "admin") await assertNotLastAdmin(tx, clubId);
        tx.delete(targetRef);
        if (status === "active") tx.update(clubRef, { member_count: FieldValue.increment(-1) });
        return;
    }
  });
}
