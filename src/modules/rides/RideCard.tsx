import Link from "next/link";
import { dayLabel, fmtTime } from "@/modules/core/format";
import { Icon } from "@/modules/core/Icon";
import type { Ride } from "./types";

export function RideCard({ r }: { r: Ride }) {
  const start = new Date(r.start_at);
  const cancelled = r.status === "cancelled";
  const full = r.max_riders !== null && r.going_count >= r.max_riders;
  return (
    <Link href={`/rides/${r.id}`} className={`card ride-card${cancelled ? " is-cancelled" : ""}`}>
      <div className="stack" style={{ gap: 12 }}>
        <div className="ride-top">
          <span className="ride-when">
            <Icon name="clock" size={14} />
            {dayLabel(start)} · {fmtTime(start)} น.
          </span>
          <span>
            {cancelled ? (
              <span className="badge">ยกเลิกแล้ว</span>
            ) : r.status === "postponed" ? (
              <span className="badge badge-warn">เลื่อนกำหนดการ</span>
            ) : (
              <span className="badge">{full ? "เต็ม · ต่อคิวได้" : "เปิดลงชื่อ"}</span>
            )}
            {r.club_district && <span className="badge badge-plain">{r.club_district}</span>}
          </span>
        </div>

        <div>
          <h3>{r.title}</h3>
          <div className="ride-club">
            กลุ่ม: <strong>{r.club_name}</strong>
            {r.club_status === "verified" ? <span className="badge badge-ok">✓ ยืนยันแล้ว</span> : <span className="badge badge-warn">ยังไม่ยืนยัน</span>}
          </div>
        </div>

        <div className="specs">
          <div>
            <div className="k">ระยะทาง</div>
            <div className="v">{r.distance_km ? `${r.distance_km} km` : "–"}</div>
          </div>
          <div>
            <div className="k">ความเร็วเฉลี่ย</div>
            <div className="v o">
              {r.pace_min_kmh}–{r.pace_max_kmh}
            </div>
          </div>
          <div>
            <div className="k">กติกา</div>
            <div className="v l">{r.drop_policy === "no_drop" ? "No-Drop" : "Drop"}</div>
          </div>
        </div>

        <div className="ride-meet">
          <Icon name="pin" size={14} />
          <span>จุดนัด: {r.meet_name}</span>
        </div>
      </div>

      <div className="ride-foot">
        <span className="row" style={{ gap: 6 }}>
          <Icon name="users" />
          <strong>
            {r.max_riders ? `${r.going_count}/${r.max_riders} คน` : `${r.going_count} คน (ไม่จำกัด)`}
          </strong>
        </span>
        <span className="cta">{cancelled ? "รายละเอียด" : "ลงชื่อร่วมทริป"}</span>
      </div>
    </Link>
  );
}
