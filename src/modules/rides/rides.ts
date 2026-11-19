import "server-only";

import { FieldValue, GeoPoint, Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import type { ClubRef } from "@/modules/core/clubs";
import { adminDb } from "@/modules/core/firebase/admin";
import { bangkokToUtc } from "@/modules/core/format";
import { HttpError } from "@/modules/core/http";
import { rideHours, type IcsEvent } from "./ics";
import { DONE_AFTER_MS, DROP_POLICY, type DropPolicy, type Ride } from "./types";

const rides = adminDb.collection("rides");
const parts = adminDb.collection("rides_participants");
const pid = (rideId: string, uid: string) => `${rideId}_${uid}`;
const SITE = "https://panpuan.net";

function toRide(d: DocumentSnapshot): Ride {
  const x = d.data()!;
  return {
    id: d.id,
    club_id: x.club_id,
    club_name: x.club_name,
    club_slug: x.club_slug,
    club_status: x.club_status,
    route_id: x.route_id ?? null,
    route_name: x.route_name ?? null,
    route_slug: x.route_slug ?? null,
    distance_km: x.distance_km ?? null,
    title: x.title,
    start_at: x.start_at.toDate().toISOString(),
    meet_name: x.meet_name,
    meet_point: x.meet_point ? { lat: x.meet_point.latitude, lng: x.meet_point.longitude } : null,
    pace_min_kmh: x.pace_min_kmh,
    pace_max_kmh: x.pace_max_kmh,
    drop_policy: x.drop_policy,
    max_riders: x.max_riders ?? null,
    going_count: x.going_count ?? 0,
    waitlist_count: x.waitlist_count ?? 0,
    status: x.status,
    status_note: x.status_note ?? "",
    note: x.note ?? "",
  };
}

// ---------- input parsing ----------

export type RouteRef = { id: string; name: string; slug: string; distance_km: number };

export type RideDetails = {
  title: string;
  meet_name: string;
  meet_point: { lat: number; lng: number } | null;
  pace_min_kmh: number;
  pace_max_kmh: number;
  drop_policy: DropPolicy;
  max_riders: number | null;
  note: string;
  route_id: string | null;
};

const int = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN);

/** Bangkok day/hour/minute -> future UTC Date. */
export function parseStart(b: Record<string, unknown>) {
  const day = String(b.day ?? "");
  const hour = int(b.hour), minute = int(b.minute);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new HttpError(400, "กรุณาเลือกวันและเวลาออกปั่น");
  }
  const start = bangkokToUtc(day, hour, minute);
  if (start.getTime() <= Date.now()) throw new HttpError(400, "เวลาออกปั่นต้องอยู่ในอนาคต");
  if (start.getTime() > Date.now() + 366 * 86_400_000) throw new HttpError(400, "นัดล่วงหน้าได้ไม่เกิน 1 ปี");
  return start;
}

export function parseRideDetails(body: unknown): RideDetails {
  if (!body || typeof body !== "object") throw new HttpError(400, "ข้อมูลไม่ถูกต้อง");
  const b = body as Record<string, unknown>;
  const text = (key: string, min: number, max: number, label: string) => {
    const v = typeof b[key] === "string" ? (b[key] as string).trim() : "";
    if (v.length < min) throw new HttpError(400, `${label}ต้องยาวอย่างน้อย ${min} ตัวอักษร`);
    if (v.length > max) throw new HttpError(400, `${label}ยาวได้ไม่เกิน ${max} ตัวอักษร`);
    return v;
  };

  const pmin = int(b.pace_min_kmh), pmax = int(b.pace_max_kmh);
  if (!Number.isInteger(pmin) || !Number.isInteger(pmax) || pmin < 5 || pmax > 60 || pmin > pmax) {
    throw new HttpError(400, "ความเร็วต้องอยู่ระหว่าง 5–60 กม./ชม. และต่ำสุดไม่เกินสูงสุด");
  }
  if (!(String(b.drop_policy) in DROP_POLICY)) throw new HttpError(400, "กรุณาเลือกแบบการปั่น");

  let max_riders: number | null = null;
  if (b.max_riders !== null && b.max_riders !== undefined && b.max_riders !== "" && b.max_riders !== 0) {
    max_riders = int(b.max_riders);
    if (!Number.isInteger(max_riders) || max_riders < 2 || max_riders > 500) throw new HttpError(400, "จำนวนคนสูงสุดต้องอยู่ระหว่าง 2–500");
  }

  let meet_point: RideDetails["meet_point"] = null;
  if (b.meet_point) {
    const p = b.meet_point as { lat?: unknown; lng?: unknown };
    const lat = Number(p.lat), lng = Number(p.lng);
    if (!(lat >= 5 && lat <= 21 && lng >= 97 && lng <= 106)) throw new HttpError(400, "จุดนัดบนแผนที่ต้องอยู่ในประเทศไทย");
    meet_point = { lat, lng };
  }

  return {
    title: text("title", 3, 80, "ชื่อทริป"),
    meet_name: text("meet_name", 2, 100, "จุดนัด"),
    meet_point,
    pace_min_kmh: pmin,
    pace_max_kmh: pmax,
    drop_policy: b.drop_policy as DropPolicy,
    max_riders,
    note: text("note", 0, 1000, "รายละเอียดเพิ่มเติม"),
    route_id: typeof b.route_id === "string" && b.route_id ? b.route_id : null,
  };
}

