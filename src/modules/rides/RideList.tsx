import { dayKey, dayLabel } from "@/modules/core/format";
import { RideCard } from "./RideCard";
import type { Ride } from "./types";

/** Upcoming rides grouped by Bangkok day (anchors #d-YYYY-MM-DD for the week strip). Server component. */
export function RideList({ rides, empty = "ยังไม่มีทริปที่กำลังจะมาถึง" }: { rides: Ride[]; empty?: string }) {
  if (!rides.length) return <p className="empty">{empty}</p>;
  const groups = new Map<string, Ride[]>();
  for (const r of rides) {
    const k = dayKey(new Date(r.start_at));
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  return (
    <div className="stack">
      {[...groups.entries()].map(([k, list]) => (
        <section key={k} className="stack">
          <h3 className="day" id={`d-${k}`}>
            {dayLabel(new Date(list[0].start_at))}
          </h3>
          <div className="grid-2">
            {list.map((r) => (
              <RideCard key={r.id} r={r} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
