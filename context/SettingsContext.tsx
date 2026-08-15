"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DEFAULT_SETTINGS, type UserSettings } from "../lib/types";
import { loadSettings, saveSettings } from "../lib/storage";
import { createTranslator, isRTL, type Translator } from "../lib/i18n";
import { pushSettingsToCloud, watchCloudSettings } from "../lib/firebase";
import { useAuth } from "./AuthContext";

interface SettingsContextValue {
  settings: UserSettings;
  /** Shallow-merges into the current settings, persists locally, and (if
   *  signed in) pushes the merged result to Firestore. */
  updateSettings: (patch: Partial<UserSettings>) => void;
  t: Translator;
  dir: "ltr" | "rtl";
  hydrated: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const { user } = useAuth();
  // Distinguishes "cloud pushed this update" from "local action pushed it",
  // so the cloud listener below doesn't immediately re-save what it just
  // received and fight the debounce with itself.
  const applyingRemote = useRef(false);

  useEffect(() => {
    const saved = loadSettings();
    if (saved) setSettings((prev) => ({ ...prev, ...saved, azan: { ...prev.azan, ...saved.azan } }));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveSettings(settings);
  }, [settings, hydrated]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", settings.theme === "dark");
    root.lang = settings.language;
    root.dir = isRTL(settings.language) ? "rtl" : "ltr";
  }, [settings.theme, settings.language]);

  // On sign-in, adopt whatever's saved in the cloud (if anything) so a
  // second device picks up existing preferences instead of overwriting them
  // with local defaults.
  useEffect(() => {
    if (!user) return;
    const unsubscribe = watchCloudSettings(user.uid, (cloud) => {
      if (!cloud) return;
      applyingRemote.current = true;
      setSettings((prev) => ({ ...prev, ...cloud, azan: { ...prev.azan, ...cloud.azan } }));
    });
    return unsubscribe;
  }, [user]);

  const updateSettings = useCallback(
    (patch: Partial<UserSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        if (user && !applyingRemote.current) void pushSettingsToCloud(user.uid, next);
        applyingRemote.current = false;
        return next;
      });
    },
    [user]
  );

  const t = useMemo(() => createTranslator(settings.language), [settings.language]);
  const dir = isRTL(settings.language) ? "rtl" : "ltr";

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, updateSettings, t, dir, hydrated }),
    [settings, updateSettings, t, dir, hydrated]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within <SettingsProvider>");
  return ctx;
}
