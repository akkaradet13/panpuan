import type { Metadata } from "next";
import { ProfileForm } from "@/modules/core/ProfileForm";

export const metadata: Metadata = {
  title: "โปรไฟล์ของฉัน",
  robots: { index: false },
};

export default function ProfilePage() {
  return (
    <main className="wrap">
      <h1>โปรไฟล์ของฉัน</h1>
      <ProfileForm />
    </main>
  );
}
