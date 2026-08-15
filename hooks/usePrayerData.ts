"use client";

import { useMemo } from "react";
import { useNow } from "./useNow";
import { useSettings } from "../context/SettingsContext";
import { getPrayerWindows } from "../lib/prayerTimes";
import { DEFAULT_LOCATION } from "../lib/geocoding";
import type { GeoLocation, PrayerWindow } from "../lib/types";

export interface PrayerData {
  now: Date;
  location: GeoLocation;
  /** Today's five obligatory-prayer windows, Fajr → Isha, for list views. */
  todayWindows: PrayerWindow[];
  /** The window `now` currently falls inside, if any. Correctly spans
   *  midnight — e.g. it's still "Isha" at 2am until tomorrow's Fajr. */
  current: PrayerWindow | null;
  /** The next prayer to start, rolling into tomorrow's Fajr after Isha. */
  next: PrayerWindow;
  msRemaining: number;
}

const DAY_MS = 86_400_000;

export function usePrayerData(): PrayerData {
  const now = useNow(1000);
  const { settings } = useSettings();
  const location = settings.location ?? DEFAULT_LOCATION;
  const dayKey = now.toDateString();
  const params = { calculationMethod: settings.calculationMethod, madhab: settings.madhab };

  // Recomputed once per calendar day (or when location/method changes) —
  // the astronomical math itself is cheap, but there's no reason to redo it
  // every second when only `now`'s clock face is ticking.
  const { todayWindows, spanningWindows } = useMemo(() => {
    const today = getPrayerWindows(location, now, params);
    // Yesterday's Isha and tomorrow's Fajr are needed too so "current"/"next"
    // resolve correctly overnight and in the pre-Fajr hours, when the
    // relevant window doesn't start on today's calendar date at all.
    const yesterday = getPrayerWindows(location, new Date(now.getTime() - DAY_MS), params);
    const tomorrow = getPrayerWindows(location, new Date(now.getTime() + DAY_MS), params);
    return { todayWindows: today, spanningWindows: [...yesterday, ...today, ...tomorrow] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.latitude, location.longitude, params.calculationMethod, params.madhab, dayKey]);

  const { current, next } = useMemo(() => {
    const nowMs = now.getTime();
    const current = spanningWindows.find((w) => nowMs >= w.start.getTime() && nowMs < w.end.getTime()) ?? null;
    const upcoming = spanningWindows
      .filter((w) => w.start.getTime() > nowMs)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    const next = upcoming[0] ?? spanningWindows[spanningWindows.length - 1]!;
    return { current, next };
  }, [spanningWindows, now]);

  const msRemaining = next.start.getTime() - now.getTime();

  return { now, location, todayWindows, current, next, msRemaining };
}
