import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { fmtDate } from "@/modules/core/format";
import { breadcrumbs, decodeParam, JsonLd } from "@/modules/core/JsonLd";
import { MapView } from "@/modules/core/map/MapView";
import { ReviewForm } from "@/modules/routes/ReviewForm";
import { getRouteBySlug, gpxUrl, listReviews } from "@/modules/routes/routes";
import { DIFFICULTY, SURFACE } from "@/modules/routes/types";

export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

const load = cache(async (raw: string) => getRouteBySlug(decodeParam(raw)));

export async function generateMetadata({ params }: PageProps<"/routes/[slug]">): Promise<Metadata> {
  const r = await load((await params).slug);
  if (!r) return {};
  const title = `เส้นทางปั่นจักรยาน ${r.name} ${r.distance_km} กม. อ.${r.district}`;
  const description = r.description.slice(0, 155);
  return {
    title,
    description,
    alternates: { canonical: `/routes/${r.slug}` },
    robots: r.status === "verified" ? undefined : { index: false },
    openGraph: { title, description, url: `/routes/${r.slug}`, siteName: "PanPuan ปั่นป่วน", locale: "th_TH" },
  };
}

export default async function RoutePage({ params }: PageProps<"/routes/[slug]">) {
  const r = await load((await params).slug);
  if (!r) notFound();
  const reviews = await listReviews(r.id);

  return (
    <main className="wrap stack">
      <JsonLd data={{ "@context": "https://schema.org", ...breadcrumbs([["หน้าแรก", "/"], ["เส้นทาง", "/routes"], [r.name, `/routes/${r.slug}`]]) }} />
      <nav className="crumbs muted">
        <Link href="/">หน้าแรก</Link> › <Link href="/routes">เส้นทาง</Link> › <Link href={`/districts/${r.district}`}>อ.{r.district}</Link>
      </nav>

      <div>
        <h1>{r.name}</h1>
        {r.status === "unverified" && <span className="badge">ยังไม่ยืนยัน</span>}
        {r.rating_count > 0 && (
          <span className="muted">
            ★ {r.rating_avg.toFixed(1)} ({r.rating_count} รีวิว)
          </span>
        )}
      </div>

      <dl className="stats">
        <div><dt>ระยะทาง</dt><dd>{r.distance_km} กม.</dd></div>
        <div><dt>ขึ้นเขารวม</dt><dd>{r.elevation_gain_m === null ? "–" : `${r.elevation_gain_m} ม.`}</dd></div>
        <div><dt>ความยาก</dt><dd>{DIFFICULTY[r.difficulty]}</dd></div>
        <div><dt>ถนน</dt><dd>{SURFACE[r.surface]}</dd></div>
      </dl>

      <MapView polyline={r.polyline} />

      <div className="row">
        <a className="btn" href={gpxUrl(r.gpx_path)} download>
          ⬇ ดาวน์โหลด GPX
        </a>
        <a className="btn btn-ghost" href={`https://www.google.com/maps/dir/?api=1&destination=${r.start.lat},${r.start.lng}`} target="_blank" rel="noopener">
          นำทางไปจุดเริ่ม
        </a>
      </div>

      <section>
        <h2>เกี่ยวกับเส้นทาง</h2>
        <p className="prewrap">{r.description}</p>
      </section>

      <section className="stack">
        <h2>รีวิว ({reviews.length})</h2>
        <ReviewForm routeId={r.id} slug={r.slug} />
        {reviews.map((v) => (
          <article key={v.uid} className="review">
            <strong>{"★".repeat(v.rating)}{"☆".repeat(5 - v.rating)}</strong> {v.display_name}
            <span className="muted"> · {fmtDate(new Date(v.created_at))}</span>
            {v.comment && <p className="prewrap">{v.comment}</p>}
          </article>
        ))}
      </section>
    </main>
  );
}
