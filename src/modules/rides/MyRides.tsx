"use client";

import { collection, onSnapshot, orderBy, query, Timestamp, where } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, useAuth } from "@/modules/core/client-auth";
import { db } from "@/modules/core/firebase/client";
import { dayLabel, fmtTime } from "@/modules/core/format";
import { DONE_AFTER_MS } from "./types";

type Mine = { ride_id: string; ride_title: string; ride_meet_name: string; ride_start_at: Timestamp; ride_status: string; status: string };

/** "Rides you signed up for" — live, from rides_participants (one query, uses the uid + ride_start_at index). */
export function MyRides() {
  const user = useAuth();
  const [mine, setMine] = useState<Mine[] | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "rides_participants"),
      where("uid", "==", user.uid),
      where("ride_start_at", ">=", Timestamp.fromMillis(Date.now() - DONE_AFTER_MS)),
      orderBy("ride_start_at"),
    );
    return onSnapshot(q, (s) => setMine(s.docs.map((d) => d.data() as Mine)), () => setMine([]));
  }, [user]);

  if (!user) return null;

  return (
    <div className="stack" style={{ gap: 10 }}>
      <h3>ทริปที่คุณลงชื่อไว้ ({mine?.length ?? 0} ทริป)</h3>
      {mine && mine.length === 0 && (
        <p className="empty">
          คุณยังไม่ได้ลงชื่อร่วมทริปไหนเลย ลองกด <strong style={{ color: "var(--orange)" }}>“ลงชื่อร่วมทริป”</strong> ด้านล่างดูสิ!
        </p>
      )}
      {mine?.map((m) => {
        const start = m.ride_start_at.toDate();
        return (
          <div key={m.ride_id} className="my-ride">
            <div>
              <div className="when">
                {dayLabel(start)} · {fmtTime(start)} น.
                {m.ride_status === "cancelled" && <span className="badge">ยกเลิกแล้ว</span>}
                {m.status === "waitlist" && <span className="badge badge-warn">คิวรอ</span>}
              </div>
              <Link href={`/rides/${m.ride_id}`} style={{ color: "inherit", textDecoration: "none" }}>
                <strong className="display">{m.ride_title}</strong>
              </Link>
              <div className="muted small">จุดนัด: {m.ride_meet_name}</div>
            </div>
            <button
              className="btn btn-ghost btn-small"
              style={{ color: "var(--danger)" }}
              onClick={() => api(`/api/rides/${m.ride_id}/join`, { method: "DELETE" }).catch(() => {})}
            >
              ยกเลิก
            </button>
          </div>
        );
      })}
    </div>
  );
}
