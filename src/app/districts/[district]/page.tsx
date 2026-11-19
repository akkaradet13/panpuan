import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listClubs } from "@/modules/core/clubs";
import { DISTRICTS, isDistrict } from "@/modules/core/districts";
import { breadcrumbs, decodeParam, JsonLd } from "@/modules/core/JsonLd";
import { RouteBrowser } from "@/modules/routes/RouteBrowser";
import { listRoutes } from "@/modules/routes/routes";

export const revalidate = 60;
export const dynamicParams = false;

export function generateStaticParams() {
  return DISTRICTS.map((district) => ({ district }));
}

export async function generateMetadata({ params }: PageProps<"/districts/[district]">): Promise<Metadata> {
  const d = decodeParam((await params).district);
  if (!isDistrict(d)) return {};
  const [routes, clubs] = await Promise.all([listRoutes(), listClubs()]);
  const has = routes.some((r) => r.district === d && r.status === "verified") || clubs.some((c) => c.district === d && c.status === "verified");
  return {
    title: `เส้นทางปั่นจักรยาน อ.${d} อุบล และกลุ่มปั่นในอำเภอ`,
    description: `รวมเส้นทางปั่นจักรยานพร้อม GPX และกลุ่มปั่นในอำเภอ${d} จังหวัดอุบลราชธานี`,
    alternates: { canonical: `/districts/${d}` },
    robots: has ? undefined : { index: false }, // thin pages stay out of Google until there is verified content
  };
}

export default async function DistrictPage({ params }: PageProps<"/districts/[district]">) {
  const d = decodeParam((await params).district);
  if (!isDistrict(d)) notFound();
  const [routes, clubs] = await Promise.all([listRoutes(), listClubs()]);
  const here = clubs.filter((c) => c.district === d);

  return (
    <main className="wrap stack">
      <JsonLd data={{ "@context": "https://schema.org", ...breadcrumbs([["หน้าแรก", "/"], ["เส้นทาง", "/routes"], [`อ.${d}`, `/districts/${d}`]]) }} />
      <h1>ปั่นจักรยาน อ.{d}</h1>

      <section className="stack">
        <h2>เส้นทางในอำเภอ</h2>
        <RouteBrowser routes={routes.filter((r) => r.district === d)} fixedDistrict={d} />
        <Link href="/routes/new">+ เพิ่มเส้นทางในอำเภอนี้</Link>
      </section>

      <section className="stack">
        <h2>กลุ่มปั่นในอำเภอ</h2>
        {here.length === 0 && <p className="muted">ยังไม่มีกลุ่มในอำเภอนี้</p>}
        <ul className="list">
          {here.map((c) => (
            <li key={c.id}>
              <Link href={`/clubs/${c.slug}`} className="card list-item">
                <strong>{c.name}</strong>
                <span className="muted">สมาชิก {c.member_count} คน{c.regular_schedule && ` · ${c.regular_schedule}`}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
