// Self-contained on purpose: a browser extension's new-tab page loads
// directly with no bundler, so this can't import the Next.js app's
// TypeScript modules. It re-implements just enough (a live clock, prayer
// times from the same free Aladhan API, a countdown) to be useful on its
// own; for every other feature, "Open Salah Companion" hands off to the
// full PWA.

// EDIT ME: point this at your deployed app once you've set it up (see README).
const APP_URL = "https://your-deployed-app.vercel.app";

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const FALLBACK = { lat: 21.4225, lng: 39.8262, label: "Makkah, Saudi Arabia" }; // used if geolocation is denied

let timings = null;
let locationLabel = FALLBACK.label;

document.getElementById("open-app").href = APP_URL;

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatDateForApi(date) {
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
}

function parseTimeToday(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

async function loadPrayerTimes(lat, lng) {
  const url = `https://api.aladhan.com/v1/timings/${formatDateForApi(new Date())}?latitude=${lat}&longitude=${lng}&method=3`;
  const res = await fetch(url);
  const json = await res.json();
  timings = json.data.timings;
  renderGrid();
}

async function loadLocationLabel(lat, lng) {
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
    const data = await res.json();
    const city = data.city || data.locality || data.principalSubdivision;
    if (city) locationLabel = data.countryName ? `${city}, ${data.countryName}` : city;
  } catch {
    // Keep whatever label we already had (coordinates or fallback).
  }
  document.getElementById("location").textContent = locationLabel;
}

function renderGrid() {
  if (!timings) return;
  const grid = document.getElementById("prayer-grid");
  const now = new Date();
  const { current } = currentAndNext(now);
  grid.innerHTML = PRAYERS.map((name) => {
    const isActive = name === current;
    return `<div class="cell${isActive ? " active" : ""}">
      <span class="p-name">${name}</span>
      <span class="p-time">${formatClock(parseTimeToday(timings[name]))}</span>
    </div>`;
  }).join("");
}

function formatClock(date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function currentAndNext(now) {
  if (!timings) return { current: null, next: null, nextTime: null };
  const windows = PRAYERS.map((name) => ({ name, start: parseTimeToday(timings[name]) })).sort((a, b) => a.start - b.start);
  let current = null;
  let next = windows[0];
  for (let i = 0; i < windows.length; i++) {
    if (windows[i].start.getTime() <= now.getTime()) {
      current = windows[i].name;
      next = windows[i + 1] ?? { name: `${windows[0].name} (tomorrow)`, start: new Date(windows[0].start.getTime() + 86_400_000) };
    }
  }
  return { current, next: next.name, nextTime: next.start };
}

function tick() {
  const now = new Date();
  document.getElementById("clock").textContent = formatClock(now);

  if (!timings) return;
  const { next, nextTime } = currentAndNext(now);
  document.getElementById("next-name").textContent = next;
  document.getElementById("next-time").textContent = formatClock(nextTime);

  const msRemaining = Math.max(0, nextTime.getTime() - now.getTime());
  const totalSeconds = Math.floor(msRemaining / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  document.getElementById("countdown").textContent = [h, m, s].map(pad).join(":");
  renderGrid();
}

function init(lat, lng, label) {
  if (label) {
    locationLabel = label;
    document.getElementById("location").textContent = label;
  } else {
    loadLocationLabel(lat, lng);
  }
  loadPrayerTimes(lat, lng).catch(() => {
    document.getElementById("next-name").textContent = "Offline";
  });
  tick();
  setInterval(tick, 1000);
}

if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(
    (pos) => init(pos.coords.latitude, pos.coords.longitude, null),
    () => init(FALLBACK.lat, FALLBACK.lng, FALLBACK.label),
    { timeout: 8000 }
  );
} else {
  init(FALLBACK.lat, FALLBACK.lng, FALLBACK.label);
}