const endAt = (start: Date, distance: number | null, pmin: number, pmax: number) =>
  new Date(start.getTime() + rideHours(distance, pmin, pmax) * 3600_000);

function detailFields(d: RideDetails, route: RouteRef | null) {
  return {
    title: d.title,
    meet_name: d.meet_name,
    meet_point: d.meet_point ? new GeoPoint(d.meet_point.lat, d.meet_point.lng) : null,
    pace_min_kmh: d.pace_min_kmh,
    pace_max_kmh: d.pace_max_kmh,
    drop_policy: d.drop_policy,
    max_riders: d.max_riders,
    note: d.note,
    route_id: route?.id ?? null,
    route_name: route?.name ?? null,
    route_slug: route?.slug ?? null,
    distance_km: route?.distance_km ?? null,
  };
}

// ---------- reads ----------

export async function getRide(id: string): Promise<Ride | null> {
  const d = await rides.doc(id).get();
  return d.exists && d.get("club_status") !== "suspended" ? toRide(d) : null;
}

/** Rides that have not finished yet (start > now - 12 h), soonest first. */
export async function listUpcomingRides(opts: { clubId?: string; limit?: number; withinDays?: number } = {}): Promise<Ride[]> {
  const since = Timestamp.fromMillis(Date.now() - DONE_AFTER_MS);
  let q = (opts.clubId ? rides.where("club_id", "==", opts.clubId) : rides).where("start_at", ">=", since);
  if (opts.withinDays) q = q.where("start_at", "<", Timestamp.fromMillis(Date.now() + opts.withinDays * 86_400_000));
  const snap = await q.orderBy("start_at").limit(opts.limit ?? 200).get();
  return snap.docs.map(toRide).filter((r) => r.club_status !== "suspended");
}

// ---------- join / leave ----------

export type RiderProfile = { uid: string; display_name: string; photo_url: string };

export async function joinRide(rideId: string, me: RiderProfile) {
  return adminDb.runTransaction(async (tx) => {
    const rideRef = rides.doc(rideId), partRef = parts.doc(pid(rideId, me.uid));
    const [ride, part] = await tx.getAll(rideRef, partRef);
    if (!ride.exists || ride.get("club_status") === "suspended") throw new HttpError(404, "ไม่พบทริปนี้");
    if (part.exists) return { status: part.get("status") as string };
    if (ride.get("status") === "cancelled") throw new HttpError(409, "ทริปนี้ถูกยกเลิกแล้ว");
    const start: Timestamp = ride.get("start_at");
    if (start.toMillis() <= Date.now()) throw new HttpError(409, "ทริปนี้ออกปั่นไปแล้ว");

    const max: number | null = ride.get("max_riders") ?? null;
    const status = max === null || (ride.get("going_count") ?? 0) < max ? "going" : "waitlist";
    tx.create(partRef, {
      ride_id: rideId,
      uid: me.uid,
      display_name: me.display_name,
      photo_url: me.photo_url,
      status,
      created_at: FieldValue.serverTimestamp(),
      ...participantRideFields(ride),
    });
    tx.update(rideRef, status === "going" ? { going_count: FieldValue.increment(1) } : { waitlist_count: FieldValue.increment(1) });
    return { status };
  });
}

