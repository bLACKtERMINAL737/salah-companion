"use client";

import { useSettings } from "../../context/SettingsContext";
import { PrayerList } from "../../components/dashboard/PrayerViews";
import { LocationBar } from "../../components/dashboard/DashboardExtras";
import { GlassCard } from "../../components/ui/Primitives";
import { CALCULATION_METHOD_LABELS, MADHAB_LABELS } from "../../lib/prayerTimes";
import type { CalculationMethodKey, MadhabKey } from "../../lib/types";

export default function PrayerTimesPage() {
  const { settings, updateSettings, t } = useSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-[var(--text-primary)]">{t("prayerTimesPage.title")}</h1>
        <div className="mt-2">
          <LocationBar />
        </div>
      </div>

      <PrayerList variant="full" />

      <GlassCard className="grid gap-4 p-5 sm:grid-cols-2">
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
      </GlassCard>
    </div>
  );
}
