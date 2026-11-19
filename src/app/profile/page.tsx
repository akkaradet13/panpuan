import type { Metadata } from "next";
import { AdminLink } from "@/modules/core/AdminLink";
import { CalendarLink } from "@/modules/core/CalendarLink";
import { ProfileForm } from "@/modules/core/ProfileForm";
import { NotifySettings } from "@/modules/notify/NotifySettings";

export const metadata: Metadata = {
  title: "โปรไฟล์ของฉัน",
  robots: { index: false },
};

export default function ProfilePage() {
  return (
    <main className="wrap stack">
      <h1>โปรไฟล์ของฉัน</h1>
      <AdminLink />
      <ProfileForm />
      <NotifySettings />
      <CalendarLink />
    </main>
  );
}
