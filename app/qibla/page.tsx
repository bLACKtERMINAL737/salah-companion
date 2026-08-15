"use client";

import { useSettings } from "../../context/SettingsContext";
import { CompassDisplay } from "../../components/qibla/CompassDisplay";

export default function QiblaPage() {
  const { t } = useSettings();
  return (
    <div className="space-y-2">
      <h1 className="font-display text-2xl text-[var(--text-primary)]">{t("qiblaPage.title")}</h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">{t("qiblaPage.subtitle")}</p>
      <CompassDisplay />
    </div>
  );
}
