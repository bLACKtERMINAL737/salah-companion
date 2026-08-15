"use client";

import { useEffect, useState } from "react";
import { MapPin, Navigation2 } from "lucide-react";
import { usePrayerData } from "../../hooks/usePrayerData";
import { useSettings } from "../../context/SettingsContext";
import { searchNearbyMosques, getDirectionsUrl, SEARCH_RADIUS_OPTIONS_M } from "../../lib/mosques";
import type { Mosque } from "../../lib/types";
import { GlassCard, Spinner } from "../ui/Primitives";
import { cn } from "../../lib/utils";

export function MosqueFinder() {
  const { location } = usePrayerData();
  const { t } = useSettings();
  const [radius, setRadius] = useState<number>(SEARCH_RADIUS_OPTIONS_M[2]);
  const [mosques, setMosques] = useState<Mosque[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchNearbyMosques(location.latitude, location.longitude, radius).then((results) => {
      if (cancelled) return;
      setMosques(results);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [location.latitude, location.longitude, radius]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-[var(--text-secondary)]">{t("mosquesPage.searchRadius")}:</span>
        {SEARCH_RADIUS_OPTIONS_M.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setRadius(m)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              radius === m ? "border-[var(--gold)] text-[var(--gold)]" : "border-[var(--surface-glass-border)] text-[var(--text-muted)] hover:border-[var(--gold)]"
            )}
          >
            {m >= 1000 ? `${m / 1000} km` : `${m} m`}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Spinner size={18} />
          {t("mosquesPage.findingNearby")}
        </div>
      )}

      {!loading && mosques && mosques.length === 0 && <p className="text-sm text-[var(--text-muted)]">{t("mosquesPage.empty")}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {mosques?.map((mosque) => (
          <GlassCard key={mosque.id} className="flex items-start justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
                <MapPin size={14} className="shrink-0 text-[var(--gold)]" />
                <span className="truncate">{mosque.name}</span>
              </p>
              {mosque.address && <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{mosque.address}</p>}
              <p className="font-numeral mt-1 text-xs text-[var(--text-secondary)]">
                {mosque.distanceKm < 1 ? `${Math.round(mosque.distanceKm * 1000)} m` : `${mosque.distanceKm.toFixed(1)} ${t("common.km")}`} {t("common.away")}
              </p>
            </div>
            <a
              href={getDirectionsUrl(mosque)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--surface-glass-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
            >
              <Navigation2 size={12} />
              {t("common.directions")}
            </a>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
