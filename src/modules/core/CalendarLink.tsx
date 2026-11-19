"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, useAuth } from "./client-auth";
import { Icon } from "./Icon";
import type { UserProfile } from "./profile-options";

/** Compact "copy my ICS link" button for the calendar page. */
export function CopyIcsButton() {
  const user = useAuth();
  const [msg, setMsg] = useState("");
  if (user === undefined) return null;
  if (user === null) {
    return (
      <Link className="btn btn-ghost btn-small" href="/login?next=/rides">
        <Icon name="link" /> เข้าสู่ระบบเพื่อซิงก์ปฏิทิน
      </Link>
    );
  }
  async function copy() {
    try {
      const { calendar_token } = await api<UserProfile>("/api/me");
      await navigator.clipboard.writeText(`${location.origin}/api/cal/${calendar_token}.ics`);
      setMsg("คัดลอกแล้ว ✅ วางใน Google Calendar → อื่น ๆ → จาก URL");
    } catch {
      setMsg("คัดลอกไม่สำเร็จ ดูลิงก์ได้ที่หน้าโปรไฟล์");
    }
  }
  return (
    <div className="stack" style={{ gap: 4, alignItems: "flex-start" }}>
      <button className="btn btn-ghost btn-small" onClick={copy}>
        <Icon name="link" /> คัดลอกลิงก์ ICS ส่วนตัว
      </button>
      {msg && <span className="muted small">{msg}</span>}
    </div>
  );
}

/** Personal ICS feed URL (secret) with copy and reset. */
export function CalendarLink() {
  const user = useAuth();
  const [token, setToken] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (user) api<UserProfile>("/api/me").then((p) => setToken(p.calendar_token), () => {});
  }, [user]);

  if (!token) return null;
  const url = `${location.origin}/api/cal/${token}.ics`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMsg("คัดลอกแล้ว ✅");
    } catch {
      setMsg("คัดลอกไม่สำเร็จ กดค้างที่ลิงก์เพื่อคัดลอกเอง");
    }
  }
  async function reset() {
    const r = await api<{ calendar_token: string }>("/api/me/calendar-token", { method: "POST" });
    setToken(r.calendar_token);
    setMsg("สร้างลิงก์ใหม่แล้ว ลิงก์เก่าใช้ไม่ได้อีก");
  }

  return (
    <section className="card stack">
      <h2>ปฏิทินทริปของฉัน</h2>
      <p className="muted">
        เพิ่มลิงก์นี้ใน Google Calendar (อื่น ๆ → จาก URL) ทุกทริปที่ลงชื่อจะขึ้นปฏิทินเอง · Google ดึงข้อมูลใหม่ช้า (หลายชั่วโมง)
        ถ้าทริปเลื่อนหรือยกเลิกด่วน ให้ดูจากแจ้งเตือนเป็นหลัก
      </p>
      <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="ลิงก์ปฏิทิน" />
      <div className="row">
        <button className="btn btn-small" onClick={copy}>
          คัดลอกลิงก์
        </button>
        <button className="btn btn-ghost btn-small" onClick={reset}>
          รีเซ็ตลิงก์
        </button>
        <span className="muted">{msg}</span>
      </div>
    </section>
  );
}
