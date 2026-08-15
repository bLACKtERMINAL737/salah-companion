/**
 * This is the piece that makes the Azan arrive with the app fully closed.
 * A browser tab can schedule its own in-page reminders (see
 * hooks/useNotificationScheduler.ts) but that only runs while something is
 * open — there's no way for client JS to wake itself up an hour later with
 * the tab closed. A server has to push the message instead. This function:
 *
 *   1. Runs on a schedule (every minute — see the trade-off note below).
 *   2. For each user with notifications enabled and a saved push token,
 *      computes today's prayer times *server-side*, from their saved
 *      location/method/madhab (the same `adhan` library the client uses).
 *   3. If "now" falls within a minute of a prayer starting, sends one FCM
 *      data message and records that it did, so it doesn't repeat.
 *
 * Cost/latency trade-off: "every minute" is the finest granularity Cloud
 * Scheduler supports, and keeps notifications accurate to ~60s. That's 1,440
 * invocations/day reading every enabled user's doc — completely fine for a
 * personal or small-scale deployment on Firebase's free/Blaze pay-as-you-go
 * tier, but at real scale you'd want to shard users across staggered
 * schedules (e.g. by timezone) rather than scan everyone every minute.
 */
import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { Coordinates, CalculationMethod, Madhab, PrayerTimes } from "adhan";

initializeApp();
const db = getFirestore();

const PRAYER_ORDER = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
type PrayerName = (typeof PRAYER_ORDER)[number];

const METHOD_FACTORIES: Record<string, () => ReturnType<typeof CalculationMethod.MuslimWorldLeague>> = {
  MuslimWorldLeague: CalculationMethod.MuslimWorldLeague,
  Egyptian: CalculationMethod.Egyptian,
  Karachi: CalculationMethod.Karachi,
  UmmAlQura: CalculationMethod.UmmAlQura,
  Dubai: CalculationMethod.Dubai,
  MoonsightingCommittee: CalculationMethod.MoonsightingCommittee,
  NorthAmerica: CalculationMethod.NorthAmerica,
  Kuwait: CalculationMethod.Kuwait,
  Qatar: CalculationMethod.Qatar,
  Singapore: CalculationMethod.Singapore,
  Tehran: CalculationMethod.Tehran,
  Turkey: CalculationMethod.Turkey,
};

const AZAN_TITLES: Record<"en" | "ar" | "bn", (prayer: string) => string> = {
  en: (p) => `\ud83d\udd4c It is time for ${p} Salah`,
  ar: (p) => `\ud83d\udd4c \u062d\u0627\u0646 \u0648\u0642\u062a \u0635\u0644\u0627\u0629 ${p}`,
  bn: (p) => `\ud83d\udd4c ${p} \u09a8\u09be\u09ae\u09be\u099c\u09c7\u09b0 \u09b8\u09ae\u09df \u09b9\u09df\u09c7\u099b\u09c7`,
};

const PRAYER_NAMES: Record<"en" | "ar" | "bn", Record<PrayerName, string>> = {
  en: { fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha" },
  ar: { fajr: "\u0627\u0644\u0641\u062c\u0631", dhuhr: "\u0627\u0644\u0638\u0647\u0631", asr: "\u0627\u0644\u0639\u0635\u0631", maghrib: "\u0627\u0644\u0645\u063a\u0631\u0628", isha: "\u0627\u0644\u0639\u0634\u0627\u0621" },
  bn: { fajr: "\u09ab\u099c\u09b0", dhuhr: "\u09af\u09cb\u09b9\u09b0", asr: "\u0986\u09b8\u09b0", maghrib: "\u09ae\u09be\u0997\u09b0\u09bf\u09ac", isha: "\u098f\u09b6\u09be" },
};

interface StoredUser {
  pushToken?: string;
  location?: { latitude: number; longitude: number };
  calculationMethod?: string;
  madhab?: "shafi" | "hanafi";
  language?: "en" | "ar" | "bn";
  azan?: { enabled?: boolean };
  lastNotifiedKey?: string;
}

export const sendPrayerNotifications = onSchedule({ schedule: "every 1 minutes", timeZone: "Etc/UTC" }, async () => {
  // NOTE: for many more users than a single query page comfortably holds,
  // paginate this with .limit()/.startAfter() instead of one big get().
  const usersSnap = await db.collection("users").where("azan.enabled", "==", true).get();
  if (usersSnap.empty) return;

  const now = new Date();
  const messaging = getMessaging();
  const writes: Promise<unknown>[] = [];

  for (const docSnap of usersSnap.docs) {
    const user = docSnap.data() as StoredUser;
    if (!user.pushToken || !user.location) continue;

    const methodFactory = METHOD_FACTORIES[user.calculationMethod ?? "MuslimWorldLeague"] ?? CalculationMethod.MuslimWorldLeague;
    const params = methodFactory();
    params.madhab = user.madhab === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;

    const coordinates = new Coordinates(user.location.latitude, user.location.longitude);
    const times = new PrayerTimes(coordinates, now, params);
    const lang = user.language ?? "en";

    for (const name of PRAYER_ORDER) {
      const start: Date = times[name];
      const msSinceStart = now.getTime() - start.getTime();
      const key = `${name}:${start.toISOString()}`;
      if (msSinceStart < 0 || msSinceStart >= 60_000 || user.lastNotifiedKey === key) continue;

      const prayerLabel = PRAYER_NAMES[lang][name];
      writes.push(
        messaging
          .send({
            token: user.pushToken,
            // Data-only (no top-level `notification`) so this arrives as a
            // plain `push` event that app/sw.ts builds the notification
            // from itself, matching how it already handles local scheduling.
            data: {
              title: AZAN_TITLES[lang](prayerLabel),
              body: "Salah Companion",
              icon: "/icons/icon-192.png",
              url: "/",
              tag: "salah-azan",
            },
          })
          .then(() => docSnap.ref.update({ lastNotifiedKey: key }))
          .catch((err: unknown) => console.error(`Push failed for user ${docSnap.id}:`, err))
      );
    }
  }

  await Promise.all(writes);
});
