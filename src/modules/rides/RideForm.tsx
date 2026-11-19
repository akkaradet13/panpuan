"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, useAuth } from "@/modules/core/client-auth";
import { DateTimeSelect } from "@/modules/core/DateTimeSelect";
import { MapView } from "@/modules/core/map/MapView";
import { DROP_POLICY, type DropPolicy, type Ride } from "./types";

type RouteOption = { id: string; name: string; distance_km: number };

/** Create a ride for a club, or edit its details (date changes go through "postpone"). */
export function RideForm({ clubId, routes, ride }: { clubId: string; routes: RouteOption[]; ride?: Ride }) {
  const user = useAuth();
  const router = useRouter();
  const [point, setPoint] = useState(ride?.meet_point ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user === null) router.replace(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
  }, [user, router]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true);
    setError("");
    try {
      const body = { ...f, club_id: clubId, meet_point: point, max_riders: f.max_riders || null };
      if (ride) {
        await api(`/api/rides/${ride.id}`, { method: "PATCH", body: JSON.stringify({ ...body, action: "edit" }) });
        router.push(`/rides/${ride.id}`);
      } else {
        const { id } = await api<{ id: string }>("/api/rides", { method: "POST", body: JSON.stringify(body) });
        router.push(`/rides/${id}`);
      }
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  if (!user) return null;

  return (
    <form className="card stack" onSubmit={submit}>
      <label>
        ชื่อทริป
        <input name="title" required minLength={3} maxLength={80} defaultValue={ride?.title} placeholder="เช่น ปั่นเช้าวันเสาร์ ริมมูล" />
      </label>

      {!ride && <DateTimeSelect hour={5} minute={30} />}

      <label>
        จุดนัด
        <input name="meet_name" required minLength={2} maxLength={100} defaultValue={ride?.meet_name} placeholder="เช่น หน้าทุ่งศรีเมือง" />
      </label>
      <div className="stack">
        <span className="muted hint">แตะบนแผนที่เพื่อปักหมุดจุดนัด (ไม่บังคับ)</span>
        <MapView height={240} markers={point ? [{ ...point, label: "จุดนัด" }] : []} onPick={(lat, lng) => setPoint({ lat, lng })} />
        {point && (
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setPoint(null)}>
            ลบหมุด
          </button>
        )}
      </div>

      <label>
        เส้นทาง (ถ้ามี)
        <select name="route_id" defaultValue={ride?.route_id ?? ""}>
          <option value="">ไม่ระบุ</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} · {r.distance_km} กม.
            </option>
          ))}
        </select>
      </label>

      <div className="row">
        <label className="grow">
          ความเร็วต่ำสุด (กม./ชม.)
          <input name="pace_min_kmh" type="number" inputMode="numeric" min={5} max={60} required defaultValue={ride?.pace_min_kmh ?? 20} />
        </label>
        <label className="grow">
          สูงสุด
          <input name="pace_max_kmh" type="number" inputMode="numeric" min={5} max={60} required defaultValue={ride?.pace_max_kmh ?? 25} />
        </label>
      </div>

      <fieldset>
        <legend>แบบการปั่น</legend>
        {(Object.keys(DROP_POLICY) as DropPolicy[]).map((d) => (
          <label key={d} className="choice">
            <input type="radio" name="drop_policy" value={d} defaultChecked={(ride?.drop_policy ?? "no_drop") === d} />
            {DROP_POLICY[d]}
          </label>
        ))}
      </fieldset>

      <label>
        รับได้สูงสุด (คน) — เว้นว่าง = ไม่จำกัด
        <input name="max_riders" type="number" inputMode="numeric" min={2} max={500} defaultValue={ride?.max_riders ?? ""} />
      </label>

      <label>
        รายละเอียดเพิ่มเติม
        <textarea name="note" maxLength={1000} rows={4} defaultValue={ride?.note} placeholder="เตรียมอะไรบ้าง แวะกินข้าวที่ไหน มือใหม่มาได้ไหม" />
      </label>

      {error && <p className="error">{error}</p>}
      <button className="btn" type="submit" disabled={busy}>
        {busy ? "กำลังบันทึก…" : ride ? "บันทึกการแก้ไข" : "สร้างทริป"}
      </button>
    </form>
  );
}
