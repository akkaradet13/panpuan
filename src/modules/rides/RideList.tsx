import Link from "next/link";
import { dayKey, dayLabel, fmtTime } from "@/modules/core/format";
import type { Ride } from "./types";

/** Upcoming rides grouped by Bangkok day. Server component. */
export function RideList({ rides, empty = "ยังไม่มีทริปที่กำลังจะมาถึง" }: { rides: Ride[]; empty?: string }) {
  if (!rides.length) return <p className="muted">{empty}</p>;
  const groups = new Map<string, Ride[]>();
  for (const r of rides) {
    const k = dayKey(new Date(r.start_at));
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  return (
    <div className="stack">
      {[...groups.values()].map((list) => (
        <section key={list[0].start_at} className="stack">
          <h3 className="day">{dayLabel(new Date(list[0].start_at))}</h3>
          <ul className="list">
            {list.map((r) => (
              <li key={r.id}>
                <RideCard r={r} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function RideCard({ r }: { r: Ride }) {
  return (
    <Link href={`/rides/${r.id}`} className="card list-item">
      <span className="time">{fmtTime(new Date(r.start_at))}</span>
      <strong>{r.title}</strong>
      {r.status === "cancelled" && <span className="badge">ยกเลิก</span>}
      {r.status === "postponed" && <span className="badge">เลื่อน</span>}
      <span className="muted">
        {r.club_name} · {r.meet_name}
        {r.distance_km && ` · ${r.distance_km} กม.`} · {r.pace_min_kmh}–{r.pace_max_kmh} กม./ชม. · ไป {r.going_count}
        {r.max_riders ? `/${r.max_riders}` : ""} คน
      </span>
    </Link>
  );
}
