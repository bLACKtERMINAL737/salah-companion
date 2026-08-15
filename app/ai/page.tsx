"use client";

import { useSettings } from "../../context/SettingsContext";
import { ChatWindow } from "../../components/ai/ChatWindow";

export default function AiPage() {
  const { t } = useSettings();
  return (
    <div className="space-y-2">
      <h1 className="font-display text-2xl text-[var(--text-primary)]">{t("aiPage.title")}</h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">{t("aiPage.subtitle")}</p>
      <ChatWindow />
    </div>
  );
}
