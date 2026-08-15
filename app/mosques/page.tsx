"use client";

import { useSettings } from "../../context/SettingsContext";
import { MosqueFinder } from "../../components/mosques/MosqueFinder";

export default function MosquesPage() {
  const { t } = useSettings();
  return (
    <div className="space-y-2">
      <h1 className="font-display text-2xl text-[var(--text-primary)]">{t("mosquesPage.title")}</h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">{t("mosquesPage.subtitle")}</p>
      <MosqueFinder />
    </div>
  );
}
