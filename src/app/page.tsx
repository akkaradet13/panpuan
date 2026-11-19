import type { Metadata } from "next";
import Link from "next/link";
import { CreateRideButton } from "@/modules/core/CreateRideButton";
import { fmtShortDate, fmtTime } from "@/modules/core/format";
import { Icon } from "@/modules/core/Icon";
import { RideBrowser } from "@/modules/rides/RideBrowser";
import { listUpcomingRides } from "@/modules/rides/rides";
import type { Ride } from "@/modules/rides/types";
import { RouteCard } from "@/modules/routes/RouteBrowser";
import { listRoutes } from "@/modules/routes/routes";

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** The most-joined open ride of the week. */
const pickFeatured = (rides: Ride[]) => rides.filter((r) => r.status !== "cancelled").sort((a, b) => b.going_count - a.going_count)[0];

export default async function Home() {
  const [rides, routes] = await Promise.all([listUpcomingRides({ limit: 50, withinDays: 8 }), listRoutes()]);
  const featured = pickFeatured(rides);

  return (
    <main className="wrap stack-lg">
      <section className="hero">
        <div className="hero-in">
          <div>
            <span className="hero-chip">
              <i /> คอมมูนิตี้คนปั่นอุบลฯ 25 อำเภอ
            </span>
            <h1>
              เสาร์นี้<span className="o">ปั่น</span>ไหนดี?
              <br />
              <span className="g">นัดรวมพล</span> ไม่หลุดกลุ่ม
            </h1>
            <p>รวมตารางนัดปั่นทุกกลุ่มในจังหวัดอุบลราชธานี คลังเส้นทางพร้อมไฟล์ GPX และระบบแจ้งเตือนก่อนล้อหมุน จบครบในเว็บเดียว</p>
            <div className="row">
              <a href="#rides" className="btn">
                <Icon name="bike" /> ดูทริปสัปดาห์นี้ ({rides.length} ทริป)
              </a>
              <Link href="/routes" className="btn btn-ghost">
                <Icon name="map" /> คลังเส้นทางอุบลฯ
              </Link>
            </div>
          </div>

          {featured && <Featured r={featured} />}
        </div>
      </section>

      <section id="rides" className="stack" style={{ scrollMarginTop: 80 }}>
        <div className="section-head">
          <div>
            <h2 className="section-title">ปฏิทินนัดปั่นรวมทุกกลุ่มในอุบล</h2>
            <p>อัปเดตสด · จบทริปอัตโนมัติหลังล้อหมุน 12 ชม.</p>
          </div>
          <CreateRideButton />
        </div>
        <RideBrowser rides={rides} empty="สัปดาห์นี้ยังไม่มีทริป ชวนกลุ่มของคุณมาตั้งทริปกัน!" />
        <Link href="/rides" className="link-more">
          ดูปฏิทินทั้งหมด <Icon name="arrow" />
        </Link>
      </section>

      <section className="stack">
        <div className="section-head">
          <div>
            <h2 className="section-title lime">คลังเส้นทางปั่นยอดฮิตในอุบลฯ</h2>
            <p>โหลดไฟล์ GPX ใส่ไมล์จักรยาน พร้อมแผนที่และรีวิวจากคนปั่นจริง</p>
          </div>
          <Link href="/routes" className="link-more">
            ดูทั้งหมด <Icon name="arrow" />
          </Link>
        </div>
        {routes.length ? (
          <div className="grid-3">
            {routes.slice(0, 3).map((r) => (
              <RouteCard key={r.id} r={r} />
            ))}
          </div>
        ) : (
          <p className="empty">
            ยังไม่มีเส้นทาง <Link href="/routes/new">อัปโหลด GPX เส้นแรกของอุบล →</Link>
          </p>
        )}
      </section>
    </main>
  );
}

function Featured({ r }: { r: Ride }) {
  const start = new Date(r.start_at);
  return (
    <Link href={`/rides/${r.id}`} className="featured" style={{ textDecoration: "none" }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="tag-hot">
          <Icon name="flame" size={14} /> ทริปแนะนำสัปดาห์นี้
        </span>
        {r.drop_policy === "no_drop" && <span className="tag-lime">No-Drop</span>}
      </div>
      <div>
        <h3>{r.title}</h3>
        <p className="muted small row" style={{ gap: 6, margin: "4px 0 0" }}>
          <Icon name="shield" size={14} /> จัดโดย: <span style={{ color: "#fff", fontWeight: 500 }}>{r.club_name}</span>
        </p>
      </div>
      <div className="specs">
        <div>
          <div className="k">วันเวลา (24 ชม.)</div>
          <div className="v">
            {fmtShortDate(start)} · {fmtTime(start)}
          </div>
        </div>
        <div>
          <div className="k">ระยะทาง</div>
          <div className="v l">{r.distance_km ? `${r.distance_km} km` : "–"}</div>
        </div>
        <div>
          <div className="k">ความเร็ว</div>
          <div className="v o">
            {r.pace_min_kmh}–{r.pace_max_kmh} km/h
          </div>
        </div>
      </div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="muted small">
          <strong style={{ color: "#fff" }}>{r.going_count}</strong>
          {r.max_riders ? `/${r.max_riders}` : ""} คนไปแล้ว
        </span>
        <span className="btn btn-lime btn-small">ลงชื่อร่วมทริป</span>
      </div>
    </Link>
  );
}
