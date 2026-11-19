"use client";

import { collection, doc, onSnapshot, query, where, type DocumentData } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, useAuth } from "@/modules/core/client-auth";
import { DateTimeSelect } from "@/modules/core/DateTimeSelect";
import { db } from "@/modules/core/firebase/client";
import { dayLabel, fmtTime } from "@/modules/core/format";
import { Icon } from "@/modules/core/Icon";
import { gcalUrl, rideHours } from "./ics";
import { isDone, type Participant, type Ride } from "./types";

const live = (x: DocumentData): Partial<Ride> => ({
  title: x.title,
  meet_name: x.meet_name,
  start_at: x.start_at?.toDate().toISOString(),
  status: x.status,
  status_note: x.status_note ?? "",
  max_riders: x.max_riders ?? null,
  going_count: x.going_count ?? 0,
  waitlist_count: x.waitlist_count ?? 0,
});

/**
 * Live part of a ride page: counts and status (onSnapshot on the ride doc, public), sign-up buttons,
 * participant list (logged-in only, per rules) and club-admin controls.
 * `afterJoin` is rendered after a successful sign-up (the page passes the notifications prompt).
 */
export function RideLive({ ride: initial, afterJoin }: { ride: Ride; afterJoin?: React.ReactNode }) {
  const user = useAuth();
  const [ride, setRide] = useState(initial);
  const [people, setPeople] = useState<Participant[] | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [justJoined, setJustJoined] = useState(false);

  useEffect(
    () => onSnapshot(doc(db, "rides", initial.id), (s) => s.exists() && setRide((r) => ({ ...r, ...live(s.data()) })), () => {}),
    [initial.id],
  );

  useEffect(() => {
    if (!user) return;
    const offPeople = onSnapshot(
      query(collection(db, "rides_participants"), where("ride_id", "==", initial.id)),
      (s) => setPeople(s.docs.map((d) => d.data() as Participant)),
      () => setPeople([]),
    );
    const offAdmin = onSnapshot(
      doc(db, "club_members", `${initial.club_id}_${user.uid}`),
      (s) => setIsAdmin(s.get("role") === "admin" && s.get("status") === "active"),
      () => {},
    );
    return () => {
      offPeople();
      offAdmin();
    };
  }, [user, initial.id, initial.club_id]);

  const start = new Date(ride.start_at);
  const done = isDone(ride.start_at);
  const cancelled = ride.status === "cancelled";
  const me = people?.find((p) => p.uid === user?.uid);
  const full = ride.max_riders !== null && ride.going_count >= ride.max_riders;
  const end = new Date(start.getTime() + rideHours(ride.distance_km, ride.pace_min_kmh, ride.pace_max_kmh) * 3600_000);
  const gcal = gcalUrl({
    title: `🚲 ${ride.title}`,
    start,
    end,
    location: ride.meet_name,
    details: `${ride.club_name}\nhttps://panpuan.net/rides/${ride.id}`,
  });

  async function run(fn: () => Promise<unknown>, after?: () => void) {
    setBusy(true);
    setMsg("");
    try {
      await fn();
      after?.();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const join = () => run(() => api(`/api/rides/${ride.id}/join`, { method: "POST" }), () => setJustJoined(true));
  const leave = () => run(() => api(`/api/rides/${ride.id}/join`, { method: "DELETE" }), () => setJustJoined(false));

  const going = (people ?? []).filter((p) => p.status === "going");
  const waiting = (people ?? []).filter((p) => p.status === "waitlist");

  return (
    <section className="stack">
      {cancelled && (
        <p className="banner banner-bad">
          ❌ ทริปนี้ยกเลิกแล้ว{ride.status_note && ` · ${ride.status_note}`}
        </p>
      )}
      {ride.status === "postponed" && (
        <p className="banner">
          📅 เลื่อนเป็น {dayLabel(start)} · {fmtTime(start)} น.{ride.status_note && ` · ${ride.status_note}`}
        </p>
      )}
      {done && !cancelled && <p className="banner">ทริปนี้จบแล้ว 🏁</p>}

      <p className="count">
        <strong>{ride.going_count}</strong>
        {ride.max_riders !== null && ` / ${ride.max_riders}`} คนไปด้วย
        {ride.waitlist_count > 0 && <span className="muted"> · รอคิว {ride.waitlist_count}</span>}
      </p>

      {!done && !cancelled && (
        <div className="row">
          {user === null && (
            <Link className="btn" href={`/login?next=/rides/${ride.id}`}>
              เข้าสู่ระบบเพื่อลงชื่อ
            </Link>
          )}
          {user && people && !me && (
            <button className="btn" disabled={busy} onClick={join}>
              {full ? "ต่อคิวรอ" : "ลงชื่อไปด้วย 🚲"}
            </button>
          )}
          {me && (
            <>
              <span className="badge badge-ok">{me.status === "going" ? "คุณลงชื่อแล้ว ✅" : "คุณอยู่ในคิวรอ ⏳"}</span>
              <button className="btn btn-ghost btn-small" disabled={busy} onClick={leave}>
                ยกเลิกการลงชื่อ
              </button>
            </>
          )}
        </div>
      )}
      {msg && <p className="error">{msg}</p>}

      {justJoined && (
        <div className="action-banner" role="status">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "nowrap" }}>
            <div className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
              <span className="ok">
                <Icon name="check" />
              </span>
              <div>
                <strong>ลงชื่อ “{ride.title}” แล้ว</strong>
                <div className="muted small">อยากให้ระบบเตือนก่อนออกปั่นไหม?</div>
              </div>
            </div>
            <button className="close" onClick={() => setJustJoined(false)} aria-label="ปิด">
              <Icon name="x" />
            </button>
          </div>
          <div className="row" style={{ flexWrap: "nowrap", alignItems: "stretch" }}>
            <div className="grow">{afterJoin}</div>
            <a className="btn btn-ghost btn-small grow" href={gcal} target="_blank" rel="noopener">
              <Icon name="calendar" /> Google Calendar
            </a>
          </div>
        </div>
      )}

      {!cancelled && (
        <a className="btn btn-ghost btn-small" href={gcal} target="_blank" rel="noopener" style={{ alignSelf: "flex-start" }}>
          <Icon name="calendar" /> เพิ่มลง Google Calendar
        </a>
      )}

      {user && people && (
        <details>
          <summary>
            คนที่ไป ({going.length}){waiting.length > 0 && ` · รอคิว ${waiting.length}`}
          </summary>
          <ul className="members">
            {[...going, ...waiting].map((p) => (
              <li key={p.uid} className="row">
                <Image className="avatar" src={p.photo_url || "/icon-192.png"} width={32} height={32} alt="" />
                <span className="grow">
                  {p.display_name}
                  {p.status === "waitlist" && <span className="badge">รอคิว</span>}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {isAdmin && !done && <AdminControls ride={ride} />}
    </section>
  );
}

function AdminControls({ ride }: { ride: Ride }) {
  const [mode, setMode] = useState<"" | "postpone" | "cancel">("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setMsg("");
    try {
      await api(`/api/rides/${ride.id}`, { method: "PATCH", body: JSON.stringify({ ...f, action: mode }) });
      setMode("");
      setMsg(mode === "cancel" ? "ยกเลิกทริปแล้ว ส่งแจ้งเตือนถึงทุกคนที่ลงชื่อ" : "เลื่อนทริปแล้ว ส่งแจ้งเตือนถึงทุกคนที่ลงชื่อ");
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card stack">
      <strong>สำหรับแอดมินกลุ่ม</strong>
      <div className="row">
        <Link className="btn btn-ghost btn-small" href={`/rides/${ride.id}/edit`}>
          แก้ไขรายละเอียด
        </Link>
        <button className="btn btn-ghost btn-small" onClick={() => setMode("postpone")}>
          เลื่อนทริป
        </button>
        {ride.status !== "cancelled" && (
          <button className="btn btn-ghost btn-small" onClick={() => setMode("cancel")}>
            ยกเลิกทริป
          </button>
        )}
      </div>
      {mode && (
        <form className="stack" onSubmit={submit}>
          {mode === "postpone" && <DateTimeSelect />}
          <label>
            {mode === "cancel" ? "เหตุผล (แจ้งทุกคนที่ลงชื่อ)" : "หมายเหตุ"}
            <input name="status_note" maxLength={200} placeholder={mode === "cancel" ? "เช่น ฝนตกหนัก" : "เช่น ฝนตก เลื่อนไปอาทิตย์"} />
          </label>
          <div className="row">
            <button className="btn btn-small" type="submit" disabled={busy}>
              {mode === "cancel" ? "ยืนยันยกเลิกทริป" : "ยืนยันเลื่อนทริป"}
            </button>
            <button className="btn btn-ghost btn-small" type="button" onClick={() => setMode("")}>
              ปิด
            </button>
          </div>
        </form>
      )}
      {msg && <p className="muted">{msg}</p>}
    </div>
  );
}
