import type { Metadata } from "next";
import Link from "next/link";
import { listClubs } from "@/modules/core/clubs";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "กลุ่มปั่นจักรยานในอุบล",
  description: "รวมกลุ่มและชมรมปั่นจักรยานทุกอำเภอในอุบลราชธานี ดูวันเวลาปั่นประจำ จุดนัด และเข้ากลุ่มได้เลย",
  alternates: { canonical: "/clubs" },
};

export default async function ClubsPage() {
  const clubs = await listClubs();
  return (
    <main className="wrap stack">
      <h1>กลุ่มปั่นจักรยานในอุบล</h1>
      <Link href="/clubs/new" className="btn">
        + สร้างกลุ่มของคุณ
      </Link>
      {clubs.length === 0 ? (
        <p className="muted">ยังไม่มีกลุ่มเลย มาเป็นกลุ่มแรกกัน 🚲</p>
      ) : (
        <ul className="list">
          {clubs.map((c) => (
            <li key={c.id}>
              <Link href={`/clubs/${c.slug}`} className="card list-item">
                <strong>{c.name}</strong>
                {c.status === "unverified" && <span className="badge">ยังไม่ยืนยัน</span>}
                <span className="muted">
                  อ.{c.district} · สมาชิก {c.member_count} คน{c.regular_schedule && ` · ${c.regular_schedule}`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
