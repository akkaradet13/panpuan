"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, useAuth } from "./client-auth";

type Item = { id: string; name: string; slug: string; status: "unverified" | "verified" | "suspended" };
type Queue = { clubs: Item[]; routes: Item[] };

/** Super admin queue: verify or suspend clubs/routes; restore suspended ones. Verification never blocks use. */
export function AdminQueue() {
  const user = useAuth();
  const [q, setQ] = useState<Queue | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (user) api<Queue>("/api/admin/queue").then(setQ, (e: Error) => setErr(e.message));
  }, [user]);

  if (user === null) return <Link href="/login?next=/admin">เข้าสู่ระบบ</Link>;
  if (err) return <p className="error">{err}</p>;
  if (!q) return <p className="muted">กำลังโหลด…</p>;

  async function set(kind: "clubs" | "routes", id: string, status: Item["status"]) {
    await api(`/api/admin/${kind}/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    setQ((old) => old && { ...old, [kind]: old[kind].map((x) => (x.id === id ? { ...x, status } : x)) });
  }

  const section = (kind: "clubs" | "routes", title: string) => (
    <section className="stack">
      <h2>
        {title} ({q[kind].filter((x) => x.status === "unverified").length} รอยืนยัน)
      </h2>
      {q[kind].length === 0 && <p className="muted">ไม่มีรายการ</p>}
      <ul className="members">
        {q[kind].map((x) => (
          <li key={x.id} className="row">
            <span className="grow">
              {x.status === "suspended" ? x.name : <Link href={`/${kind}/${x.slug}`}>{x.name}</Link>}{" "}
              <span className="badge">{x.status === "unverified" ? "ยังไม่ยืนยัน" : x.status === "verified" ? "ยืนยันแล้ว" : "ระงับ"}</span>
            </span>
            {x.status !== "verified" && (
              <button className="btn btn-small" onClick={() => set(kind, x.id, "verified")}>
                ยืนยัน
              </button>
            )}
            {x.status !== "suspended" ? (
              <button className="btn btn-ghost btn-small" onClick={() => set(kind, x.id, "suspended")}>
                ระงับ
              </button>
            ) : (
              <button className="btn btn-ghost btn-small" onClick={() => set(kind, x.id, "unverified")}>
                คืนสถานะ
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <>
      {section("clubs", "กลุ่ม")}
      {section("routes", "เส้นทาง")}
    </>
  );
}
