"use client";

import { useState } from "react";
import { Moon, Sun, Languages, Check } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { LANGUAGE_LABELS } from "../../lib/i18n";
import type { LanguageCode } from "../../lib/types";

export function ThemeToggle() {
  const { settings, updateSettings } = useSettings();
  const isDark = settings.theme === "dark";
  return (
    <button
      type="button"
      onClick={() => updateSettings({ theme: isDark ? "light" : "dark" })}
      aria-label="Toggle theme"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--surface-glass-border)] text-[var(--text-secondary)] transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

const LANGUAGE_OPTIONS: LanguageCode[] = ["en", "ar", "bn"];

export function LanguageSwitcher() {
  const { settings, updateSettings } = useSettings();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--surface-glass-border)] px-3 text-sm text-[var(--text-secondary)] transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
      >
        <Languages size={16} />
        {LANGUAGE_LABELS[settings.language]}
      </button>
      {open && (
        <>
          <button aria-hidden className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} tabIndex={-1} />
          <ul role="listbox" className="glass-card absolute end-0 z-20 mt-2 w-40 overflow-hidden p-1">
            {LANGUAGE_OPTIONS.map((code) => (
              <li key={code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={settings.language === code}
                  onClick={() => {
                    updateSettings({ language: code });
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-start text-sm hover:bg-[var(--bg-elevated)]"
                >
                  {LANGUAGE_LABELS[code]}
                  {settings.language === code && <Check size={14} className="text-[var(--gold)]" />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
