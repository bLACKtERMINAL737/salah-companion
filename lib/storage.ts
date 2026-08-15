import type { ChatMessage, FastingLog, UserSettings } from "./types";

/**
 * Local persistence for everything that doesn't need an account. This is
 * the app's source of truth by default; SettingsContext layers Firestore
 * sync on top of `settings` specifically when someone is signed in, but
 * fasting log and chat history stay device-local either way (there's no
 * strong need to sync a personal fasting tally across devices, and keeping
 * chat history local avoids growing a Firestore doc unbounded).
 */

const KEYS = {
  settings: "salah-companion:settings",
  fastingLog: "salah-companion:fasting-log",
  chatHistory: "salah-companion:chat-history",
} as const;

function readJSON<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable (e.g. private browsing) — the app keeps
    // working for the session, it just won't remember state on reload.
  }
}

export function loadSettings(): UserSettings | null {
  return readJSON<UserSettings>(KEYS.settings);
}
export function saveSettings(settings: UserSettings): void {
  writeJSON(KEYS.settings, settings);
}

export function loadFastingLog(): FastingLog {
  return readJSON<FastingLog>(KEYS.fastingLog) ?? {};
}
export function saveFastingLog(log: FastingLog): void {
  writeJSON(KEYS.fastingLog, log);
}

export function loadChatHistory(): ChatMessage[] {
  return readJSON<ChatMessage[]>(KEYS.chatHistory) ?? [];
}
export function saveChatHistory(messages: ChatMessage[]): void {
  writeJSON(KEYS.chatHistory, messages);
}
export function clearChatHistory(): void {
  writeJSON(KEYS.chatHistory, []);
}

/** YYYY-MM-DD in the *device's* local time — the key shape FastingLog uses. */
export function isoDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
