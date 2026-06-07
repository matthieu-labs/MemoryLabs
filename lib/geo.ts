"use client";

// Best-effort geolocation for labelling where a voice note was recorded.
// Everything here is optional: if the user denies permission, the browser
// lacks the API, or the network call fails, we resolve to null and the
// recording is simply named by date/time instead.

export interface Coords {
  lat: number;
  lon: number;
}

export function getCurrentCoords(timeoutMs = 6000): Promise<Coords | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 60_000 }
    );
  });
}

// Reverse-geocode to a short, human place label like "Hamburg Am Hafen 6".
// Uses OpenStreetMap Nominatim (no key); guarded by a timeout and try/catch.
export async function reverseGeocode(c: Coords): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18` +
        `&lat=${c.lat}&lon=${c.lon}`,
      { headers: { Accept: "application/json" }, signal: ctrl.signal }
    );
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address ?? {};
    const city = a.city || a.town || a.village || a.municipality || a.county;
    const street = a.road;
    const house = a.house_number;
    const parts = [city, street, house].filter(Boolean);
    if (parts.length) return parts.join(" ");
    return data.name || data.display_name?.split(",")[0] || null;
  } catch {
    return null;
  }
}
