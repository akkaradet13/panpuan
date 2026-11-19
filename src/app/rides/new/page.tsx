import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClub } from "@/modules/core/clubs";
import { RideForm } from "@/modules/rides/RideForm";
import { listRoutes } from "@/modules/routes/routes";

export const metadata: Metadata = {
  title: "สร้างทริปปั่น",
  robots: { index: false },
};

// /rides/new?club={club_id} — only club admins can submit (checked by POST /api/rides)
export default async function NewRidePage({ searchParams }: PageProps<"/rides/new">) {
  const clubId = (await searchParams).club;
  const club = typeof clubId === "string" ? await getClub(clubId) : null;
  if (!club) notFound();
  const routes = await listRoutes();
  return (
    <main className="wrap narrow">
      <h1>สร้างทริปของ {club.name}</h1>
      <p className="muted">สร้างแล้วขึ้นปฏิทินรวมทันที สมาชิกลงชื่อและรับเตือนก่อนออกปั่นได้</p>
      <RideForm clubId={club.id} routes={routes.map((r) => ({ id: r.id, name: r.name, distance_km: r.distance_km }))} />
    </main>
  );
}
