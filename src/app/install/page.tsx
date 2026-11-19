import type { Metadata } from "next";
import { EnableNotifications } from "@/modules/notify/EnableNotifications";
import { InstallPrompt } from "@/modules/notify/InstallPrompt";

export const metadata: Metadata = {
  title: "ติดตั้งแอปและเปิดแจ้งเตือน",
  description: "วิธีเพิ่ม PanPuan ลงหน้าจอโฮมบน iPhone และ Android เพื่อรับแจ้งเตือนก่อนออกปั่น",
  alternates: { canonical: "/install" },
};

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="card step">
      <span className="step-n">{n}</span>
      <div>
        <strong>{title}</strong>
        {children}
      </div>
    </li>
  );
}

// Simple drawn illustrations of Safari's controls (iOS 16.4+ needs "Add to Home Screen" before web push works).
const ShareIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" className="ios-icon">
    <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 11H5v10h14V11h-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);
const AddIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" className="ios-icon">
    <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function InstallPage() {
  return (
    <main className="wrap stack">
      <h1>ติดตั้งแอปและเปิดแจ้งเตือน</h1>
      <p className="muted">ติดตั้งแล้วเปิดได้จากหน้าจอโฮมเหมือนแอปทั่วไป และรับแจ้งเตือนก่อนออกปั่นหรือเมื่อทริปเลื่อน/ยกเลิก</p>

      <section className="stack">
        <h2>iPhone / iPad (iOS 16.4 ขึ้นไป)</h2>
        <ol className="steps">
          <Step n={1} title="เปิดเว็บนี้ด้วย Safari">
            <p className="muted">ถ้าเปิดจาก LINE หรือ Facebook ให้กด ••• แล้วเลือก “เปิดใน Safari” ก่อน</p>
          </Step>
          <Step n={2} title="กดปุ่มแชร์">
            <p className="row">
              <ShareIcon /> ปุ่มสี่เหลี่ยมมีลูกศรชี้ขึ้น อยู่แถบล่างของ Safari
            </p>
          </Step>
          <Step n={3} title="เลือก “เพิ่มไปยังหน้าจอโฮม”">
            <p className="row">
              <AddIcon /> เลื่อนรายการลงมาหา แล้วกด “เพิ่ม” มุมขวาบน
            </p>
          </Step>
          <Step n={4} title="เปิด PanPuan จากไอคอนบนหน้าจอโฮม">
            <p className="muted">ต้องเปิดจากไอคอนเท่านั้น iPhone ถึงจะยอมให้รับแจ้งเตือน</p>
          </Step>
          <Step n={5} title="เข้าสู่ระบบ แล้วกดเปิดแจ้งเตือน">
            <p className="muted">กด “อนุญาต” เมื่อ iPhone ถาม</p>
          </Step>
        </ol>
      </section>

      <section className="stack">
        <h2>Android / คอมพิวเตอร์</h2>
        <p>กดปุ่มด้านล่าง หรือเมนู ⋮ ของ Chrome แล้วเลือก “ติดตั้งแอป”</p>
        <InstallPrompt />
      </section>

      <section className="stack">
        <h2>เปิดแจ้งเตือนบนเครื่องนี้</h2>
        <EnableNotifications />
      </section>
    </main>
  );
}
