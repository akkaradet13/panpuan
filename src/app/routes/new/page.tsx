import type { Metadata } from "next";
import { RouteForm } from "@/modules/routes/RouteForm";

export const metadata: Metadata = {
  title: "เพิ่มเส้นทางปั่น",
  robots: { index: false },
};

export default function NewRoutePage() {
  return (
    <main className="wrap">
      <h1>เพิ่มเส้นทางปั่น</h1>
      <p className="muted">อัปโหลด GPX แล้วระบบคำนวณระยะทาง ความชัน และวาดแผนที่ให้เอง ใช้งานได้ทันที</p>
      <RouteForm />
    </main>
  );
}
