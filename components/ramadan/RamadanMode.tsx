"use client";

import { useEffect, useMemo, useState } from "react";
import { Sunrise, Sunset, Check, X, MinusCircle } from "lucide-react";
import { usePrayerData } from "../../hooks/usePrayerData";
import { useSettings } from "../../context/SettingsContext";
import { getPrayerWindows, formatClock, formatCountdown } from "../../lib/prayerTimes";
import { gregorianToHijri, firstDayOfHijriMonth } from "../../lib/hijri";
import { getNextRamadanStart, getRamadanEndForYear, isDateWithinRamadan } from "../../lib/islamicEvents";
import { intlLocale } from "../../lib/i18n";
import { loadFastingLog, saveFastingLog, isoDateKey } from "../../lib/storage";
import type { FastingLog, FastingStatus } from "../../lib/types";
import { GlassCard } from "../ui/Primitives";
import { cn } from "../../lib/utils";

const DAY_MS = 86_400_000;

export function RamadanCountdown() {
  const { location, now, todayWindows } = usePrayerData();
  const { settings, t } = useSettings();
  const locale = intlLocale(settings.language);
  const params = { calculationMethod: settings.calculationMethod, madhab: settings.madhab };
  const inRamadan = isDateWithinRamadan(now);
  const dayKey = now.toDateString();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hijri = useMemo(() => gregorianToHijri(now), [dayKey]);

  const tomorrowFajr = useMemo(() => {
    const tomorrow = new Date(now.getTime() + DAY_MS);
    return getPrayerWindows(location, tomorrow, params)[0]!.start;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.latitude, location.longitude, params.calculationMethod, params.madhab, dayKey]);

  if (!inRamadan) {
    const nextStart = getNextRamadanStart(now);
    const daysLeft = Math.max(0, Math.ceil((nextStart.getTime() - now.getTime()) / DAY_MS));
    return (
      <GlassCard className="p-8 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">{t("ramadanPage.countdownTitle")}</p>
        <p className="font-numeral gold-text mt-3 text-5xl">{daysLeft}</p>
        <p className="text-sm text-[var(--text-secondary)]">{t("ramadanPage.daysUntil")}</p>
        <p className="mt-4 text-xs text-[var(--text-muted)]">{nextStart.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}</p>
      </GlassCard>
    );
  }

  const ramadanStart = firstDayOfHijriMonth(hijri.year, 9);
  const ramadanEnd = getRamadanEndForYear(hijri.year);
  const totalDays = Math.round((ramadanEnd.getTime() - ramadanStart.getTime()) / DAY_MS) + 1;
  const fajrWindow = todayWindows.find((w) => w.name === "fajr")!;
  const maghribWindow = todayWindows.find((w) => w.name === "maghrib")!;
  const nowMs = now.getTime();
  const suhoorEndTime = nowMs < fajrWindow.start.getTime() ? fajrWindow.start : tomorrowFajr;

  return (
    <div className="space-y-4">
      <GlassCard className="p-6 text-center">
        <p className="font-display gold-text text-2xl">{t("ramadanPage.inProgress", { day: hijri.day, total: totalDays })}</p>
      </GlassCard>
      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard className="p-5">
          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
            <Sunrise size={16} className="text-[var(--gold)]" />
            {t("ramadanPage.suhoorEnds")}
          </div>
          <p className="font-numeral text-2xl text-[var(--text-primary)]">{formatClock(suhoorEndTime, locale)}</p>
          {suhoorEndTime.getTime() > nowMs && <p className="font-numeral mt-1 text-xs text-[var(--text-muted)]">{formatCountdown(suhoorEndTime.getTime() - nowMs)}</p>}
        </GlassCard>
        <GlassCard className="p-5">
          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
            <Sunset size={16} className="text-[var(--gold)]" />
            {t("ramadanPage.iftarAt")}
          </div>
          <p className="font-numeral text-2xl text-[var(--text-primary)]">{formatClock(maghribWindow.start, locale)}</p>
          {maghribWindow.start.getTime() > nowMs && (
            <p className="font-numeral mt-1 text-xs text-[var(--text-muted)]">{formatCountdown(maghribWindow.start.getTime() - nowMs)}</p>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

const STATUS_CYCLE: (FastingStatus | undefined)[] = [undefined, "fasted", "missed", "exempt"];

export function FastingTracker() {
  const { t } = useSettings();
  const [log, setLog] = useState<FastingLog>({});
  const [now] = useState(() => new Date()); // static snapshot — the tracker doesn't need live ticking

  useEffect(() => {
    setLog(loadFastingLog());
  }, []);

  const hijri = gregorianToHijri(now);
  const start = firstDayOfHijriMonth(hijri.year, 9);
  const end = getRamadanEndForYear(hijri.year);
  const days = useMemo(() => {
    const list: Date[] = [];
    for (let cursor = start.getTime(); cursor <= end.getTime(); cursor += DAY_MS) list.push(new Date(cursor));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start.getTime(), end.getTime()]);

  function cycleStatus(date: Date) {
    const key = isoDateKey(date);
    const currentIndex = STATUS_CYCLE.indexOf(log[key]);
    const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];
    setLog((prev) => {
      const next = { ...prev };
      if (nextStatus) next[key] = nextStatus;
      else delete next[key];
      saveFastingLog(next);
      return next;
    });
  }

  return (
    <GlassCard className="p-5">
      <p className="mb-4 text-sm font-medium text-[var(--text-secondary)]">{t("ramadanPage.fastingTracker")}</p>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
        {days.map((date, i) => {
          const key = isoDateKey(date);
          const status = log[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => cycleStatus(date)}
              title={date.toLocaleDateString()}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg border text-xs font-medium transition",
                status === "fasted" && "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]",
                status === "missed" && "border-[var(--color-rose-alert)] bg-[var(--color-rose-alert)]/10 text-[var(--color-rose-alert)]",
                status === "exempt" && "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]",
                !status && "border-[var(--surface-glass-border)] text-[var(--text-muted)] hover:border-[var(--gold)]"
              )}
            >
              {status === "fasted" ? <Check size={14} /> : status === "missed" ? <X size={14} /> : status === "exempt" ? <MinusCircle size={14} /> : i + 1}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
        <Legend color="var(--accent)" label={t("ramadanPage.markFasted")} />
        <Legend color="var(--color-rose-alert)" label={t("ramadanPage.markMissed")} />
        <Legend color="var(--gold)" label={t("ramadanPage.markExempt")} />
      </div>
    </GlassCard>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
