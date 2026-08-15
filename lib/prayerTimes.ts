import { CalculationMethod, Coordinates, Madhab, PrayerTimes, Qibla } from "adhan";
import type { CalculationMethodKey, GeoLocation, MadhabKey, PrayerName, PrayerWindow, UserSettings } from "./types";
import { OBLIGATORY_PRAYERS } from "./types";

/**
 * All prayer-time math runs client-side via `adhan` (a JS port of the
 * well-known PrayTimes.org astronomical formulas) rather than a live API
 * call. That was a deliberate choice, not just a convenience: it means the
 * dashboard keeps working offline — which the PWA is required to support —
 * and there's no per-request quota or key to manage for the app's single
 * most-used feature.
 */

function buildCalculationParameters(settings: Pick<UserSettings, "calculationMethod" | "madhab">) {
  const params = CalculationMethod[settings.calculationMethod]();
  params.madhab = settings.madhab === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  return params;
}

export function getPrayerTimesForDate(location: GeoLocation, date: Date, settings: Pick<UserSettings, "calculationMethod" | "madhab">): PrayerTimes {
  const coordinates = new Coordinates(location.latitude, location.longitude);
  const params = buildCalculationParameters(settings);
  return new PrayerTimes(coordinates, date, params);
}

/** Ordered Fajr→Isha windows (start = this prayer's adhan, end = the next event, e.g. sunrise for Fajr). */
export function getPrayerWindows(location: GeoLocation, date: Date, settings: Pick<UserSettings, "calculationMethod" | "madhab">): PrayerWindow[] {
  const today = getPrayerTimesForDate(location, date, settings);
  const tomorrow = getPrayerTimesForDate(location, new Date(date.getTime() + 86_400_000), settings);

  const bounds: Record<PrayerName, Date> = {
    fajr: today.fajr,
    sunrise: today.sunrise,
    dhuhr: today.dhuhr,
    asr: today.asr,
    maghrib: today.maghrib,
    isha: today.isha,
  };

  return OBLIGATORY_PRAYERS.map((name, i) => {
    const start = bounds[name];
    let end: Date;
    if (name === "fajr") end = bounds.sunrise;
    else if (name === "isha") end = tomorrow.fajr;
    else {
      const nextName = OBLIGATORY_PRAYERS[i + 1];
      end = nextName ? bounds[nextName] : tomorrow.fajr;
    }
    return { name, start, end };
  });
}

export function getCurrentAndNextPrayer(location: GeoLocation, settings: Pick<UserSettings, "calculationMethod" | "madhab">, now: Date = new Date()) {
  const times = getPrayerTimesForDate(location, now, settings);
  const current = times.currentPrayer(now);
  const next = times.nextPrayer(now);

  // adhan's nextPrayer() returns "none" after Isha until midnight; roll to
  // tomorrow's Fajr so the countdown never goes blank at night.
  if (next === "none") {
    const tomorrow = getPrayerTimesForDate(location, new Date(now.getTime() + 86_400_000), settings);
    return { current, next: "fajr" as PrayerName, nextTime: tomorrow.fajr };
  }

  const nextTime = times.timeForPrayer(next as PrayerName) ?? undefined;
  return { current: current as PrayerName | "none", next: next as PrayerName, nextTime: nextTime as Date };
}

export function getQiblaBearing(location: GeoLocation): number {
  return Qibla(new Coordinates(location.latitude, location.longitude));
}

export const CALCULATION_METHOD_LABELS: Record<CalculationMethodKey, string> = {
  MuslimWorldLeague: "Muslim World League",
  Egyptian: "Egyptian General Authority",
  Karachi: "University of Islamic Sciences, Karachi",
  UmmAlQura: "Umm Al-Qura, Makkah",
  Dubai: "Dubai (UAE)",
  MoonsightingCommittee: "Moonsighting Committee Worldwide",
  NorthAmerica: "Islamic Society of North America",
  Kuwait: "Kuwait",
  Qatar: "Qatar",
  Singapore: "Majlis Ugama Islam Singapura",
  Tehran: "University of Tehran",
  Turkey: "Diyanet (Turkey)",
};

export const MADHAB_LABELS: Record<MadhabKey, string> = {
  shafi: "Shafi\u2019i, Maliki, Hanbali (standard Asr)",
  hanafi: "Hanafi (later Asr)",
};

export function formatCountdown(msRemaining: number): string {
  const clamped = Math.max(0, msRemaining);
  const totalSeconds = Math.floor(clamped / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function formatClock(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(date);
}
