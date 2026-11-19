"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, useAuth } from "@/modules/core/client-auth";
import { DISTRICTS } from "@/modules/core/districts";
import { DIFFICULTY, SURFACE, type Difficulty, type Surface } from "./types";

export function RouteForm() {
  const user = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user === null) router.replace("/login?next=/routes/new");
  }, [user, router]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const file = form.get("gpx") as File;
    if (file.size > 5 * 1024 * 1024) return setError("ไฟล์ GPX ต้องไม่เกิน 5 MB");
    setBusy(true);
    setError("");
    try {
      const { slug } = await api<{ slug: string }>("/api/routes", { method: "POST", body: form });
      router.push(`/routes/${encodeURIComponent(slug)}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  if (!user) return null;

  return (
    <form className="card stack" onSubmit={submit}>
      <label>
        ไฟล์ GPX (ไม่เกิน 5 MB)
        <input name="gpx" type="file" accept=".gpx,application/gpx+xml" required />
        <span className="muted hint">ส่งออกจาก Strava, Garmin, Komoot หรือไมล์จักรยานได้เลย</span>
      </label>
      <label>
        ชื่อเส้นทาง
        <input name="name" required minLength={3} maxLength={80} placeholder="เช่น อุบล–โขงเจียม ริมโขง" />
      </label>
      <label>
        เล่าเกี่ยวกับเส้นทาง
        <textarea
          name="description"
          required
          minLength={30}
          maxLength={3000}
          rows={6}
          placeholder="วิวเป็นยังไง ช่วงไหนรถเยอะ มีจุดแวะร้านกาแฟหรือเติมน้ำตรงไหน เหมาะกับมือใหม่ไหม"
        />
      </label>
      <label>
        อำเภอของจุดเริ่ม
        <select name="district" required defaultValue="">
          <option value="" disabled>
            เลือกอำเภอ
          </option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <div className="row">
        <label className="grow">
          ความยาก
          <select name="difficulty" required defaultValue="medium">
            {(Object.keys(DIFFICULTY) as Difficulty[]).map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY[d]}
              </option>
            ))}
          </select>
        </label>
        <label className="grow">
          สภาพถนน
          <select name="surface" required defaultValue="paved">
            {(Object.keys(SURFACE) as Surface[]).map((s) => (
              <option key={s} value={s}>
                {SURFACE[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <p className="error">{error}</p>}
      <button className="btn" type="submit" disabled={busy}>
        {busy ? "กำลังอัปโหลด…" : "เพิ่มเส้นทาง"}
      </button>
    </form>
  );
}
