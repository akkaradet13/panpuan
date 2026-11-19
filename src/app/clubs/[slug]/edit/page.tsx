import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClubForm } from "@/modules/core/ClubForm";
import { getClubBySlug } from "@/modules/core/clubs";

export const dynamic = "force-dynamic"; // always edit the latest data

export const metadata: Metadata = {
  title: "แก้ไขข้อมูลกลุ่ม",
  robots: { index: false },
};

export default async function EditClubPage({ params }: PageProps<"/clubs/[slug]/edit">) {
  let slug = (await params).slug;
  try {
    slug = decodeURIComponent(slug);
  } catch {}
  const club = await getClubBySlug(slug);
  if (!club) notFound();
  return (
    <main className="wrap">
      <h1>แก้ไขข้อมูลกลุ่ม</h1>
      <p className="muted">ลิงก์ของกลุ่มยังเหมือนเดิมแม้เปลี่ยนชื่อ · ข้อมูลใหม่ขึ้นหน้าเว็บภายในประมาณ 2 นาที</p>
      <ClubForm club={club} />
    </main>
  );
}
