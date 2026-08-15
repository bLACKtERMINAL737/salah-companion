export type PrayerName = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";

export const OBLIGATORY_PRAYERS: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export interface PrayerWindow {
  name: PrayerName;
  start: Date;
  /** When this prayer's window ends (i.e. the next prayer/sunrise begins). */
  end: Date;
}

export type CalculationMethodKey =
  | "MuslimWorldLeague"
  | "Egyptian"
  | "Karachi"
  | "UmmAlQura"
  | "Dubai"
  | "MoonsightingCommittee"
  | "NorthAmerica"
  | "Kuwait"
  | "Qatar"
  | "Singapore"
  | "Tehran"
  | "Turkey";

export type MadhabKey = "shafi" | "hanafi";

export type ThemeMode = "light" | "dark";

export type LanguageCode = "en" | "ar" | "bn";

export interface GeoLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  /** IANA timezone, e.g. "Asia/Dhaka" */
  timezone?: string;
  source: "geolocation" | "manual" | "default";
}

export interface ReminderSettings {
  enabled: boolean;
  minutesBeforeEnd: 5 | 10 | 15;
}

export interface AzanSettings {
  enabled: boolean;
  volume: number; // 0..1
  voiceId: string;
  endingReminder: ReminderSettings;
}

export interface UserSettings {
  location: GeoLocation | null;
  calculationMethod: CalculationMethodKey;
  madhab: MadhabKey;
  theme: ThemeMode;
  language: LanguageCode;
  azan: AzanSettings;
  updatedAt?: number;
}

export const DEFAULT_SETTINGS: UserSettings = {
  location: null,
  calculationMethod: "MuslimWorldLeague",
  madhab: "shafi",
  theme: "dark",
  language: "en",
  azan: {
    enabled: true,
    volume: 0.8,
    voiceId: "makkah",
    endingReminder: { enabled: true, minutesBeforeEnd: 10 },
  },
};

export interface HijriDate {
  year: number;
  month: number; // 1-12
  day: number;
  monthName: string;
}

export interface IslamicEvent {
  id: string;
  hijriMonth: number;
  hijriDay: number;
  /** Resolved Gregorian date for the *next* upcoming occurrence. */
  gregorianDate: Date;
}

export interface Mosque {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  address?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export type FastingStatus = "fasted" | "missed" | "exempt";

/** Keyed by ISO date string ("YYYY-MM-DD") so it's stable across the whole
 *  Ramadan month regardless of which Hijri-year edge case applies. */
export type FastingLog = Record<string, FastingStatus>;
