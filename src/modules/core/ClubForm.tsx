"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, useAuth } from "./client-auth";
import { LINK_LABELS, type Club, type LinkKey } from "./club-types";
import { DISTRICTS } from "./districts";

/** Create a club, or edit one when `club` is given. */
export function ClubForm({ club }: { club?: Club }) {
  const user = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const here = club ? `/clubs/${club.slug}/edit` : "/clubs/new";

  useEffect(() => {
    if (user === null) router.replace(`/login?next=${encodeURIComponent(here)}`);
  }, [user, router, here]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    setBusy(true);
    setError("");
    try {
      const { slug } = await api<{ slug: string }>(club ? `/api/clubs/${club.id}` : "/api/clubs", {
        method: club ? "PATCH" : "POST",
        body: JSON.stringify({
          name: get("name"),
          district: get("district"),
          description: get("description"),
          regular_schedule: get("regular_schedule"),
          home_meet_name: get("home_meet_name"),
          join_policy: get("join_policy"),
          links: Object.fromEntries((Object.keys(LINK_LABELS) as LinkKey[]).map((k) => [k, get(`link_${k}`)])),
        }),
      });
      router.push(`/clubs/${encodeURIComponent(slug)}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  if (!user) return null;

  return (
    <form className="card stack" onSubmit={submit}>
      <label>
        ชื่อกลุ่ม
        <input name="name" required minLength={3} maxLength={80} placeholder="เช่น ชมรมจักรยานริมมูล" defaultValue={club?.name} />
      </label>

      <label>
        อำเภอ
        <select name="district" required defaultValue={club?.district ?? ""}>
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

      <label>
        เกี่ยวกับกลุ่ม
        <textarea
          name="description"
          required
          minLength={20}
          maxLength={2000}
          rows={5}
          placeholder="ปั่นแนวไหน เส้นทางประจำ มือใหม่มาได้ไหม บรรยากาศเป็นยังไง"
          defaultValue={club?.description}
        />
      </label>

      <label>
        วันเวลาปั่นประจำ (ถ้ามี)
        <input name="regular_schedule" maxLength={100} placeholder="เช่น เสาร์–อาทิตย์ 05:30" defaultValue={club?.regular_schedule} />
      </label>

      <label>
        จุดนัดประจำ (ถ้ามี)
        <input name="home_meet_name" maxLength={100} placeholder="เช่น หน้าทุ่งศรีเมือง" defaultValue={club?.home_meet_name} />
      </label>

      <fieldset>
        <legend>คนอื่นเข้ากลุ่มยังไง</legend>
        <label className="choice">
          <input type="radio" name="join_policy" value="open" defaultChecked={club?.join_policy !== "approval"} />
          เข้าได้เลย
        </label>
        <label className="choice">
          <input type="radio" name="join_policy" value="approval" defaultChecked={club?.join_policy === "approval"} />
          แอดมินต้องอนุมัติก่อน
        </label>
      </fieldset>

      <fieldset className="stack">
        <legend>ลิงก์ของกลุ่ม (ถ้ามี)</legend>
        {(Object.keys(LINK_LABELS) as LinkKey[]).map((k) => (
          <label key={k}>
            {LINK_LABELS[k]}
            <input name={`link_${k}`} type="url" maxLength={300} placeholder="https://" defaultValue={club?.links[k]} />
          </label>
        ))}
      </fieldset>

      {error && <p className="error">{error}</p>}
      <button className="btn" type="submit" disabled={busy}>
        {busy ? "กำลังบันทึก…" : club ? "บันทึกการแก้ไข" : "สร้างกลุ่ม"}
      </button>
    </form>
  );
}