/** Copied onto each participant so the personal ICS feed reads only rides_participants. */
function participantRideFields(ride: DocumentSnapshot) {
  const start: Date = ride.get("start_at").toDate();
  return {
    ride_title: ride.get("title"),
    ride_meet_name: ride.get("meet_name"),
    ride_start_at: Timestamp.fromDate(start),
    ride_end_at: Timestamp.fromDate(endAt(start, ride.get("distance_km") ?? null, ride.get("pace_min_kmh"), ride.get("pace_max_kmh"))),
    ride_status: ride.get("status"),
    ride_club_name: ride.get("club_name"),
  };
}

/** Leaving frees a seat: the earliest waitlisted rider is promoted. Returns their uid so the caller can notify them. */
export async function leaveRide(rideId: string, uid: string): Promise<{ promoted: string | null }> {
  return adminDb.runTransaction(async (tx) => {
    const rideRef = rides.doc(rideId), partRef = parts.doc(pid(rideId, uid));
    const [ride, part] = await tx.getAll(rideRef, partRef);
    if (!ride.exists || !part.exists) return { promoted: null };
    const wasGoing = part.get("status") === "going";
    const next = wasGoing && (ride.get("waitlist_count") ?? 0) > 0
      ? (await tx.get(parts.where("ride_id", "==", rideId).where("status", "==", "waitlist").orderBy("created_at").limit(1))).docs[0]
      : undefined;

    tx.delete(partRef);
    if (next) {
      tx.update(next.ref, { status: "going" });
      tx.update(rideRef, { waitlist_count: FieldValue.increment(-1) }); // going_count unchanged: one out, one in
    } else {
      tx.update(rideRef, wasGoing ? { going_count: FieldValue.increment(-1) } : { waitlist_count: FieldValue.increment(-1) });
    }
    return { promoted: next?.get("uid") ?? null };
  });
}

// ---------- admin changes ----------

export async function createRide(createdBy: string, club: ClubRef, route: RouteRef | null, start: Date, d: RideDetails) {
  const ref = rides.doc();
  const now = FieldValue.serverTimestamp();
  await ref.create({
    club_id: club.id,
    club_name: club.name,
    club_slug: club.slug,
    club_status: club.status,
    ...detailFields(d, route),
    start_at: Timestamp.fromDate(start),
    going_count: 0,
    waitlist_count: 0,
    status: "scheduled",
    status_note: "",
    created_by: createdBy,
    created_at: now,
    updated_at: now,
  });
  return { id: ref.id };
}

export type RideChange =
  | { kind: "postpone"; start: Date; status_note: string }
  | { kind: "cancel"; status_note: string }
  | { kind: "edit"; details: RideDetails; route: RouteRef | null };

/**
 * Applies an admin change and copies the new ride_* fields to every participant in the same batch.
 * Returns everyone signed up (going + waitlist) so the caller can push a notification.
 */
export async function changeRide(rideId: string, change: RideChange) {
  const rideRef = rides.doc(rideId);
  const ride = await rideRef.get();
  if (!ride.exists) throw new HttpError(404, "ไม่พบทริปนี้");
  if (ride.get("status") === "cancelled" && change.kind !== "postpone") throw new HttpError(409, "ทริปนี้ถูกยกเลิกแล้ว (เลื่อนวันเพื่อเปิดใหม่ได้)");

  let update: Record<string, unknown>;
  if (change.kind === "postpone") update = { start_at: Timestamp.fromDate(change.start), status: "postponed", status_note: change.status_note };
  else if (change.kind === "cancel") update = { status: "cancelled", status_note: change.status_note };
  else {
    if (change.details.max_riders !== null && change.details.max_riders < (ride.get("going_count") ?? 0)) {
      throw new HttpError(409, `ลงชื่อไปแล้ว ${ride.get("going_count")} คน ตั้งจำนวนสูงสุดต่ำกว่านี้ไม่ได้`);
    }
    update = detailFields(change.details, change.route);
  }
  update.updated_at = FieldValue.serverTimestamp();

  const participants = (await parts.where("ride_id", "==", rideId).get()).docs;
  const merged = { ...ride.data(), ...update } as Record<string, unknown>;
  const rideFields = participantRideFields({ get: (k: string) => merged[k] } as DocumentSnapshot);

  // ponytail: one batch (≤500 writes) covers ~499 participants; chunk if a ride ever gets bigger.
  const batch = adminDb.batch();
  batch.update(rideRef, update);
  for (const p of participants) batch.update(p.ref, rideFields);
  await batch.commit();

  return {
    title: merged.title as string,
    start: (merged.start_at as Timestamp).toDate(),
    uids: participants.map((p) => p.get("uid") as string),
  };
}

