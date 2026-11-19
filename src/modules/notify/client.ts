"use client";

import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { api } from "@/modules/core/client-auth";
import { app } from "@/modules/core/firebase/client";

export const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const isStandalone = () =>
  matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const platform = () => (isIos() ? "ios" : /android/i.test(navigator.userAgent) ? "android" : "desktop");

const KEY = "pp_device_id";
export function currentDeviceId() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
function ensureDeviceId() {
  let id = currentDeviceId();
  if (!id) {
    id = crypto.randomUUID().replace(/-/g, "");
    try {
      localStorage.setItem(KEY, id);
    } catch {}
  }
  return id;
}

/** Gets this device's FCM token via our own SW (no VAPID key of our own: the SDK uses Firebase's default) and saves it. */
export async function registerToken() {
  const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  await navigator.serviceWorker.ready;
  const token = await getToken(getMessaging(app), { serviceWorkerRegistration: reg });
  await api("/api/notify/devices", { method: "POST", body: JSON.stringify({ device_id: ensureDeviceId(), token, platform: platform() }) });
}

export type EnableResult = "enabled" | "denied" | "unsupported" | "needs-install";

/** Call only from a click handler: iOS rejects permission prompts that are not user gestures. */
export async function enablePush(): Promise<EnableResult> {
  if (isIos() && !isStandalone()) return "needs-install";
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !(await isSupported())) return "unsupported";
  if ((await Notification.requestPermission()) !== "granted") return "denied";
  await registerToken();
  return "enabled";
}
