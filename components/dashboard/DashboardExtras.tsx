"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, CalendarDays, Navigation } from "lucide-react";
import { usePrayerData } from "../../hooks/usePrayerData";
import { useNow } from "../../hooks/useNow";
import { useSettings } from "../../context/SettingsContext";
import { gregorianToHijri } from "../../lib/hijri";
import { hijriMonthNameLocalized } from "../../lib/i18n";
import { getQiblaBearing } from "../../lib/prayerTimes";
import { DEFAULT_LOCATION } from "../../lib/geocoding";
import { GlassCard } from "../ui/Primitives";

export function LocationBar() {
  const { location } = usePrayerData();
  const { t } = useSettings();
  const label = location.city ? `${location.city}${location.country ? `, ${location.country}` : ""}` : `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`;

  return (
    <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
      <span className="inline-flex items-center gap-1.5">
        <MapPin size={15} className="text-[var(--gold)]" />
        {label}
      </span>
      <Link href="/settings" className="font-medium text-[var(--gold)] hover:underline">
        {t("dashboard.changeLocation")}
      </Link>
    </div>
  );
}

export function HijriDateCard() {
  const now = useNow(60_000);
  const { settings, t } = useSettings();
  const dayKey = now.toDateString();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hijri = useMemo(() => gregorianToHijri(now), [dayKey]);
  const monthName = hijriMonthNameLocalized(hijri.month, settings.language);

  return (
    <GlassCard className="p-5">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
        <CalendarDays size={16} className="text-[var(--gold)]" />
        {t("dashboard.hijriToday")}
      </div>
      <p className="font-display text-2xl text-[var(--text-primary)]">
        {hijri.day} {monthName} {hijri.year} <span className="text-base text-[var(--text-muted)]">AH</span>
      </p>
    </GlassCard>
  );
}

export function QiblaMiniWidget() {
  const { location: prayerLocation } = usePrayerData();
  const location = prayerLocation ?? DEFAULT_LOCATION;
  const { t } = useSettings();
  const bearing = useMemo(() => getQiblaBearing(location), [location]);

  return (
    <Link href="/qibla" className="glass-card flex items-center justify-between p-5 transition hover:border-[var(--gold)]">
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
          <Navigation size={16} className="text-[var(--gold)]" />
          {t("dashboard.qiblaDirection")}
        </div>
        <p className="font-numeral text-2xl text-[var(--text-primary)]">{Math.round(bearing)}{"\u00b0"}</p>
      </div>
      <motion.div animate={{ rotate: bearing }} transition={{ type: "spring", stiffness: 50, damping: 12 }}>
        <Navigation size={30} className="text-[var(--gold)]" />
      </motion.div>
    </Link>
  );
}
