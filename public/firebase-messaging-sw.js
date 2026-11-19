// Service worker for both the PWA and FCM. Deliberately does NOT load the Firebase SDK:
// the server sends data-only messages {title, body, url, tag} and we display them here.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    const payload = event.data ? event.data.json() : {};
    data = payload.data || payload;
  } catch {
    // ignore malformed payloads
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "PanPuan", {
      body: data.body || "",
      tag: data.tag, // "ride-{ride_id}" so updates for one ride replace each other
      icon: "/icon-192.png",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      const same = wins.find((w) => w.url === url);
      if (same) return same.focus();
      return self.clients.openWindow(url);
    }),
  );
});
