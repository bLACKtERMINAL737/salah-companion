"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MapPin, LocateFixed, Volume2, Bell, Palette, User as UserIcon, BellRing } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../context/AuthContext";
import { GlassCard, Button } from "../../components/ui/Primitives";
import { detectBrowserLocation, searchCities, type CitySearchResult } from "../../lib/geocoding";
import { CALCULATION_METHOD_LABELS, MADHAB_LABELS } from "../../lib/prayerTimes";
import { AZAN_VOICES, previewAzan } from "../../lib/azan";
import { signOutUser } from "../../lib/firebase";
import { requestNotificationPermission } from "../../lib/notifications";
import { registerForPushNotifications } from "../../lib/push";
import { LANGUAGE_LABELS } from "../../lib/i18n";
import type { CalculationMethodKey, MadhabKey, LanguageCode } from "../../lib/types";
import { cn } from "../../lib/utils";

export default function SettingsPage() {
  const { settings, updateSettings, t } = useSettings();
  const { user, configured } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [pushStatus, setPushStatus] = useState<"idle" | "requesting" | "enabled" | "unavailable">("idle");

  async function handleEnableBackgroundPush() {
    setPushStatus("requesting");
    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
      setPushStatus("unavailable");
      return;
    }
    if (user) {
      const token = await registerForPushNotifications(user.uid);
      setPushStatus(token ? "enabled" : "unavailable");
    } else {
      // Permission granted, but background delivery needs an account so the
      // Cloud Function has somewhere to look up this device's push token.
      setPushStatus("unavailable");
    }
  }

  useEffect(() => {
    const id = setTimeout(() => {
      if (query.trim().length >= 2) void searchCities(query).then(setResults);
      else setResults([]);
    }, 350);
    return () => clearTimeout(id);
  }, [query]);

  async function handleDetect() {
    setDetecting(true);
    const loc = await detectBrowserLocation();
    if (loc) updateSettings({ location: loc });
    setDetecting(false);
  }

  function selectCity(city: CitySearchResult) {
    updateSettings({
      location: { latitude: city.latitude, longitude: city.longitude, city: city.name, country: city.country, timezone: city.timezone, source: "manual" },
    });
    setQuery("");
    setResults([]);
  }

  return (
    <div className="space-y-6 pb-4">
      <h1 className="font-display text-2xl text-[var(--text-primary)]">{t("settingsPage.title")}</h1>

      <Section icon={MapPin} title={t("settingsPage.location")}>
        {settings.location && (
          <p className="mb-3 text-sm text-[var(--text-secondary)]">
            {settings.location.city
              ? `${settings.location.city}${settings.location.country ? `, ${settings.location.country}` : ""}`
              : `${settings.location.latitude.toFixed(2)}, ${settings.location.longitude.toFixed(2)}`}
          </p>
        )}
        <Button variant="outline" onClick={handleDetect} disabled={detecting} icon={<LocateFixed size={15} />}>
          {t("settingsPage.autoDetect")}
        </Button>
        <div className="relative mt-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("settingsPage.searchCity")}
            className="w-full rounded-xl border border-[var(--surface-glass-border)] bg-transparent px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--gold)]"
          />
          {results.length > 0 && (
            <ul className="glass-card absolute z-20 mt-1 max-h-64 w-full overflow-y-auto p-1">
              {results.map((city, i) => (
                <li key={i}>
                  <button type="button" onClick={() => selectCity(city)} className="w-full rounded-lg px-3 py-2 text-start text-sm hover:bg-[var(--bg-elevated)]">
                    {city.name}, {city.country}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>

      <Section title={t("settingsPage.calculation")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm text-[var(--text-secondary)]">{t("prayerTimesPage.method")}</span>
            <select
              value={settings.calculationMethod}
              onChange={(e) => updateSettings({ calculationMethod: e.target.value as CalculationMethodKey })}
              className="w-full rounded-xl border border-[var(--surface-glass-border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--gold)]"
            >
              {Object.entries(CALCULATION_METHOD_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-[var(--text-secondary)]">{t("prayerTimesPage.madhab")}</span>
            <select
              value={settings.madhab}
              onChange={(e) => updateSettings({ madhab: e.target.value as MadhabKey })}
              className="w-full rounded-xl border border-[var(--surface-glass-border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--gold)]"
            >
              {Object.entries(MADHAB_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Section>

      <Section icon={Bell} title={t("settingsPage.notifications")}>
        <Toggle label={t("settingsPage.azanEnabled")} checked={settings.azan.enabled} onChange={(v) => updateSettings({ azan: { ...settings.azan, enabled: v } })} />

        <div className="mt-4">
          <span className="mb-1.5 block text-sm text-[var(--text-secondary)]">{t("settingsPage.azanVoice")}</span>
          <div className="flex flex-wrap gap-2">
            {AZAN_VOICES.map((voice) => (
              <button
                key={voice.id}
                type="button"
                onClick={() => updateSettings({ azan: { ...settings.azan, voiceId: voice.id } })}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  settings.azan.voiceId === voice.id ? "border-[var(--gold)] text-[var(--gold)]" : "border-[var(--surface-glass-border)] text-[var(--text-muted)] hover:border-[var(--gold)]"
                )}
              >
                {voice.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => void previewAzan(settings.azan.voiceId, settings.azan.volume)}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--surface-glass-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
            >
              <Volume2 size={13} />
              {t("settingsPage.preview")}
            </button>
          </div>
        </div>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm text-[var(--text-secondary)]">{t("settingsPage.volume")}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.azan.volume}
            onChange={(e) => updateSettings({ azan: { ...settings.azan, volume: Number(e.target.value) } })}
            className="w-full accent-[var(--gold)]"
          />
        </label>

        <div className="my-4 h-px bg-[var(--surface-glass-border)]" />

        <Toggle
          label={t("settingsPage.endingReminder")}
          checked={settings.azan.endingReminder.enabled}
          onChange={(v) => updateSettings({ azan: { ...settings.azan, endingReminder: { ...settings.azan.endingReminder, enabled: v } } })}
        />
        <div className="mt-3">
          <span className="mb-1.5 block text-sm text-[var(--text-secondary)]">{t("settingsPage.reminderMinutes")}</span>
          <div className="flex gap-2">
            {([5, 10, 15] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => updateSettings({ azan: { ...settings.azan, endingReminder: { ...settings.azan.endingReminder, minutesBeforeEnd: m } } })}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  settings.azan.endingReminder.minutesBeforeEnd === m
                    ? "border-[var(--gold)] text-[var(--gold)]"
                    : "border-[var(--surface-glass-border)] text-[var(--text-muted)] hover:border-[var(--gold)]"
                )}
              >
                {m} {t("common.minutes")}
              </button>
            ))}
          </div>
        </div>

        <div className="my-4 h-px bg-[var(--surface-glass-border)]" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--text-secondary)]">{t("settingsPage.backgroundPush")}</p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">{t("settingsPage.backgroundPushHint")}</p>
          </div>
          <Button
            variant="outline"
            icon={<BellRing size={14} />}
            onClick={() => void handleEnableBackgroundPush()}
            disabled={pushStatus === "requesting" || pushStatus === "enabled"}
          >
            {pushStatus === "enabled" ? t("settingsPage.backgroundPushOn") : t("settingsPage.backgroundPushEnable")}
          </Button>
        </div>
      </Section>

      <Section icon={Palette} title={t("settingsPage.appearance")}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-secondary)]">{t("settingsPage.theme")}</span>
          <div className="flex gap-2">
            {(["light", "dark"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => updateSettings({ theme: mode })}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  settings.theme === mode ? "border-[var(--gold)] text-[var(--gold)]" : "border-[var(--surface-glass-border)] text-[var(--text-muted)]"
                )}
              >
                {t(`settingsPage.${mode}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-[var(--text-secondary)]">{t("settingsPage.language")}</span>
          <div className="flex gap-2">
            {(["en", "ar", "bn"] as LanguageCode[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => updateSettings({ language: code })}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  settings.language === code ? "border-[var(--gold)] text-[var(--gold)]" : "border-[var(--surface-glass-border)] text-[var(--text-muted)]"
                )}
              >
                {LANGUAGE_LABELS[code]}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section icon={UserIcon} title={t("settingsPage.account")}>
        {!configured && <p className="text-sm text-[var(--text-muted)]">{t("auth.notConfigured")}</p>}
        {configured && user && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="truncate text-sm text-[var(--text-secondary)]">{t("settingsPage.signedInAs", { email: user.email ?? "" })}</p>
            <Button variant="outline" onClick={() => void signOutUser()}>
              {t("common.signOut")}
            </Button>
          </div>
        )}
        {configured && !user && (
          <div>
            <p className="mb-3 text-sm text-[var(--text-muted)]">{t("settingsPage.syncNote")}</p>
            <Button onClick={() => router.push("/login")}>{t("common.signIn")}</Button>
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon?: ComponentType<{ size?: number; className?: string }>; title: string; children: ReactNode }) {
  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
        {Icon && <Icon size={16} className="text-[var(--gold)]" />}
        {title}
      </div>
      {children}
    </GlassCard>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition", checked ? "bg-[var(--accent)]" : "bg-[var(--surface-glass-border)]")}
      >
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
      </button>
    </div>
  );
}
