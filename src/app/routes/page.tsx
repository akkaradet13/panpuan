import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/modules/core/Icon";
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
      <section className="card page-head">
        <div>
          <h1>คลังเส้นทางปั่นจักรยานอุบลราชธานี</h1>
          <p>ข้อมูลระยะทาง ความชัน พื้นผิว รีวิว และดาวน์โหลด GPX ฟรี</p>
        </div>
        <Link href="/routes/new" className="btn">
          <Icon name="upload" /> อัปโหลดเส้นทาง (.GPX)
        </Link>
      </section>
      <RouteBrowser routes={routes} />
    </main>
  );
}
