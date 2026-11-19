import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { dayLabel, fmtTime } from "@/modules/core/format";
import { breadcrumbs, JsonLd, SITE } from "@/modules/core/JsonLd";
import { MapView } from "@/modules/core/map/MapView";
import { EnableNotifications } from "@/modules/notify/EnableNotifications";
import { getRide, rideEnd } from "@/modules/rides/rides";
import { RideLive } from "@/modules/rides/RideLive";
import { DONE_AFTER_MS, DROP_POLICY } from "@/modules/rides/types";
import { getRoute } from "@/modules/routes/routes";

export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

const load = cache(getRide);

export async function generateMetadata({ params }: PageProps<"/rides/[id]">): Promise<Metadata> {
  const r = await load((await params).id);
  if (!r) return {};
  const start = new Date(r.start_at);
  const title = `${r.title} · ${dayLabel(start)} ${fmtTime(start)} น. · ${r.club_name}`;
  const description = `นัดปั่น ${r.meet_name} ${r.pace_min_kmh}–${r.pace_max_kmh} กม./ชม.${r.distance_km ? ` ระยะ ${r.distance_km} กม.` : ""} ลงชื่อไปด้วยกันได้ที่ PanPuan`;
  const old = start.getTime() + DONE_AFTER_MS + 30 * 86_400_000 < Date.now(); // ended more than 30 days ago
  return {
    title,
    description,
    alternates: { canonical: `/rides/${r.id}` },
    robots: old ? { index: false } : undefined,
    openGraph: { title, description, url: `/rides/${r.id}`, siteName: "PanPuan ปั่นป่วน", locale: "th_TH", images: ["/icon-512.png"] },
  };
}

export default async function RidePage({ params }: PageProps<"/rides/[id]">) {
  const r = await load((await params).id);
  if (!r) notFound();
  const route = r.route_id ? await getRoute(r.route_id) : null;
  const start = new Date(r.start_at);
  const clubUrl = `/clubs/${r.club_slug}`;

  const event = {
    "@type": "SportsEvent",
    name: r.title,
    sport: "Cycling",
    startDate: r.start_at,
    endDate: rideEnd(r).toISOString(),
    eventStatus: `https://schema.org/${r.status === "cancelled" ? "EventCancelled" : r.status === "postponed" ? "EventRescheduled" : "EventScheduled"}`,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    description: r.note || `นัดปั่นของ ${r.club_name}`,
    url: `${SITE}/rides/${r.id}`,
    location: {
      "@type": "Place",
      name: r.meet_name,
      address: { "@type": "PostalAddress", addressRegion: "อุบลราชธานี", addressCountry: "TH" },
      ...(r.meet_point && { geo: { "@type": "GeoCoordinates", latitude: r.meet_point.lat, longitude: r.meet_point.lng } }),
    },
    organizer: { "@type": "SportsOrganization", name: r.club_name, url: SITE + encodeURI(clubUrl) },
    isAccessibleForFree: true,
  };

  return (
    <main className="wrap narrow stack">
      <JsonLd data={{ "@context": "https://schema.org", "@graph": [event, breadcrumbs([["หน้าแรก", "/"], ["ทริป", "/rides"], [r.title, `/rides/${r.id}`]])] }} />
      <nav className="crumbs muted">
        <Link href="/">หน้าแรก</Link> › <Link href="/rides">ทริป</Link>
      </nav>

      <div>
        <h1>{r.title}</h1>
        <p className="muted">
          โดย <Link href={clubUrl}>{r.club_name}</Link>
        </p>
      </div>

      <dl className="stats">
        <div><dt>วัน</dt><dd>{dayLabel(start)}</dd></div>
        <div><dt>ออกปั่น</dt><dd>{fmtTime(start)} น.</dd></div>
        <div><dt>ความเร็ว</dt><dd>{r.pace_min_kmh}–{r.pace_max_kmh} กม./ชม.</dd></div>
        <div><dt>กติกา</dt><dd title={DROP_POLICY[r.drop_policy]}>{r.drop_policy === "no_drop" ? "No-Drop" : "Drop"}</dd></div>
      </dl>

      <RideLive ride={r} afterJoin={<EnableNotifications buttonClass="btn btn-lime btn-small btn-block" />} />

      <section className="stack">
        <h2>จุดนัด: {r.meet_name}</h2>
        {(r.meet_point || route) && (
          <MapView polyline={route?.polyline} markers={r.meet_point ? [{ ...r.meet_point, label: "จุดนัด" }] : []} />
        )}
        {r.meet_point && (
          <a className="btn btn-ghost btn-small" href={`https://www.google.com/maps/dir/?api=1&destination=${r.meet_point.lat},${r.meet_point.lng}`} target="_blank" rel="noopener">
            นำทางไปจุดนัด
          </a>
        )}
      </section>

      {route && (
        <section>
          <h2>เส้นทาง</h2>
          <p>
            <Link href={`/routes/${route.slug}`}>{route.name}</Link> · {route.distance_km} กม.
            {route.elevation_gain_m ? ` · ขึ้น ${route.elevation_gain_m} ม.` : ""}
          </p>
        </section>
      )}

      {r.note && (
        <section>
          <h2>รายละเอียด</h2>
          <p className="prewrap">{r.note}</p>
        </section>
      )}
    </main>
  );
}
