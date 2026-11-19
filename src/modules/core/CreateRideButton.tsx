"use client";

import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "./client-auth";
import { db } from "./firebase/client";
import { Icon } from "./Icon";

/** "Create ride" menu: lists the clubs the user administers (rides are created per club). */
export function CreateRideButton() {
  const user = useAuth();
  const [clubs, setClubs] = useState<{ id: string; name: string }[] | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "club_members"), where("uid", "==", user.uid), where("role", "==", "admin"), where("status", "==", "active"));
    getDocs(q)
      .then((s) => Promise.all(s.docs.map((m) => getDoc(doc(db, "clubs", m.get("club_id"))).catch(() => null))))
      .then((docs) => setClubs(docs.filter((d) => d?.exists()).map((d) => ({ id: d!.id, name: d!.get("name") }))))
      .catch(() => setClubs([]));
  }, [user]);

  return (
    <details className="dropdown">
      <summary className="btn btn-small">
        <Icon name="plus" /> สร้างนัดปั่นใหม่
      </summary>
      <div className="dropdown-menu">
        {user === null ? (
          <>
            <p className="muted">เข้าสู่ระบบ แล้วสร้างทริปให้กลุ่มที่คุณเป็นแอดมิน</p>
            <Link href="/login">เข้าสู่ระบบ</Link>
          </>
        ) : clubs && clubs.length > 0 ? (
          <>
            <p className="muted">สร้างทริปให้กลุ่ม</p>
            {clubs.map((c) => (
              <Link key={c.id} href={`/rides/new?club=${c.id}`}>
                {c.name}
              </Link>
            ))}
          </>
        ) : clubs ? (
          <>
            <p className="muted">สร้างทริปได้เมื่อเป็นแอดมินของกลุ่ม</p>
            <Link href="/clubs/new">+ สร้างกลุ่มใหม่</Link>
            <Link href="/clubs">ดูกลุ่มทั้งหมด</Link>
          </>
        ) : (
          <p className="muted">กำลังโหลด…</p>
        )}
      </div>
    </details>
  );
}