/** Keeps denormalized club fields on rides in sync (club renamed, verified or suspended). */
export async function syncClubOnRides(clubId: string, fields: { club_name?: string; club_status?: string }) {
  const snap = await rides.where("club_id", "==", clubId).get();
  for (let i = 0; i < snap.docs.length; i += 450) {
    const batch = adminDb.batch();
    for (const d of snap.docs.slice(i, i + 450)) batch.update(d.ref, fields);
    await batch.commit();
  }
}

// ---------- reminders ----------

export type ReminderRide = { id: string; title: string; meet_name: string; start: Date; created: Date };

/** Rides (not cancelled, club not suspended) starting in (from, to]. */
export async function ridesStartingBetween(from: Date, to: Date): Promise<ReminderRide[]> {
  const snap = await rides.where("start_at", ">", Timestamp.fromDate(from)).where("start_at", "<=", Timestamp.fromDate(to)).get();
  return snap.docs
    .filter((d) => d.get("status") !== "cancelled" && d.get("club_status") !== "suspended")
    .map((d) => ({
      id: d.id,
      title: d.get("title"),
      meet_name: d.get("meet_name"),
      start: d.get("start_at").toDate(),
      created: d.get("created_at")?.toDate() ?? new Date(0),
    }));
}

export async function goingUids(rideId: string) {
  return (await parts.where("ride_id", "==", rideId).where("status", "==", "going").get()).docs.map((d) => d.get("uid") as string);
}

// ---------- calendar feeds ----------

/** Personal feed: everything the user signed up for, from 30 days ago. Reads only rides_participants. */
export async function userIcsEvents(uid: string): Promise<IcsEvent[]> {
  const since = Timestamp.fromMillis(Date.now() - 30 * 86_400_000);
  const snap = await parts.where("uid", "==", uid).where("ride_start_at", ">=", since).orderBy("ride_start_at").get();
  return snap.docs.map((d) => {
    const x = d.data();
    return {
      uid: `${x.ride_id}@panpuan.net`,
      start: x.ride_start_at.toDate(),
      end: x.ride_end_at.toDate(),
      title: `🚲 ${x.ride_title}`,
      location: x.ride_meet_name,
      description: `${x.ride_club_name}${x.status === "waitlist" ? " · คุณอยู่ในคิวรอ" : ""}\n${SITE}/rides/${x.ride_id}`,
      url: `${SITE}/rides/${x.ride_id}`,
      cancelled: x.ride_status === "cancelled",
    };
  });
}

export async function clubIcsEvents(clubId: string): Promise<IcsEvent[]> {
  const since = Timestamp.fromMillis(Date.now() - 30 * 86_400_000);
  const snap = await rides.where("club_id", "==", clubId).where("start_at", ">=", since).orderBy("start_at").get();
  return snap.docs.map((d) => {
    const r = toRide(d);
    const start = new Date(r.start_at);
    return {
      uid: `${r.id}@panpuan.net`,
      start,
      end: endAt(start, r.distance_km, r.pace_min_kmh, r.pace_max_kmh),
      title: `🚲 ${r.title}`,
      location: r.meet_name,
      description: `${r.club_name}\n${SITE}/rides/${r.id}`,
      url: `${SITE}/rides/${r.id}`,
      cancelled: r.status === "cancelled",
      updated: d.get("updated_at")?.toDate(),
    };
  });
}

export const rideEnd = (r: Ride) => endAt(new Date(r.start_at), r.distance_km, r.pace_min_kmh, r.pace_max_kmh);
