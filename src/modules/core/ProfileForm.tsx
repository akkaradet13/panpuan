"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, logout, useAuth } from "./client-auth";
import { BIKE_TYPES, PACE_LEVELS, type BikeType, type PaceLevel, type UserProfile } from "./profile-options";

export function ProfileForm() {
  const user = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (user === null) router.replace("/login?next=/profile");
    if (user) api<UserProfile>("/api/me").then(setProfile).catch((e: Error) => setStatus(e.message));
  }, [user, router]);

  if (!profile) return <p className="muted">{status || "กำลังโหลด…"}</p>;

  const set = (patch: Partial<UserProfile>) => {
    setProfile({ ...profile, ...patch });
    setStatus("");
  };
  const toggleBike = (t: BikeType) =>
    set({ bike_types: profile.bike_types.includes(t) ? profile.bike_types.filter((x) => x !== t) : [...profile.bike_types, t] });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("กำลังบันทึก…");
    try {
      const { display_name, bike_types, pace_level } = profile!;
      setProfile(await api<UserProfile>("/api/me", { method: "PATCH", body: JSON.stringify({ display_name, bike_types, pace_level }) }));
      setStatus("บันทึกแล้ว ✅");
    } catch (err) {
      setStatus((err as Error).message);
    }
  }

  return (
    <form className="card stack" onSubmit={save}>
      <div className="row">
        {profile.photo_url && <Image className="avatar" src={profile.photo_url} width={64} height={64} alt="" />}
        <label className="grow">
          ชื่อที่แสดง
          <input value={profile.display_name} maxLength={40} required onChange={(e) => set({ display_name: e.target.value })} />
        </label>
      </div>

      <fieldset>
        <legend>ปั่นจักรยานแบบไหน (เลือกได้หลายแบบ)</legend>
        <div className="chips">
          {(Object.keys(BIKE_TYPES) as BikeType[]).map((t) => (
            <label key={t} className="chip">
              <input type="checkbox" checked={profile.bike_types.includes(t)} onChange={() => toggleBike(t)} />
              {BIKE_TYPES[t]}
            </label>
          ))}
        </div>
      </fieldset>

      <label>
        ความเร็วที่ปั่นสบาย
        <select value={profile.pace_level} onChange={(e) => set({ pace_level: e.target.value as PaceLevel })}>
          {(Object.keys(PACE_LEVELS) as PaceLevel[]).map((p) => (
            <option key={p} value={p}>
              {PACE_LEVELS[p]}
            </option>
          ))}
        </select>
      </label>

      <div className="row">
        <button className="btn" type="submit">
          บันทึก
        </button>
        <span className="muted" role="status">
          {status}
        </span>
      </div>

      <button type="button" className="btn btn-ghost" onClick={() => logout().then(() => router.replace("/"))}>
        ออกจากระบบ
      </button>
    </form>
  );
}
