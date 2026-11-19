import type { Metadata } from "next";
import { AdminQueue } from "@/modules/core/AdminQueue";

export const metadata: Metadata = {
  title: "คิวยืนยัน",
  robots: { index: false },
};

export default function AdminPage() {
  return (
    <main className="wrap stack">
      <h1>คิวยืนยัน (super admin)</h1>
      <p className="muted">ยืนยันแล้วป้าย “ยังไม่ยืนยัน” หายไปและ Google เก็บหน้าได้ · ระงับแล้วหน้าเป็น 404 และแอดมินกลุ่มแก้อะไรไม่ได้</p>
      <AdminQueue />
    </main>
  );
}
