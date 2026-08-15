import type { Mosque } from "./types";
import { haversineDistanceKm } from "./utils";

/**
 * Nearby-mosque search via OpenStreetMap's Overpass API. This is the
 * default (and only wired-up) provider on purpose: it needs no API key and
 * no billing account, so the feature works the moment someone clones the
 * repo. If you'd rather have richer data — photos, ratings, opening hours —
 * swap this out for the Google Places API using the
 * NEXT_PUBLIC_GOOGLE_MAPS_API_KEY slot already reserved in .env.example;
 * getDirectionsUrl()'s plain Google Maps deep link needs no key either way,
 * so navigation keeps working regardless of which search provider you use.
 *
 * Overpass is a shared community service with modest rate limits — fine for
 * an individual app, but cache/debounce calls if you expect real traffic.
 */

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export async function searchNearbyMosques(latitude: number, longitude: number, radiusMeters: number): Promise<Mosque[]> {
  const query = `[out:json][timeout:25];(node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${latitude},${longitude});way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${latitude},${longitude}););out center ${MAX_RESULTS};`;

  try {
    const res = await fetch(OVERPASS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) return [];

    const json = (await res.json()) as { elements?: OverpassElement[] };
    const elements = Array.isArray(json.elements) ? json.elements : [];

    return elements
      .map((el) => toMosque(el, latitude, longitude))
      .filter((m): m is Mosque => m !== null)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  } catch {
    // Overpass is a shared public service and occasionally throttles or
    // times out — fail soft into an empty list rather than an error state.
    return [];
  }
}

const MAX_RESULTS = 30;

function toMosque(el: OverpassElement, originLat: number, originLng: number): Mosque | null {
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (lat === undefined || lng === undefined) return null;

  const tags = el.tags ?? {};
  const name = tags.name || tags["name:en"] || "Mosque";
  const address = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]].filter(Boolean).join(" ") || undefined;

  return {
    id: `${el.type}/${el.id}`,
    name,
    latitude: lat,
    longitude: lng,
    distanceKm: haversineDistanceKm({ lat: originLat, lng: originLng }, { lat, lng }),
    address,
  };
}

/** Plain Google Maps directions deep link — works with no API key. */
export function getDirectionsUrl(mosque: Mosque): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}`;
}

export const SEARCH_RADIUS_OPTIONS_M = [1000, 3000, 5000, 10000] as const;
