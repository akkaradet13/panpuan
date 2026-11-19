import type { Metadata } from "next";
import { ClubForm } from "@/modules/core/ClubForm";

export const metadata: Metadata = {
  title: "สร้างกลุ่มปั่น",
  robots: { index: false },
};

export default function NewClubPage() {
  return (
    <main className="wrap narrow">
      <h1>สร้างกลุ่มปั่น</h1>
      <p className="muted">สร้างแล้วใช้งานได้ทันที คุณจะเป็นแอดมินคนแรกของกลุ่ม</p>
      <ClubForm />
    </main>
  );
}
