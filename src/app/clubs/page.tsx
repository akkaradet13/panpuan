import type { Metadata } from "next";
import Link from "next/link";
import type { Club } from "@/modules/core/club-types";
import { listClubs } from "@/modules/core/clubs";
import { Icon } from "@/modules/core/Icon";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "กลุ่มปั่นจักรยานในอุบล",
  description: "รวมกลุ่มและชมรมปั่นจักรยานทุกอำเภอในอุบลราชธานี ดูวันเวลาปั่นประจำ จุดนัด และเข้ากลุ่มได้เลย",
  alternates: { canonical: "/clubs" },
};

/** Two letters/digits for the avatar (skips Thai vowel/tone marks). */
const initials = (name: string) => (name.match(/[\p{L}\p{N}]/gu) ?? []).slice(0, 2).join("").toUpperCase();

export default async function ClubsPage() {
  const clubs = await listClubs();
  return (
    <main className="wrap stack">
      <section className="card page-head">
        <div>
          <h1>กลุ่ม & ชมรมปั่นจักรยานในอุบลฯ</h1>
          <p>เปิดเสรีแต่ติดป้ายยืนยัน — หาแก๊งปั่นที่ตรงจังหวะและสไตล์ของคุณ</p>
        </div>
        <Link href="/clubs/new" className="btn btn-lime">
          <Icon name="users" /> สร้างกลุ่มปั่นของคุณ
        </Link>
      </section>

      {clubs.length === 0 ? (
        <p className="empty">ยังไม่มีกลุ่มเลย มาเป็นกลุ่มแรกกัน 🚲</p>
      ) : (
        <div className="grid-2">
          {clubs.map((c) => (
            <ClubCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </main>
  );
}

function ClubCard({ c }: { c: Club }) {
  return (
    <Link href={`/clubs/${c.slug}`} className="card club-card">
      <div className="club-head">
        <div className="club-avatar">{initials(c.name)}</div>
        <div className="stack" style={{ gap: 4, minWidth: 0 }}>
          <h3>
            {c.name}
            {c.status === "verified" ? <span className="badge badge-ok">✓ ยืนยันแล้ว</span> : <span className="badge badge-warn">ยังไม่ยืนยัน</span>}
          </h3>
          <p className="muted small">
            อ.{c.district} · สมาชิก {c.member_count} คน
          </p>
          <p className="club-desc">{c.description}</p>
        </div>
      </div>
      <div className="ride-foot">
        <span className="muted">🕒 {c.regular_schedule || "ดูนัดปั่นในหน้ากลุ่ม"}</span>
        <span className="cta">{c.join_policy === "open" ? "+ เข้าร่วมกลุ่ม" : "+ ขอเข้าร่วมกลุ่ม"}</span>
      </div>
    </Link>
  );
}
