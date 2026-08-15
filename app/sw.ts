import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

/**
 * ── Background prayer notifications ─────────────────────────────────────
 * A tab that's open can schedule its own setTimeout-based Azan (see
 * lib/notifications.ts) — but once the browser/tab is fully closed, only a
 * server-sent Web Push message can wake this service worker up. That push
 * has to come from somewhere: see functions/src/index.ts for a Firebase
 * Cloud Function reference implementation that computes each user's prayer
 * times server-side and sends one at the right moment.
 *
 * This handler is what turns that push into the actual notification the
 * user sees, and is safe to keep even before you wire up the server side —
 * it just won't receive anything until you do.
 */
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload: { title?: string; body?: string; icon?: string; url?: string; tag?: string };
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Salah Companion", body: event.data.text() };
  }

  const title = payload.title ?? "🕌 Salah Companion";
  const options: NotificationOptions = {
    body: payload.body ?? "It's time for prayer.",
    icon: payload.icon ?? "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: payload.tag ?? "salah-notification",
    data: { url: payload.url ?? "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
