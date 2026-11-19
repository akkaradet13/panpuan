"use client";

import { useEffect, useState } from "react";
import { api, useAuth } from "@/modules/core/client-auth";
import { fmtDate } from "@/modules/core/format";
import { currentDeviceId } from "./client";
import { EnableNotifications } from "./EnableNotifications";
import { InstallPrompt } from "./InstallPrompt";

type Prefs = { ride_reminder: boolean; ride_changes: boolean; club_new_ride: boolean };
type Device = { id: string; platform: string; updated_at: string };

const LABELS: Record<keyof Prefs, string> = {
  ride_reminder: "เตือนก่อนออกปั่น (1 วัน และ 1 ชั่วโมง)",
  ride_changes: "ทริปที่ลงชื่อไว้ถูกเลื่อน/ยกเลิก หรือได้ที่จากคิวรอ",
  club_new_ride: "มีทริปใหม่ในกลุ่มที่เป็นสมาชิก (เร็ว ๆ นี้)",
};
const PLATFORM: Record<string, string> = { ios: "iPhone/iPad", android: "Android", desktop: "คอมพิวเตอร์" };

export function NotifySettings() {
  const user = useAuth();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [thisDevice, setThisDevice] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api<Prefs>("/api/notify/prefs").then(setPrefs, () => {});
    api<Device[]>("/api/notify/devices").then(setDevices, () => {});
    setTimeout(() => setThisDevice(currentDeviceId()), 0);
  }, [user]);

  if (!user || !prefs) return null;

  async function toggle(k: keyof Prefs) {
    setPrefs(await api<Prefs>("/api/notify/prefs", { method: "PATCH", body: JSON.stringify({ [k]: !prefs![k] }) }));
  }
  async function remove(id: string) {
    await api(`/api/notify/devices?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setDevices((d) => d.filter((x) => x.id !== id));
  }

  return (
    <section className="card stack">
      <h2>การแจ้งเตือน</h2>
      <EnableNotifications />
      <InstallPrompt />
      {(Object.keys(LABELS) as (keyof Prefs)[]).map((k) => (
        <label key={k} className="choice">
          <input type="checkbox" checked={prefs[k]} onChange={() => toggle(k)} />
          {LABELS[k]}
        </label>
      ))}
      {devices.length > 0 && (
        <div>
          <strong>เครื่องที่รับแจ้งเตือน</strong>
          <ul className="members">
            {devices.map((d) => (
              <li key={d.id} className="row">
                <span className="grow">
                  {PLATFORM[d.platform] ?? d.platform}
                  {d.id === thisDevice && <span className="badge badge-ok">เครื่องนี้</span>}
                  <span className="muted"> · ใช้ล่าสุด {d.updated_at ? fmtDate(new Date(d.updated_at)) : "-"}</span>
                </span>
                <button className="btn btn-ghost btn-small" onClick={() => remove(d.id)}>
                  ลบ
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
