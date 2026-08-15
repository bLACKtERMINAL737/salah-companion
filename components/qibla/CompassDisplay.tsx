"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { usePrayerData } from "../../hooks/usePrayerData";
import { useSettings } from "../../context/SettingsContext";
import { getQiblaBearing } from "../../lib/prayerTimes";
import { haversineDistanceKm } from "../../lib/utils";
import { GlassCard, Button } from "../ui/Primitives";

const KAABA = { lat: 21.4225, lng: 39.8262 };
const TICK_DEGREES = [0, 45, 90, 135, 180, 225, 270, 315];

type PermissionState = "unknown" | "needed" | "granted" | "denied" | "unsupported";

type IOSDeviceOrientationEvent = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export function CompassDisplay() {
  const { location } = usePrayerData();
  const { t } = useSettings();
  const bearing = useMemo(() => getQiblaBearing(location), [location]);
  const distanceKm = useMemo(() => haversineDistanceKm({ lat: location.latitude, lng: location.longitude }, KAABA), [location]);

  const [heading, setHeading] = useState<number | null>(null);
  const [permission, setPermission] = useState<PermissionState>("unknown");

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    const withCompass = event as DeviceOrientationEvent & { webkitCompassHeading?: number };
    if (typeof withCompass.webkitCompassHeading === "number") {
      setHeading(withCompass.webkitCompassHeading); // iOS Safari: already a true-north heading
    } else if (event.absolute && event.alpha !== null) {
      setHeading((360 - event.alpha) % 360); // most other browsers report counter-clockwise alpha
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      setPermission("unsupported");
      return;
    }
    const iosDOE = DeviceOrientationEvent as unknown as IOSDeviceOrientationEvent;
    if (typeof iosDOE.requestPermission === "function") {
      setPermission("needed"); // wait for an explicit tap — iOS requires a user gesture
      return;
    }
    setPermission("granted");
    window.addEventListener("deviceorientationabsolute", handleOrientation as EventListener, true);
    window.addEventListener("deviceorientation", handleOrientation as EventListener, true);
    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation as EventListener, true);
      window.removeEventListener("deviceorientation", handleOrientation as EventListener, true);
    };
  }, [handleOrientation]);

  async function requestIOSPermission() {
    try {
      const iosDOE = DeviceOrientationEvent as unknown as IOSDeviceOrientationEvent;
      const result = await iosDOE.requestPermission?.();
      setPermission(result === "granted" ? "granted" : "denied");
      if (result === "granted") {
        window.addEventListener("deviceorientation", handleOrientation as EventListener, true);
      }
    } catch {
      setPermission("denied");
    }
  }

  // Point toward Qibla relative to the device's current heading; with no
  // heading available (desktop, permission denied), fall back to showing
  // the raw bearing from North so the number stays useful either way.
  const needleRotation = heading !== null ? bearing - heading : bearing;

  return (
    <div className="flex flex-col items-center gap-6">
      <GlassCard className="relative flex aspect-square w-full max-w-sm items-center justify-center p-6">
        <svg viewBox="0 0 300 300" className="h-full w-full">
          <circle cx="150" cy="150" r="140" fill="none" stroke="var(--surface-glass-border)" strokeWidth="1.5" />
          {TICK_DEGREES.map((deg) => (
            <line key={deg} x1="150" y1="16" x2="150" y2="32" stroke="var(--text-muted)" strokeWidth="2" transform={`rotate(${deg} 150 150)`} />
          ))}
          <text x="150" y="28" textAnchor="middle" fill="var(--text-secondary)" fontSize="14" fontWeight="600">
            N
          </text>
        </svg>
        <motion.div
          className="absolute flex flex-col items-center"
          animate={{ rotate: needleRotation }}
          transition={{ type: "spring", stiffness: 45, damping: 11 }}
        >
          <div style={{ width: 0, height: 0, borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderBottom: "108px solid var(--gold)" }} />
          <div style={{ width: 0, height: 0, borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderTop: "48px solid var(--surface-glass-border)" }} />
        </motion.div>
        <div className="absolute h-3 w-3 rounded-full bg-[var(--accent)]" />
      </GlassCard>

      <GlassCard className="w-full max-w-sm p-4 text-center">
        <p className="font-numeral text-3xl text-[var(--text-primary)]">{Math.round(bearing)}{"\u00b0"}</p>
        <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">{t("qiblaPage.degrees")}</p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {t("qiblaPage.distance")}: <span className="font-numeral">{Math.round(distanceKm).toLocaleString()} {t("common.km")}</span>
        </p>
      </GlassCard>

      {permission === "needed" && (
        <div className="flex flex-col items-center gap-2">
          <Button onClick={requestIOSPermission}>{t("qiblaPage.enableCompass")}</Button>
          <p className="max-w-sm text-center text-xs text-[var(--text-muted)]">{t("qiblaPage.enableCompassHint")}</p>
        </div>
      )}
      {permission === "unsupported" && <p className="max-w-sm text-center text-xs text-[var(--text-muted)]">{t("qiblaPage.noSensor")}</p>}
      {permission === "granted" && <p className="max-w-sm text-center text-xs text-[var(--text-muted)]">{t("qiblaPage.calibrate")}</p>}
    </div>
  );
}
