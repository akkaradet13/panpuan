import type { Metadata } from "next";
import { CopyIcsButton } from "@/modules/core/CalendarLink";
import { CreateRideButton } from "@/modules/core/CreateRideButton";
import { dayKey, nextDays } from "@/modules/core/format";
import { MyRides } from "@/modules/rides/MyRides";
import { RideList } from "@/modules/rides/RideList";
import { listUpcomingRides } from "@/modules/rides/rides";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "ปฏิทินนัดปั่นจักรยานอุบล ทุกกลุ่ม",
  description: "ทริปปั่นจักรยานที่กำลังจะมาถึงของทุกกลุ่มในอุบลราชธานี ดูเวลา จุดนัด ความเร็ว ลงชื่อไปด้วย และซิงก์เข้า Google Calendar",
  alternates: { canonical: "/rides" },
};

export default async function RidesPage() {
  const rides = await listUpcomingRides();
  const busy = new Set(rides.filter((r) => r.status !== "cancelled").map((r) => dayKey(new Date(r.start_at))));
  const week = nextDays(7);

  return (
    <main className="wrap stack-lg">
      <section className="card stack">
        <div className="page-head">
          <div>
            <h1>ปฏิทินนัดปั่น & Google Calendar Sync</h1>
            <p>ทริปของทุกกลุ่มในอุบล · ซิงก์ทริปที่คุณลงชื่อเข้าปฏิทินส่วนตัวอัตโนมัติผ่าน ICS Feed</p>
          </div>
          <CopyIcsButton />
        </div>
        <nav className="week" aria-label="7 วันข้างหน้า">
          {week.map((d) => (
            <a key={d.key} href={busy.has(d.key) ? `#d-${d.key}` : undefined} className={`day-cell${busy.has(d.key) ? " has" : ""}`}>
              <div className="w">{d.w}</div>
              <div className="d">{d.d}</div>
              <span className="dot" />
            </a>
          ))}
        </nav>
        <MyRides />
      </section>

      <section className="stack">
        <div className="section-head">
          <h2 className="section-title">ทริปที่กำลังจะมาถึง</h2>
          <CreateRideButton />
        </div>
        <RideList rides={rides} empty="ยังไม่มีทริปที่กำลังจะมาถึง ชวนกลุ่มของคุณมาลงทริปกัน 🚲" />
      </section>
    </main>
  );
}
