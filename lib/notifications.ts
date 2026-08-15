export type NotificationPermissionState = "granted" | "denied" | "default" | "unsupported";

export function getNotificationSupport(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!getNotificationSupport()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!getNotificationSupport()) return "unsupported";
  const result = await Notification.requestPermission();
  return result;
}

/**
 * Shows a notification via the service worker registration rather than
 * `new Notification()` directly. Chrome on Android throws on the bare
 * constructor and requires this path, so it's the one pattern that works
 * everywhere the app targets (Mac/Safari, iOS 16.4+ home-screen PWAs,
 * Android Chrome, desktop Chrome/Edge/Firefox).
 */
export async function showLocalNotification(title: string, options: NotificationOptions & { url?: string } = {}): Promise<void> {
  if (getNotificationPermission() !== "granted") return;
  const { url, ...rest } = options;

  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready.catch(() => null);
    if (registration) {
      await registration.showNotification(title, { icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", data: { url }, ...rest });
      return;
    }
  }
  // Fallback for browsers/dev environments without an active service worker.
  try {
    new Notification(title, { icon: "/icons/icon-192.png", ...rest });
  } catch {
    /* no-op — notifications simply won't show */
  }
}
