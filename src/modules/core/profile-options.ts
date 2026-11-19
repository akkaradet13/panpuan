// Shared by server (validation) and client (form labels).
export const BIKE_TYPES = {
  road: "เสือหมอบ",
  mtb: "เสือภูเขา",
  gravel: "กราเวล",
  touring: "ทัวริ่ง",
  city: "จักรยานทั่วไป",
} as const;

export const PACE_LEVELS = {
  chill: "ชิล ๆ (ต่ำกว่า 20 กม./ชม.)",
  medium: "กลาง ๆ (20–28 กม./ชม.)",
  fast: "สายซิ่ง (28 กม./ชม. ขึ้นไป)",
} as const;

export type BikeType = keyof typeof BIKE_TYPES;
export type PaceLevel = keyof typeof PACE_LEVELS;

export type UserProfile = {
  uid: string;
  display_name: string;
  photo_url: string;
  bike_types: BikeType[];
  pace_level: PaceLevel;
  calendar_token: string;
};
