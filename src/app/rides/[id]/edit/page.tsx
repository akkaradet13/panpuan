import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRide } from "@/modules/rides/rides";
import { RideForm } from "@/modules/rides/RideForm";
import { listRoutes } from "@/modules/routes/routes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "แก้ไขทริป",
  robots: { index: false },
};

export default async function EditRidePage({ params }: PageProps<"/rides/[id]/edit">) {
  const ride = await getRide((await params).id);
  if (!ride) notFound();
  const routes = await listRoutes();
  return (
    <main className="wrap narrow">
      <h1>แก้ไขทริป</h1>
      <p className="muted">ต้องการเปลี่ยนวันหรือเวลา ใช้ปุ่ม “เลื่อนทริป” ในหน้าทริป ระบบจะแจ้งทุกคนที่ลงชื่อ</p>
      <RideForm clubId={ride.club_id} ride={ride} routes={routes.map((r) => ({ id: r.id, name: r.name, distance_km: r.distance_km }))} />
    </main>
  );
}
