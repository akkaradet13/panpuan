// Shared by server and client.
export const DIFFICULTY = { easy: "ง่าย", medium: "ปานกลาง", hard: "หนัก" } as const;
export const SURFACE = { paved: "ถนนลาดยาง", gravel: "ลูกรัง/กรวด", mixed: "ผสม" } as const;

export type Difficulty = keyof typeof DIFFICULTY;
export type Surface = keyof typeof SURFACE;
export type VerifyStatus = "unverified" | "verified" | "suspended";

export type Route = {
  id: string;
  name: string;
  slug: string;
  description: string;
  distance_km: number;
  elevation_gain_m: number | null;
  difficulty: Difficulty;
  surface: Surface;
  start: { lat: number; lng: number };
  district: string;
  gpx_path: string;
  polyline: string;
  club_id: string | null;
  rating_avg: number;
  rating_count: number;
  status: VerifyStatus;
};

export type RouteSummary = Pick<Route, "id" | "name" | "slug" | "distance_km" | "elevation_gain_m" | "difficulty" | "surface" | "district" | "rating_avg" | "rating_count" | "status">;

export type Review = {
  uid: string;
  display_name: string;
  rating: number;
  comment: string;
  created_at: string; // ISO
};
