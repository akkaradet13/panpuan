import type { Metadata } from "next";
import Link from "next/link";
import { RouteBrowser } from "@/modules/routes/RouteBrowser";
import { listRoutes } from "@/modules/routes/routes";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "เส้นทางปั่นจักรยานในอุบล พร้อม GPX",
  description: "คลังเส้นทางปั่นจักรยานทั่วอุบลราชธานี ดูแผนที่ ระยะทาง ความชัน รีวิว และดาวน์โหลด GPX ไปใช้กับไมล์จักรยาน",
  alternates: { canonical: "/routes" },
};

export default async function RoutesPage() {
  const routes = await listRoutes();
  return (
    <main className="wrap stack">
      <h1>เส้นทางปั่นจักรยานในอุบล</h1>
      <Link href="/routes/new" className="btn">
        + เพิ่มเส้นทาง (อัปโหลด GPX)
      </Link>
      <RouteBrowser routes={routes} />
    </main>
  );
}
