"use client";

import { useSettings } from "../../context/SettingsContext";
import { RamadanCountdown, FastingTracker } from "../../components/ramadan/RamadanMode";

export default function RamadanPage() {
  const { t } = useSettings();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-[var(--text-primary)]">{t("ramadanPage.title")}</h1>
      <RamadanCountdown />
      <FastingTracker />
    </div>
  );
}
