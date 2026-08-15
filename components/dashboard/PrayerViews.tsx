"use client";

import { motion } from "framer-motion";
import { usePrayerData } from "../../hooks/usePrayerData";
import { useSettings } from "../../context/SettingsContext";
import { formatClock, formatCountdown } from "../../lib/prayerTimes";
import { intlLocale } from "../../lib/i18n";
import { GlassCard } from "../ui/Primitives";
import { cn } from "../../lib/utils";

export function NextPrayerHero() {
  const { next, msRemaining } = usePrayerData();
  const { settings, t } = useSettings();
  const locale = intlLocale(settings.language);

  return (
    <GlassCard className="relative overflow-hidden p-8 text-center sm:p-10">
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">{t("dashboard.nextPrayer")}</p>
      <motion.h2
        key={next.name}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="font-display gold-text mt-2 text-5xl sm:text-6xl"
      >
        {t(`prayer.${next.name}`)}
      </motion.h2>
      <p className="mt-4 text-sm text-[var(--text-secondary)]">
        {t("dashboard.starts")}: <span className="font-numeral text-[var(--text-primary)]">{formatClock(next.start, locale)}</span>
      </p>
      <p className="font-numeral mt-1 text-4xl font-medium text-[var(--text-primary)] sm:text-5xl">{formatCountdown(msRemaining)}</p>
      <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">{t("dashboard.remaining")}</p>
    </GlassCard>
  );
}

export function PrayerList({ variant = "compact" }: { variant?: "compact" | "full" }) {
  const { todayWindows, current, now } = usePrayerData();
  const { settings, t } = useSettings();
  const locale = intlLocale(settings.language);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {todayWindows.map((w) => {
        const isActive = current?.name === w.name;
        const isPast = !isActive && now.getTime() >= w.end.getTime();
        return (
          <GlassCard key={w.name} className={cn("p-4 transition", isActive && "ring-1 ring-[var(--gold)]")}>
            <p className="text-sm font-medium text-[var(--text-secondary)]">{t(`prayer.${w.name}`)}</p>
            <p className="font-numeral mt-1 text-xl text-[var(--text-primary)]">{formatClock(w.start, locale)}</p>
            {variant === "full" && (
              <p className="font-numeral mt-0.5 text-xs text-[var(--text-muted)]">
                {t("prayerTimesPage.windowEnds")} {formatClock(w.end, locale)}
              </p>
            )}
            {isActive && <p className="mt-1.5 text-xs font-medium text-[var(--gold)]">{t("prayerTimesPage.active")}</p>}
            {isPast && <p className="mt-1.5 text-xs text-[var(--text-muted)]">{t("prayerTimesPage.passed")}</p>}
          </GlassCard>
        );
      })}
    </div>
  );
}
