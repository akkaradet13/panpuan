import type { Metadata } from "next";
import { RideList } from "@/modules/rides/RideList";
import { listUpcomingRides } from "@/modules/rides/rides";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "ปฏิทินนัดปั่นจักรยานอุบล ทุกกลุ่ม",
  description: "ทริปปั่นจักรยานที่กำลังจะมาถึงของทุกกลุ่มในอุบลราชธานี ดูเวลา จุดนัด ความเร็ว แล้วลงชื่อไปด้วยได้เลย",
  alternates: { canonical: "/rides" },
};

export default async function RidesPage() {
  const rides = await listUpcomingRides();
  return (
    <main className="wrap stack">
      <h1>ปฏิทินนัดปั่นทุกกลุ่มในอุบล</h1>
      <p className="muted">อยากสร้างทริป? สร้างได้จากหน้ากลุ่มที่คุณเป็นแอดมิน</p>
      <RideList rides={rides} empty="ยังไม่มีทริปที่กำลังจะมาถึง ชวนกลุ่มของคุณมาลงทริปกัน 🚲" />
    </main>
  );
}
