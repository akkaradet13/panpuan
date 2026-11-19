import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue, GeoPoint, type DocumentSnapshot } from "firebase-admin/firestore";
import { isDistrict } from "@/modules/core/districts";
import { adminBucket, adminDb } from "@/modules/core/firebase/admin";
import { HttpError } from "@/modules/core/http";
import { slugify } from "@/modules/core/clubs";
import { decodePolyline } from "@/modules/core/polyline";
import { getOrCreateUser } from "@/modules/core/users";
import { gpxStats } from "./gpx";
import { DIFFICULTY, SURFACE, type Difficulty, type Review, type Route, type RouteSummary, type Surface, type VerifyStatus } from "./types";

const routes = adminDb.collection("routes");
const reviews = adminDb.collection("routes_reviews");
const RESERVED_SLUGS = new Set(["new"]);
export const MAX_GPX_BYTES = 5 * 1024 * 1024;

/** Public download URL; storage.rules allow anyone to read routes/**. */
export const gpxUrl = (path: string) =>
  `https://firebasestorage.googleapis.com/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(path)}?alt=media`;

function toRoute(d: DocumentSnapshot): Route {
  const x = d.data()!;
  return {
    id: d.id,
    name: x.name,
    slug: x.slug,
    description: x.description,
    distance_km: x.distance_km,
    elevation_gain_m: x.elevation_gain_m ?? null,
    difficulty: x.difficulty,
    surface: x.surface,
    start: { lat: x.start.latitude, lng: x.start.longitude },
    district: x.district,
    gpx_path: x.gpx_path,
    polyline: x.polyline,
    club_id: x.club_id ?? null,
    rating_avg: x.rating_avg ?? 0,
    rating_count: x.rating_count ?? 0,
    status: x.status,
  };
}

const summary = (r: Route): RouteSummary => ({
  id: r.id, name: r.name, slug: r.slug, distance_km: r.distance_km, elevation_gain_m: r.elevation_gain_m,
  difficulty: r.difficulty, surface: r.surface, district: r.district, rating_avg: r.rating_avg, rating_count: r.rating_count, status: r.status,
  thumb: thumbPath(r.polyline),
});

