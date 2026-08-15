"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { useNow } from "../../hooks/useNow";
import { useSettings } from "../../context/SettingsContext";
import { gregorianToHijri, firstDayOfHijriMonth } from "../../lib/hijri";
import { getUpcomingIslamicEvents } from "../../lib/islamicEvents";
import { hijriMonthNameLocalized, intlLocale } from "../../lib/i18n";
import { GlassCard } from "../../components/ui/Primitives";
import { cn } from "../../lib/utils";

const DAY_MS = 86_400_000;

export default function CalendarPage() {
  const now = useNow(60_000);
  const { settings, t } = useSettings();
  const locale = intlLocale(settings.language);
  const dayKey = now.toDateString();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hijri = useMemo(() => gregorianToHijri(now), [dayKey]);
  const monthName = hijriMonthNameLocalized(hijri.month, settings.language);

  const monthDays = useMemo(() => {
    const nextMonth = hijri.month === 12 ? 1 : hijri.month + 1;
    const nextYear = hijri.month === 12 ? hijri.year + 1 : hijri.year;
    const monthStart = firstDayOfHijriMonth(hijri.year, hijri.month);
    const monthEndExclusive = firstDayOfHijriMonth(nextYear, nextMonth);
    const daysInMonth = Math.round((monthEndExclusive.getTime() - monthStart.getTime()) / DAY_MS);
    return Array.from({ length: daysInMonth }, (_, i) => new Date(monthStart.getTime() + i * DAY_MS));
  }, [hijri.year, hijri.month]);

  const events = useMemo(() => getUpcomingIslamicEvents(now).slice(0, 6), [dayKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-[var(--text-primary)]">{t("calendarPage.title")}</h1>
        <p className="text-sm text-[var(--text-secondary)]">{t("calendarPage.subtitle")}</p>
      </div>

      <GlassCard className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-display text-lg text-[var(--text-primary)]">
            {monthName} {hijri.year} <span className="text-sm text-[var(--text-muted)]">AH</span>
          </p>
          <p className="text-xs text-[var(--text-muted)]">{t("calendarPage.thisMonth")}</p>
        </div>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
          {monthDays.map((date, i) => {
            const isToday = date.toDateString() === now.toDateString();
            return (
              <div
                key={i}
                className={cn(
                  "flex flex-col items-center rounded-lg border p-2 text-center",
                  isToday ? "border-[var(--gold)] bg-[var(--gold)]/10" : "border-[var(--surface-glass-border)]"
                )}
              >
                <span className={cn("font-numeral text-base", isToday ? "text-[var(--gold)]" : "text-[var(--text-primary)]")}>{i + 1}</span>
                <span className="font-numeral text-[10px] text-[var(--text-muted)]">{date.toLocaleDateString(locale, { day: "numeric", month: "short" })}</span>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <div>
        <h2 className="font-display mb-3 text-lg text-[var(--text-primary)]">{t("calendarPage.upcomingEvents")}</h2>
        <div className="space-y-2">
          {events.map((event) => (
            <GlassCard key={event.id} className="flex items-center justify-between p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                <CalendarDays size={15} className="text-[var(--gold)]" />
                {t(`events.${event.id}`)}
              </span>
              <span className="font-numeral text-sm text-[var(--text-secondary)]">
                {event.gregorianDate.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" })}
              </span>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
