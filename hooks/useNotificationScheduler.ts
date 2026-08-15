"use client";

import { useEffect, useRef } from "react";
import { usePrayerData } from "./usePrayerData";
import { useSettings } from "../context/SettingsContext";
import { getNotificationPermission, showLocalNotification } from "../lib/notifications";
import { playAzan } from "../lib/azan";
import { isDateWithinRamadan } from "../lib/islamicEvents";

/**
 * Watches the live prayer-window state and fires:
 *  1. The Azan (sound + notification) the moment a window begins.
 *  2. The configurable "window ending soon" reminder.
 * During Ramadan these two mechanisms already cover Suhoor/Iftar for free:
 * Isha's window is defined to end at the next Fajr, so the ending-reminder
 * firing on Isha *is* the Suhoor warning, and the Maghrib Azan *is* Iftar —
 * both just get Ramadan-aware copy instead of a second parallel scheduler.
 *
 * Scope: this only fires while a tab/window has this hook mounted. See
 * app/sw.ts's `push` handler and functions/src/index.ts for what real
 * background delivery (tab fully closed) requires.
 */
export function useNotificationScheduler(): void {
  const { current, now } = usePrayerData();
  const { settings, t } = useSettings();
  const firedAzanFor = useRef<string | null>(null);
  const firedReminderFor = useRef<string | null>(null);

  useEffect(() => {
    if (!current) return;
    const windowKey = `${current.name}:${current.start.getTime()}`;
    const ramadan = isDateWithinRamadan(now);

    const msSinceStart = now.getTime() - current.start.getTime();
    if (msSinceStart >= 0 && msSinceStart < 2000 && firedAzanFor.current !== windowKey) {
      firedAzanFor.current = windowKey;
      if (settings.azan.enabled) void playAzan(settings.azan.voiceId, settings.azan.volume);
      if (getNotificationPermission() === "granted") {
        const isIftar = ramadan && current.name === "maghrib";
        const title = isIftar ? t("notifications.iftarTime") : t("notifications.azanTitle", { prayer: t(`prayer.${current.name}`) });
        void showLocalNotification(title, { tag: "salah-azan" });
      }
    }

    if (settings.azan.endingReminder.enabled) {
      const msUntilEnd = current.end.getTime() - now.getTime();
      const thresholdMs = settings.azan.endingReminder.minutesBeforeEnd * 60_000;
      if (msUntilEnd > 0 && msUntilEnd <= thresholdMs && firedReminderFor.current !== windowKey) {
        firedReminderFor.current = windowKey;
        if (getNotificationPermission() === "granted") {
          const isSuhoor = ramadan && current.name === "isha";
          const title = isSuhoor
            ? t("notifications.suhoorEnding", { minutes: settings.azan.endingReminder.minutesBeforeEnd })
            : t("notifications.windowEnding", { prayer: t(`prayer.${current.name}`), minutes: settings.azan.endingReminder.minutesBeforeEnd });
          void showLocalNotification(title, { tag: "salah-reminder" });
        }
      }
    }
  }, [current, now, settings.azan, t]);
}