/** Route shape fitted into a 280×95 box, ≤ 80 points (~1 KB), so list pages don't ship full polylines. */
function thumbPath(polyline: string): RouteSummary["thumb"] {
  const all = decodePolyline(polyline);
  if (all.length < 2) return null;
  const step = Math.ceil(all.length / 80);
  const pts = all.filter((_, i) => i % step === 0 || i === all.length - 1);
  const lats = pts.map((p) => p[0]), lngs = pts.map((p) => p[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs);
  const cos = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const w = (Math.max(...lngs) - minLng) * cos || 1e-9, h = maxLat - minLat || 1e-9;
  const k = Math.min(260 / w, 75 / h);
  const ox = (280 - w * k) / 2, oy = (95 - h * k) / 2;
  const xy = pts.map(([lat, lng]) => [ox + (lng - minLng) * cos * k, oy + (maxLat - lat) * k]);
  return { d: xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(""), x: xy[0][0], y: xy[0][1] };
}

export type RouteInput = { name: string; description: string; difficulty: Difficulty; surface: Surface; district: string };

export function parseRouteInput(f: FormData): RouteInput {
  const text = (key: string, min: number, max: number, label: string) => {
    const v = String(f.get(key) ?? "").trim();
    if (v.length < min) throw new HttpError(400, `${label}ต้องยาวอย่างน้อย ${min} ตัวอักษร`);
    if (v.length > max) throw new HttpError(400, `${label}ยาวได้ไม่เกิน ${max} ตัวอักษร`);
    return v;
  };
  const difficulty = String(f.get("difficulty"));
  const surface = String(f.get("surface"));
  const district = String(f.get("district"));
  if (!(difficulty in DIFFICULTY)) throw new HttpError(400, "กรุณาเลือกความยาก");
  if (!(surface in SURFACE)) throw new HttpError(400, "กรุณาเลือกสภาพถนน");
  if (!isDistrict(district)) throw new HttpError(400, "กรุณาเลือกอำเภอของจุดเริ่ม");
  return {
    name: text("name", 3, 80, "ชื่อเส้นทาง"),
    description: text("description", 30, 3000, "คำบรรยายเส้นทาง"),
    difficulty: difficulty as Difficulty,
    surface: surface as Surface,
    district,
  };
}

/** Parses the GPX, stores it at routes/{id}.gpx (server-only path) and creates the routes doc. */
export async function createRoute(token: DecodedIdToken, input: RouteInput, gpx: string) {
  const stats = gpxStats(gpx);
  if (!stats) throw new HttpError(400, "อ่านไฟล์ GPX ไม่ได้ หรือมีจุดไม่พอ ลองส่งออกไฟล์ใหม่จากแอปที่ใช้");
  let base = slugify(input.name);
  if (!base) throw new HttpError(400, "ชื่อเส้นทางต้องมีตัวอักษรหรือตัวเลข");
  if (RESERVED_SLUGS.has(base)) base = `${base}-route`;
  await getOrCreateUser(token);

  const ref = routes.doc();
  const gpx_path = `routes/${ref.id}.gpx`;
  const file = adminBucket().file(gpx_path);
  await file.save(gpx, {
    contentType: "application/gpx+xml",
    metadata: { contentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(input.name)}.gpx` },
  });

  try {
    const slug = await adminDb.runTransaction(async (tx) => {
      let slug = base;
      for (let n = 2; !(await tx.get(routes.where("slug", "==", slug).limit(1))).empty; n++) slug = `${base}-${n}`;
      const now = FieldValue.serverTimestamp();
      tx.create(ref, {
        ...input,
        slug,
        distance_km: stats.distance_km,
        elevation_gain_m: stats.elevation_gain_m,
        start: new GeoPoint(stats.start.lat, stats.start.lng),
        gpx_path,
        polyline: stats.polyline,
        stops: [],
        club_id: null,
        rating_avg: 0,
        rating_count: 0,
        status: "unverified",
        verified_by: null,
        verified_at: null,
        created_by: token.uid,
        created_at: now,
        updated_at: now,
      });
      return slug;
    });
    return { id: ref.id, slug };
  } catch (e) {
    await file.delete().catch(() => {});
    throw e;
  }
}

export async function getRouteBySlug(slug: string): Promise<Route | null> {
  const d = (await routes.where("slug", "==", slug).limit(1).get()).docs[0];
  return d && d.get("status") !== "suspended" ? toRoute(d) : null;
}

export async function getRoute(id: string): Promise<Route | null> {
  const d = await routes.doc(id).get();
  return d.exists && d.get("status") !== "suspended" ? toRoute(d) : null;
}

/** ponytail: full scan of non-suspended routes; fine for hundreds, add paging/geohash past a few thousand. */
export async function listRoutes(): Promise<RouteSummary[]> {
  const snap = await routes.where("status", "in", ["unverified", "verified"]).get();
  return snap.docs.map((d) => summary(toRoute(d))).sort((a, b) => b.rating_count - a.rating_count || a.distance_km - b.distance_km);
}

export async function listRoutesByStatus(status: VerifyStatus): Promise<RouteSummary[]> {
  return (await routes.where("status", "==", status).get()).docs.map((d) => summary(toRoute(d)));
}

/** Super admin only (checked by the caller). */
export async function setRouteStatus(id: string, status: VerifyStatus, by: string) {
  const ref = routes.doc(id);
  if (!(await ref.get()).exists) throw new HttpError(404, "ไม่พบเส้นทางนี้");
  await ref.update({
    status,
    verified_by: status === "verified" ? by : null,
    verified_at: status === "verified" ? FieldValue.serverTimestamp() : null,
    updated_at: FieldValue.serverTimestamp(),
  });
}

export async function listReviews(routeId: string): Promise<Review[]> {
  const snap = await reviews.where("route_id", "==", routeId).get();
  return snap.docs
    .map((d) => {
      const x = d.data();
      return { uid: x.uid, display_name: x.display_name, rating: x.rating, comment: x.comment, created_at: x.created_at.toDate().toISOString() };
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function parseReview(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>;
  const rating = Number(b.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, "ให้คะแนน 1–5 ดาว");
  const comment = typeof b.comment === "string" ? b.comment.trim() : "";
  if (comment.length > 1000) throw new HttpError(400, "รีวิวยาวได้ไม่เกิน 1000 ตัวอักษร");
  return { rating, comment };
}

/** One review per user per route; editing replaces it. Keeps rating_avg/rating_count in the same transaction. */
export async function upsertReview(token: DecodedIdToken, routeId: string, r: { rating: number; comment: string }) {
  const profile = await getOrCreateUser(token);
  await adminDb.runTransaction(async (tx) => {
    const routeRef = routes.doc(routeId);
    const revRef = reviews.doc(`${routeId}_${token.uid}`);
    const [route, old] = await tx.getAll(routeRef, revRef);
    if (!route.exists || route.get("status") === "suspended") throw new HttpError(404, "ไม่พบเส้นทางนี้");
    const count: number = route.get("rating_count") ?? 0;
    const sum = (route.get("rating_avg") ?? 0) * count - (old.exists ? old.get("rating") : 0) + r.rating;
    const newCount = old.exists ? count : count + 1;
    tx.set(revRef, {
      route_id: routeId,
      uid: token.uid,
      display_name: profile.display_name,
      ...r,
      created_at: old.exists ? old.get("created_at") : FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });
    tx.update(routeRef, { rating_count: newCount, rating_avg: Math.round((sum / newCount) * 100) / 100 });
  });
}
