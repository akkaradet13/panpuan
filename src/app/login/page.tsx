import type { Metadata } from "next";
import { LoginPanel } from "@/modules/core/LoginPanel";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <main className="wrap">
      <h1>เข้าสู่ระบบ</h1>
      <p className="muted">ลงชื่อร่วมทริป เข้ากลุ่มปั่น และรับเตือนก่อนออกปั่น</p>
      <LoginPanel />
    </main>
  );
}
