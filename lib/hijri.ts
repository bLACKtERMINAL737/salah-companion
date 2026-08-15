import type { HijriDate } from "./types";

/**
 * Tabular ("arithmetic") Hijri calendar conversion. This is a calculated
 * calendar, not a moon-sighting one — real-world observance of a new month
 * (and therefore Ramadan, Eid, etc.) is announced locally and can land a day
 * either side of what's computed here. Every place this is surfaced in the
 * UI should keep that caveat visible; see the HijriDateCard component.
 */

const HIJRI_MONTH_NAMES = [
  "Muharram",
  "Safar",
  "Rabi\u2019 al-Awwal",
  "Rabi\u2019 al-Thani",
  "Jumada al-Awwal",
  "Jumada al-Thani",
  "Rajab",
  "Sha\u2019ban",
  "Ramadan",
  "Shawwal",
  "Dhu al-Qa\u2019dah",
  "Dhu al-Hijjah",
] as const;

function gregorianToJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

function jdnToHijri(jdnInput: number): { year: number; month: number; day: number } {
  let jd = jdnInput - 1948440 + 10632;
  const n = Math.floor((jd - 1) / 10631);
  jd = jd - 10631 * n + 354;
  const j = Math.floor((10985 - jd) / 5316) * Math.floor((50 * jd) / 17719) + Math.floor(jd / 5670) * Math.floor((43 * jd) / 15238);
  jd = jd - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * jd) / 709);
  const day = jd - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { year, month, day };
}

function hijriToJDN(year: number, month: number, day: number): number {
  return day + Math.ceil(29.5 * (month - 1)) + (year - 1) * 354 + Math.floor((3 + 11 * year) / 30) + 1948440 - 1;
}

export function gregorianToHijri(date: Date): HijriDate {
  const jdn = gregorianToJDN(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const { year, month, day } = jdnToHijri(jdn);
  return { year, month, day, monthName: HIJRI_MONTH_NAMES[month - 1] ?? "" };
}

export function hijriToGregorian(year: number, month: number, day: number): Date {
  const jdn = hijriToJDN(year, month, day);
  const { year: gy, month: gm, day: gd } = jdnToGregorian(jdn);
  return new Date(gy, gm - 1, gd);
}

export function hijriMonthName(month: number, locale: "en" | "ar" | "bn" = "en"): string {
  if (locale === "en") return HIJRI_MONTH_NAMES[month - 1] ?? "";
  // Arabic/Bangla month names are looked up from the i18n dictionaries at
  // call sites that already have `t()` in scope; this default covers
  // anywhere the calendar lib is used standalone (e.g. notifications).
  return HIJRI_MONTH_NAMES[month - 1] ?? "";
}

/** Gregorian date of day 1 of a given Hijri month/year — used to build the
 *  Islamic-events list and the Ramadan countdown. */
export function firstDayOfHijriMonth(hijriYear: number, hijriMonth: number): Date {
  return hijriToGregorian(hijriYear, hijriMonth, 1);
}

export { HIJRI_MONTH_NAMES };
