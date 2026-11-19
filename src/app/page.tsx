import type { Metadata } from "next";
import Link from "next/link";
import { RideList } from "@/modules/rides/RideList";
import { listUpcomingRides } from "@/modules/rides/rides";

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const soon = await listUpcomingRides({ limit: 50, withinDays: 8 });
  return (
    <main className="wrap stack">
      <div>
        <h1>เสาร์นี้ปั่นไหนดี?</h1>
        <p className="muted">นัดปั่นของทุกกลุ่มในอุบลรวมไว้ที่เดียว ลงชื่อไปด้วยแล้วรับเตือนก่อนออกปั่น</p>
      </div>

      <section className="stack">
        <h2>ทริปสัปดาห์นี้</h2>
        <RideList rides={soon} empty="สัปดาห์นี้ยังไม่มีทริป ลองดูกลุ่มปั่นในอุบล แล้วชวนเพื่อนตั้งทริปกัน" />
        <Link href="/rides">ดูปฏิทินทั้งหมด →</Link>
      </section>

      <div className="row">
        <Link href="/routes" className="btn">
          เส้นทางปั่นในอุบล
        </Link>
        <Link href="/clubs" className="btn btn-ghost">
          กลุ่มปั่นในอุบล
        </Link>
      </div>
    </main>
  );
}
