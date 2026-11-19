"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/modules/core/client-auth";
import { currentDeviceId, enablePush, registerToken, type EnableResult } from "./client";

type State = "idle" | "busy" | "error" | EnableResult;

/** "Turn on notifications" button. Never prompts on its own — only when tapped. */
export function EnableNotifications() {
  const user = useAuth();
  const [state, setState] = useState<State>("idle");

  // Already granted on this device: refresh the token quietly (tokens rotate).
  useEffect(() => {
    if (!user || typeof Notification === "undefined" || Notification.permission !== "granted" || !currentDeviceId()) return;
    registerToken().then(
      () => setState("enabled"),
      () => {},
    );
  }, [user]);

  if (user === undefined) return null;
  if (user === null) return <Link href="/login?next=/install">เข้าสู่ระบบก่อนเปิดแจ้งเตือน →</Link>;

  async function onClick() {
    setState("busy");
    try {
      setState(await enablePush());
    } catch (e) {
      console.error(e);
      setState("error");
    }
  }

  switch (state) {
    case "enabled":
      return <p className="badge badge-ok">🔔 เปิดแจ้งเตือนบนเครื่องนี้แล้ว</p>;
    case "needs-install":
      return (
        <p>
          บน iPhone ต้องเพิ่มแอปลงหน้าจอโฮมก่อนถึงจะรับแจ้งเตือนได้ <Link href="/install">ดูวิธี (1 นาที) →</Link>
        </p>
      );
    case "denied":
      return <p className="muted">เครื่องนี้ปิดการแจ้งเตือนของเว็บไว้ เปิดได้ในการตั้งค่าของเบราว์เซอร์</p>;
    case "unsupported":
      return <p className="muted">เบราว์เซอร์นี้รับแจ้งเตือนไม่ได้ ลองเปิดด้วย Chrome หรือ Safari</p>;
    default:
      return (
        <div className="row">
          <button className="btn btn-small" onClick={onClick} disabled={state === "busy"}>
            🔔 เปิดแจ้งเตือน
          </button>
          {state === "error" && <span className="error">เปิดไม่สำเร็จ ลองใหม่อีกครั้ง</span>}
        </div>
      );
  }
}
