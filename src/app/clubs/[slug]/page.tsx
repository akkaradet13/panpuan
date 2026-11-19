import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { LINK_LABELS, type LinkKey } from "@/modules/core/club-types";
import { ClubMembership } from "@/modules/core/ClubMembership";
import { getClubBySlug } from "@/modules/core/clubs";
import { RideList } from "@/modules/rides/RideList";
import { listUpcomingRides } from "@/modules/rides/rides";

export const revalidate = 60;

// Render on first request, then cache (ISR). Slugs can be Thai, so params may arrive URL-encoded.
export async function generateStaticParams() {
  return [];
}

const loadClub = cache(async (raw: string) => {
  let slug = raw;
  try {
    slug = decodeURIComponent(raw);
  } catch {}
  return getClubBySlug(slug);
});

export async function generateMetadata({ params }: PageProps<"/clubs/[slug]">): Promise<Metadata> {
  const club = await loadClub((await params).slug);
  if (!club) return {};
  const title = `${club.name} กลุ่มปั่นจักรยาน อ.${club.district} อุบล`;
  const description = club.description.slice(0, 155);
  const url = `/clubs/${club.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: club.status === "verified" ? undefined : { index: false },
    openGraph: { title, description, url, siteName: "PanPuan ปั่นป่วน", locale: "th_TH", images: ["/icon-512.png"] },
  };
}

export default async function ClubPage({ params }: PageProps<"/clubs/[slug]">) {
  const club = await loadClub((await params).slug);
  if (!club) notFound();
  const rides = await listUpcomingRides({ clubId: club.id, limit: 20 });

  const url = `https://panpuan.net/clubs/${encodeURIComponent(club.slug)}`;
  const links = (Object.keys(LINK_LABELS) as LinkKey[]).filter((k) => club.links[k]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SportsOrganization",
        name: club.name,
        description: club.description,
        sport: "Cycling",
        url,
        address: { "@type": "PostalAddress", addressLocality: club.district, addressRegion: "อุบลราชธานี", addressCountry: "TH" },
        sameAs: links.map((k) => club.links[k]),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "หน้าแรก", item: "https://panpuan.net/" },
          { "@type": "ListItem", position: 2, name: "กลุ่มปั่น", item: "https://panpuan.net/clubs" },
          { "@type": "ListItem", position: 3, name: club.name, item: url },
        ],
      },
    ],
  };

  return (
    <main className="wrap narrow stack">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav className="crumbs muted">
        <Link href="/">หน้าแรก</Link> › <Link href="/clubs">กลุ่มปั่น</Link>
      </nav>

      <div>
        <h1>{club.name}</h1>
        {club.status === "unverified" && <span className="badge">ยังไม่ยืนยัน</span>}
        <p className="muted">
          อ.{club.district} · สมาชิก {club.member_count} คน · {club.join_policy === "open" ? "เข้ากลุ่มได้เลย" : "แอดมินอนุมัติก่อนเข้ากลุ่ม"}
        </p>
      </div>

      <ClubMembership clubId={club.id} slug={club.slug} joinPolicy={club.join_policy} />

      <section className="stack">
        <h2>ทริปที่กำลังจะมาถึง</h2>
        <RideList rides={rides} empty="ยังไม่มีทริปที่กำลังจะมาถึง" />
        <a href={`/clubs/${encodeURIComponent(club.slug)}/calendar.ics`} className="muted">
          📆 ปฏิทินของกลุ่ม (.ics) — คัดลอกลิงก์ไปเพิ่มใน Google Calendar
        </a>
      </section>

      <section>
        <h2>เกี่ยวกับกลุ่ม</h2>
        <p className="prewrap">{club.description}</p>
        {(club.regular_schedule || club.home_meet_name) && (
          <dl className="facts">
            {club.regular_schedule && (
              <>
                <dt>ปั่นประจำ</dt>
                <dd>{club.regular_schedule}</dd>
              </>
            )}
            {club.home_meet_name && (
              <>
                <dt>จุดนัด</dt>
                <dd>{club.home_meet_name}</dd>
              </>
            )}
          </dl>
        )}
      </section>

      {links.length > 0 && (
        <section>
          <h2>ติดตามกลุ่ม</h2>
          <div className="chips">
            {links.map((k) => (
              <a key={k} className="chip" href={club.links[k]} target="_blank" rel="noopener nofollow">
                {LINK_LABELS[k]}
              </a>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
