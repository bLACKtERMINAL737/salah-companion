import { doc, setDoc } from "firebase/firestore";
import { getFirebaseApp, getFirebaseDb, isFirebaseConfigured } from "./firebase";

/**
 * Registers this browser for background push notifications (the path that
 * lets the Azan/reminder arrive even with the tab fully closed — see
 * app/sw.ts's `push` handler and functions/src/index.ts for the sending
 * side). Call this after the service worker is ready and the user has
 * granted Notification permission; safe to call repeatedly.
 *
 * Requires NEXT_PUBLIC_FIREBASE_VAPID_KEY (Firebase Console → Project
 * settings → Cloud Messaging → Web configuration → Generate key pair).
 */
export async function registerForPushNotifications(uid: string): Promise<string | null> {
  if (!isFirebaseConfigured() || typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) return null;

  try {
    const { getMessaging, getToken } = await import("firebase/messaging");
    const app = getFirebaseApp();
    if (!app) return null;

    const registration = await navigator.serviceWorker.ready;
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (!token) return null;

    const db = getFirebaseDb();
    if (db) {
      await setDoc(doc(db, "users", uid), { pushToken: token, pushTokenUpdatedAt: Date.now() }, { merge: true });
    }
    return token;
  } catch {
    // Most likely: permission not granted yet, or messaging isn't
    // supported in this browser (e.g. Firefox's support has gaps). The
    // foreground scheduler in hooks/useNotificationScheduler.ts still
    // works regardless.
    return null;
  }
}
