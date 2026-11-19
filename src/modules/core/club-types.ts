// Shared by server and client.
export const LINK_LABELS = {
  facebook: "Facebook",
  line_group: "กลุ่ม LINE",
  instagram: "Instagram",
  tiktok: "TikTok",
} as const;

export type LinkKey = keyof typeof LINK_LABELS;
export type ClubLinks = Partial<Record<LinkKey, string>>;
export type ClubStatus = "unverified" | "verified" | "suspended";
export type JoinPolicy = "open" | "approval";

export type Club = {
  id: string;
  name: string;
  slug: string;
  description: string;
  district: string;
  home_meet_name: string;
  home_meet_point: { lat: number; lng: number } | null;
  regular_schedule: string;
  logo_url: string;
  links: ClubLinks;
  join_policy: JoinPolicy;
  member_count: number;
  status: ClubStatus;
};

export type ClubInput = Pick<Club, "name" | "description" | "district" | "home_meet_name" | "regular_schedule" | "links" | "join_policy">;

export type ClubMember = {
  club_id: string;
  uid: string;
  display_name: string;
  photo_url: string;
  role: "admin" | "member";
  status: "active" | "pending";
};

export const MEMBER_ACTIONS = ["approve", "promote", "demote", "remove"] as const;
export type MemberAction = (typeof MEMBER_ACTIONS)[number];
