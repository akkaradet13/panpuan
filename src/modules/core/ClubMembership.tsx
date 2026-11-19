"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, useAuth } from "./client-auth";
import type { ClubMember, JoinPolicy, MemberAction } from "./club-types";
import { db } from "./firebase/client";

type Props = { clubId: string; slug: string; joinPolicy: JoinPolicy };

/** Live join/leave buttons, member list, and admin controls. Member data needs login (Firestore rules). */
export function ClubMembership({ clubId, slug, joinPolicy }: Props) {
  const user = useAuth();
  const [members, setMembers] = useState<ClubMember[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "club_members"), where("club_id", "==", clubId));
    return onSnapshot(
      q,
      (s) => setMembers(s.docs.map((d) => d.data() as ClubMember)),
      () => setMembers([]),
    );
  }, [user, clubId]);

  if (user === undefined) return null;
  if (user === null) {
    return (
      <Link className="btn" href={`/login?next=${encodeURIComponent(`/clubs/${slug}`)}`}>
        เข้าสู่ระบบเพื่อเข้ากลุ่ม
      </Link>
    );
  }
  if (!members) return <p className="muted">กำลังโหลด…</p>;

  const me = members.find((m) => m.uid === user.uid);
  const isAdmin = me?.role === "admin" && me.status === "active";
  const pending = members.filter((m) => m.status === "pending");
  const active = members
    .filter((m) => m.status === "active")
    .sort((a, b) => (a.role === b.role ? a.display_name.localeCompare(b.display_name, "th") : a.role === "admin" ? -1 : 1));

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setMsg("");
    try {
      await fn();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const join = () => run(() => api(`/api/clubs/${clubId}/join`, { method: "POST" }));
  const leave = () => run(() => api(`/api/clubs/${clubId}/join`, { method: "DELETE" }));
  const act = (uid: string, action: MemberAction) =>
    run(() => api(`/api/clubs/${clubId}/members/${uid}`, { method: "PATCH", body: JSON.stringify({ action }) }));

  return (
    <section className="stack">
      <div className="row">
        {!me && (
          <button className="btn" disabled={busy} onClick={join}>
            {joinPolicy === "open" ? "เข้ากลุ่ม" : "ขอเข้ากลุ่ม"}
          </button>
        )}
        {me?.status === "pending" && (
          <>
            <span className="badge">รอแอดมินอนุมัติ</span>
            <button className="btn btn-ghost btn-small" disabled={busy} onClick={leave}>
              ยกเลิกคำขอ
            </button>
          </>
        )}
        {me?.status === "active" && (
          <>
            <span className="badge badge-ok">{isAdmin ? "คุณเป็นแอดมินกลุ่มนี้" : "เป็นสมาชิกแล้ว ✅"}</span>
            <button className="btn btn-ghost btn-small" disabled={busy} onClick={leave}>
              ออกจากกลุ่ม
            </button>
          </>
        )}
      </div>
      {msg && <p className="error">{msg}</p>}

      {isAdmin && pending.length > 0 && (
        <div>
          <h2>รออนุมัติ ({pending.length})</h2>
          <ul className="members">
            {pending.map((m) => (
              <MemberRow key={m.uid} m={m}>
                <button className="btn btn-small" disabled={busy} onClick={() => act(m.uid, "approve")}>
                  อนุมัติ
                </button>
                <button className="btn btn-ghost btn-small" disabled={busy} onClick={() => act(m.uid, "remove")}>
                  ปฏิเสธ
                </button>
              </MemberRow>
            ))}
          </ul>
        </div>
      )}

      <details>
        <summary>สมาชิก ({active.length})</summary>
        <ul className="members">
          {active.map((m) => (
            <MemberRow key={m.uid} m={m}>
              {isAdmin && m.uid !== user.uid &&
                (m.role === "admin" ? (
                  <button className="btn btn-ghost btn-small" disabled={busy} onClick={() => act(m.uid, "demote")}>
                    ถอดแอดมิน
                  </button>
                ) : (
                  <>
                    <button className="btn btn-ghost btn-small" disabled={busy} onClick={() => act(m.uid, "promote")}>
                      ตั้งเป็นแอดมิน
                    </button>
                    <button className="btn btn-ghost btn-small" disabled={busy} onClick={() => act(m.uid, "remove")}>
                      เอาออก
                    </button>
                  </>
                ))}
            </MemberRow>
          ))}
        </ul>
      </details>
    </section>
  );
}

function MemberRow({ m, children }: { m: ClubMember; children?: React.ReactNode }) {
  return (
    <li className="row">
      <Image className="avatar" src={m.photo_url || "/icon-192.png"} width={32} height={32} alt="" />
      <span className="grow">
        {m.display_name}
        {m.role === "admin" && <span className="badge badge-ok">แอดมิน</span>}
      </span>
      {children}
    </li>
  );
}
