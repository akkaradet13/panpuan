// Shared by server and client.
export type RideStatus = "scheduled" | "postponed" | "cancelled";

export const DROP_POLICY = {
  no_drop: "ไม่ทิ้งกัน (no-drop)",
  drop: "ใครไหวไปก่อน (drop)",
} as const;
export type DropPolicy = keyof typeof DROP_POLICY;

export type Ride = {
  id: string;
  club_id: string;
  club_name: string;
  club_slug: string;
  club_district: string;
  club_status: string;
  route_id: string | null;
  route_name: string | null;
  route_slug: string | null;
  distance_km: number | null;
  title: string;
  start_at: string; // ISO
  meet_name: string;
  meet_point: { lat: number; lng: number } | null;
  pace_min_kmh: number;
  pace_max_kmh: number;
  drop_policy: DropPolicy;
  max_riders: number | null;
  going_count: number;
  waitlist_count: number;
  status: RideStatus;
  status_note: string;
  note: string;
};

export type Participant = {
  uid: string;
  display_name: string;
  photo_url: string;
  status: "going" | "waitlist";
};

export type PaceLevel = "chill" | "medium" | "fast";
export const PACE_LABEL: Record<PaceLevel, string> = { chill: "ชิล (< 25 กม./ชม.)", medium: "กลาง (25–32)", fast: "เร็ว (33+)" };
export function paceLevel(r: Pick<Ride, "pace_min_kmh" | "pace_max_kmh">): PaceLevel {
  const avg = (r.pace_min_kmh + r.pace_max_kmh) / 2;
  return avg < 25 ? "chill" : avg <= 32 ? "medium" : "fast";
}

/** A ride is over 12 h after it starts (computed on read, nobody has to close it). */
export const DONE_AFTER_MS = 12 * 3600_000;
export const isDone = (startIso: string, now = Date.now()) => Date.parse(startIso) + DONE_AFTER_MS < now;
