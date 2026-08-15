"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Clock, Compass, CalendarDays, Moon as MoonIcon, MapPinned, Sparkles, Settings as SettingsIcon, LogIn } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../context/AuthContext";
import { ThemeToggle, LanguageSwitcher } from "../ui/Controls";
import { IslamicPatternBackground } from "./IslamicPatternBackground";
import { EIGHT_POINT_STAR_PATH } from "../../lib/star-path";

const NAV_ITEMS = [
  { href: "/", key: "dashboard", icon: LayoutDashboard },
  { href: "/prayer-times", key: "prayerTimes", icon: Clock },
  { href: "/qibla", key: "qibla", icon: Compass },
  { href: "/calendar", key: "calendar", icon: CalendarDays },
  { href: "/ramadan", key: "ramadan", icon: MoonIcon },
  { href: "/mosques", key: "mosques", icon: MapPinned },
  { href: "/ai", key: "ai", icon: Sparkles },
  { href: "/settings", key: "settings", icon: SettingsIcon },
] as const;

type NavItem = (typeof NAV_ITEMS)[number];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useSettings();
  const { user } = useAuth();

  return (
    <div className="relative min-h-dvh">
      <IslamicPatternBackground />

      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-[var(--surface-glass-border)] bg-[var(--bg-elevated)]/70 backdrop-blur-xl md:flex">
        <Brand />
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.key} item={item} active={pathname === item.href} label={t(`nav.${item.key}`)} />
          ))}
        </nav>
        <div className="flex items-center justify-between gap-2 border-t border-[var(--surface-glass-border)] p-4">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <Link
          href={user ? "/settings" : "/login"}
          className="mx-3 mb-4 flex items-center gap-2 truncate rounded-xl border border-[var(--surface-glass-border)] px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
        >
          <LogIn size={16} className="shrink-0" />
          <span className="truncate">{user ? (user.email ?? t("settingsPage.account")) : t("common.signIn")}</span>
        </Link>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--surface-glass-border)] bg-[var(--bg)]/85 px-4 py-3 backdrop-blur-xl md:hidden">
        <Brand compact />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="relative z-10 min-h-dvh pb-24 md:ms-64 md:pb-10">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex gap-1 overflow-x-auto border-t border-[var(--surface-glass-border)] bg-[var(--bg)]/95 px-2 py-2 backdrop-blur-xl md:hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.key} item={item} active={pathname === item.href} label={t(`nav.${item.key}`)} compact />
        ))}
      </nav>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "flex items-center gap-2" : "flex items-center gap-3 px-5 py-6"}>
      <motion.svg
        width={compact ? 24 : 30}
        height={compact ? 24 : 30}
        viewBox="0 0 100 100"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <path d={EIGHT_POINT_STAR_PATH} fill="var(--gold)" />
      </motion.svg>
      <span className="font-display truncate text-lg tracking-wide text-[var(--text-primary)]">Salah Companion</span>
    </div>
  );
}

function NavLink({ item, active, label, compact = false }: { item: NavItem; active: boolean; label: string; compact?: boolean }) {
  const Icon = item.icon;
  if (compact) {
    return (
      <Link
        href={item.href}
        className={`flex min-w-[62px] flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10.5px] transition ${
          active ? "text-[var(--gold)]" : "text-[var(--text-muted)]"
        }`}
      >
        <Icon size={19} />
        <span className="truncate">{label}</span>
      </Link>
    );
  }
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
        active
          ? "bg-[var(--bg-elevated)] text-[var(--gold)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
      }`}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}
