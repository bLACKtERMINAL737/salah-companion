import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Marcellus, Outfit, Amiri, Almarai, Noto_Sans_Bengali, Space_Mono } from "next/font/google";
import { AuthProvider } from "../context/AuthContext";
import { SettingsProvider } from "../context/SettingsContext";
import { AppShell } from "../components/layout/AppShell";
import "./globals.css";

const marcellus = Marcellus({ subsets: ["latin"], weight: "400", variable: "--font-marcellus", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-outfit", display: "swap" });
const amiri = Amiri({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-amiri", display: "swap" });
const almarai = Almarai({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-almarai", display: "swap" });
const notoBengali = Noto_Sans_Bengali({ subsets: ["bengali"], weight: ["400", "500", "700"], variable: "--font-noto-bengali", display: "swap" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-space-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Salah Companion \u2014 Prayer Times, Qibla & Ramadan Companion",
  description:
    "A premium, offline-first Islamic prayer companion: live prayer times, Qibla compass, Hijri calendar, Ramadan mode, a mosque finder, and Salah AI.",
  applicationName: "Salah Companion",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Salah Companion" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Salah Companion",
    description: "A premium, offline-first Islamic prayer companion.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e4" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1210" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Runs before hydration so a returning user's saved theme/language/RTL
// applies on first paint instead of flashing default-English-light first.
// The localStorage key here is duplicated from lib/storage.ts's KEYS.settings
// on purpose — this has to be a plain inline script, not a module import.
const BOOTSTRAP_SCRIPT = `
try {
  var raw = localStorage.getItem("salah-companion:settings");
  var s = raw ? JSON.parse(raw) : null;
  var theme = (s && s.theme) || "dark";
  var lang = (s && s.language) || "en";
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.setAttribute("lang", lang);
  document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
} catch (e) {}
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${marcellus.variable} ${outfit.variable} ${amiri.variable} ${almarai.variable} ${notoBengali.variable} ${spaceMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOTSTRAP_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <SettingsProvider>
            <AppShell>{children}</AppShell>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
