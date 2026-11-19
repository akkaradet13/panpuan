"use client";

import Link from "next/link";
import { useState } from "react";
import { api, useAuth } from "@/modules/core/client-auth";

export function ReviewForm({ routeId, slug }: { routeId: string; slug: string }) {
  const user = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  if (user === undefined) return null;
  if (user === null) {
    return (
      <Link className="btn btn-ghost btn-small" href={`/login?next=${encodeURIComponent(`/routes/${slug}`)}`}>
        เข้าสู่ระบบเพื่อรีวิว
      </Link>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return setStatus("เลือกจำนวนดาวก่อนนะ");
    setBusy(true);
    try {
      await api(`/api/routes/${routeId}/reviews`, { method: "POST", body: JSON.stringify({ rating, comment }) });
      setStatus("ขอบคุณสำหรับรีวิว ✅ จะขึ้นหน้าเว็บภายในไม่กี่นาที");
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card stack" onSubmit={submit}>
      <div className="stars" role="radiogroup" aria-label="ให้คะแนน">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} ดาว`} onClick={() => setRating(n)}>
            {n <= rating ? "★" : "☆"}
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} rows={3} placeholder="เล่าประสบการณ์สั้น ๆ (ไม่บังคับ)" />
      <div className="row">
        <button className="btn btn-small" type="submit" disabled={busy}>
          ส่งรีวิว
        </button>
        <span className="muted" role="status">
          {status}
        </span>
      </div>
    </form>
  );
}
