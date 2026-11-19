"use client";

import { useEffect } from "react";

// Registers the single SW used by the PWA and FCM. Never asks for notification permission here.
export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/firebase-messaging-sw.js").catch(() => {});
    }
  }, []);
  return null;
}
