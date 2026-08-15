"use client";

import { motion } from "framer-motion";
import { useSettings } from "../context/SettingsContext";
import { useNotificationScheduler } from "../hooks/useNotificationScheduler";
import { NextPrayerHero, PrayerList } from "../components/dashboard/PrayerViews";
import { LocationBar, HijriDateCard, QiblaMiniWidget } from "../components/dashboard/DashboardExtras";
import { DailyCards } from "../components/dashboard/DailyCards";

export default function DashboardPage() {
  const { t } = useSettings();
  useNotificationScheduler();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="space-y-6">
      <LocationBar />
      <NextPrayerHero />

      <section>
        <h2 className="font-display mb-3 text-lg text-[var(--text-primary)]">{t("dashboard.todaysPrayers")}</h2>
        <PrayerList variant="compact" />
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <HijriDateCard />
        <QiblaMiniWidget />
      </div>

      <DailyCards />
    </motion.div>
  );
}
