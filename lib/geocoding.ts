import type { GeoLocation } from "./types";

/**
 * Two free, keyless services power location search, since requiring yet
 * another API key just to pick a city would be a poor first-run experience:
 *  - Open-Meteo Geocoding for forward search (city name → coordinates)
 *  - BigDataCloud's client-side reverse geocoding for coordinates → city
 * Both are fetched defensively (this sandbox can't make live calls to
 * verify the exact current response shape) — verify against their docs
 * before relying on this in production, and feel free to swap in Google's
 * Geocoding API instead if you'd rather standardize on one Google key for
 * both this and the mosque finder.
 */

export async function detectBrowserLocation(): Promise<GeoLocation | null> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const place = await reverseGeocode(latitude, longitude);
        resolve({
          latitude,
          longitude,
          city: place?.city,
          country: place?.country,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          source: "geolocation",
        });
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 }
    );
  });
}

export async function reverseGeocode(lat: number, lng: number): Promise<{ city?: string; country?: string } | null> {
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
    if (!res.ok) return null;
    const data = await res.json();
    const city: string | undefined = data.city || data.locality || data.principalSubdivision;
    const country: string | undefined = data.countryName;
    return { city, country };
  } catch {
    return null;
  }
}

export interface CitySearchResult {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export async function searchCities(query: string): Promise<CitySearchResult[]> {
  if (query.trim().length < 2) return [];
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`);
    if (!res.ok) return [];
    const data = await res.json();
    const results: unknown[] = Array.isArray(data.results) ? data.results : [];
    return results
      .map((r) => {
        const item = r as Record<string, unknown>;
        return {
          name: String(item.name ?? ""),
          country: String(item.country ?? ""),
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
          timezone: item.timezone ? String(item.timezone) : undefined,
        };
      })
      .filter((r) => r.name && Number.isFinite(r.latitude) && Number.isFinite(r.longitude));
  } catch {
    return [];
  }
}

export const DEFAULT_LOCATION: GeoLocation = {
  latitude: 21.4225,
  longitude: 39.8262,
  city: "Makkah",
  country: "Saudi Arabia",
  timezone: "Asia/Riyadh",
  source: "default",
};
