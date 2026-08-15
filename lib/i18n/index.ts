import type { LanguageCode } from "../types";
import en, { type Dictionary } from "./locales/en";
import ar from "./locales/ar";
import bn from "./locales/bn";

export const DICTIONARIES: Record<LanguageCode, Dictionary> = { en, ar, bn };

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: "English",
  ar: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629",
  bn: "\u09ac\u09be\u0982\u09b2\u09be",
};

const RTL_LANGUAGES: LanguageCode[] = ["ar"];
export function isRTL(lang: LanguageCode): boolean {
  return RTL_LANGUAGES.includes(lang);
}

function getByPath(dict: Dictionary, path: string): string {
  const parts = path.split(".");
  let cur: unknown = dict;
  for (const part of parts) {
    if (cur && typeof cur === "object" && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return path; // Surfaces the raw key in the UI rather than throwing — a missing
      // translation should be obvious and non-fatal, not a blank screen.
    }
  }
  return typeof cur === "string" ? cur : path;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

export type Translator = (path: string, vars?: Record<string, string | number>) => string;

export function createTranslator(lang: LanguageCode): Translator {
  const dict = DICTIONARIES[lang] ?? DICTIONARIES.en;
  return (path, vars) => interpolate(getByPath(dict, path), vars);
}

/**
 * Localized Hijri month names, in the same canonical order (Muharram → Dhu
 * al-Hijjah) as HIJRI_MONTH_NAMES in lib/hijri.ts. Kept here rather than in
 * that file so the calendar math stays free of UI/i18n concerns.
 */
export const HIJRI_MONTHS_LOCALIZED: Record<LanguageCode, string[]> = {
  en: ["Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani", "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qa'dah", "Dhu al-Hijjah"],
  ar: ["\u0645\u062d\u0631\u0645", "\u0635\u0641\u0631", "\u0631\u0628\u064a\u0639 \u0627\u0644\u0623\u0648\u0644", "\u0631\u0628\u064a\u0639 \u0627\u0644\u0622\u062e\u0631", "\u062c\u0645\u0627\u062f\u0649 \u0627\u0644\u0623\u0648\u0644\u0649", "\u062c\u0645\u0627\u062f\u0649 \u0627\u0644\u0622\u062e\u0631\u0629", "\u0631\u062c\u0628", "\u0634\u0639\u0628\u0627\u0646", "\u0631\u0645\u0636\u0627\u0646", "\u0634\u0648\u0627\u0644", "\u0630\u0648 \u0627\u0644\u0642\u0639\u062f\u0629", "\u0630\u0648 \u0627\u0644\u062d\u062c\u0629"],
  bn: ["\u09ae\u09c1\u09b9\u09be\u09b0\u09b0\u09ae", "\u09b8\u09ab\u09b0", "\u09b0\u09ac\u09bf\u0989\u09b2 \u0986\u0989\u09df\u09be\u09b2", "\u09b0\u09ac\u09bf\u0989\u09b8 \u09b8\u09be\u09a8\u09bf", "\u099c\u09ae\u09be\u09a6\u09bf\u0989\u09b2 \u0986\u0989\u09df\u09be\u09b2", "\u099c\u09ae\u09be\u09a6\u09bf\u0989\u09b8 \u09b8\u09be\u09a8\u09bf", "\u09b0\u099c\u09ac", "\u09b6\u09be\u09ac\u09be\u09a8", "\u09b0\u09ae\u099c\u09be\u09a8", "\u09b6\u09be\u0993\u09df\u09be\u09b2", "\u099c\u09bf\u09b2\u0995\u09a6", "\u099c\u09bf\u09b2\u09b9\u099c"],
};

export function hijriMonthNameLocalized(month: number, lang: LanguageCode): string {
  const names = HIJRI_MONTHS_LOCALIZED[lang] ?? HIJRI_MONTHS_LOCALIZED.en;
  return names[month - 1] ?? "";
}

/** BCP-47 tag for Intl.DateTimeFormat, forcing Latin digits even in ar/bn so
 *  clock and countdown numerals stay visually consistent with the
 *  .font-numeral tabular styling used throughout the dashboard. */
const INTL_LOCALES: Record<LanguageCode, string> = {
  en: "en-US",
  ar: "ar-u-nu-latn",
  bn: "bn-u-nu-latn",
};
export function intlLocale(lang: LanguageCode): string {
  return INTL_LOCALES[lang] ?? "en-US";
}
