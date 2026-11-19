"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, signInWithGoogle, useAuth } from "./client-auth";

// Only allow same-site relative paths as ?next= to avoid open redirects.
function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/profile";
}

export function LoginPanel() {
  const user = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api("/api/me") // creates the users doc on first login
      .then(() => router.replace(nextPath()))
      .catch((e: Error) => setError(e.message));
  }, [user, router]);

  async function onClick() {
    setBusy(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setError("เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <button className="btn" onClick={onClick} disabled={busy || !!user}>
        {user ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบด้วย Google"}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
