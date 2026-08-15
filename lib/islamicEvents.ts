import { firstDayOfHijriMonth, gregorianToHijri } from "./hijri";
import type { IslamicEvent } from "./types";

interface EventDef {
  id: string;
  hijriMonth: number;
  hijriDay: number;
}

/**
 * Fixed-date events by the tabular Hijri calendar. A couple of notes:
 * - Eid dates below are the calculated 1st of the month; the *actual*
 *   local holiday still depends on moon sighting, same caveat as the
 *   calendar page generally.
 * - Mawlid an-Nabi's date (12 Rabi' al-Awwal) follows the majority Sunni
 *   convention; some traditions mark 17 Rabi' al-Awwal instead — worth a
 *   note in the UI rather than picking a side silently.
 * - Laylat al-Qadr is traditionally sought in the last ten odd nights of
 *   Ramadan, most commonly associated with the 27th — shown as an estimate.
 */
const EVENT_DEFS: EventDef[] = [
  { id: "islamicNewYear", hijriMonth: 1, hijriDay: 1 },
  { id: "ashura", hijriMonth: 1, hijriDay: 10 },
  { id: "mawlid", hijriMonth: 3, hijriDay: 12 },
  { id: "isra_miraj", hijriMonth: 7, hijriDay: 27 },
  { id: "ramadanStart", hijriMonth: 9, hijriDay: 1 },
  { id: "laylatulQadr", hijriMonth: 9, hijriDay: 27 },
  { id: "eidFitr", hijriMonth: 10, hijriDay: 1 },
  { id: "hajjStart", hijriMonth: 12, hijriDay: 8 },
  { id: "eidAdha", hijriMonth: 12, hijriDay: 10 },
];

/** Resolves each event to its next upcoming Gregorian date from `from`. */
export function getUpcomingIslamicEvents(from: Date = new Date()): IslamicEvent[] {
  const currentHijri = gregorianToHijri(from);

  return EVENT_DEFS.map((def) => {
    let candidateYear = currentHijri.year;
    let date = resolveEventDate(def, candidateYear);
    if (date.getTime() < stripTime(from).getTime()) {
      candidateYear += 1;
      date = resolveEventDate(def, candidateYear);
    }
    return { id: def.id, hijriMonth: def.hijriMonth, hijriDay: def.hijriDay, gregorianDate: date };
  }).sort((a, b) => a.gregorianDate.getTime() - b.gregorianDate.getTime());
}

function resolveEventDate(def: EventDef, hijriYear: number): Date {
  const monthStart = firstDayOfHijriMonth(hijriYear, def.hijriMonth);
  return new Date(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate() + (def.hijriDay - 1));
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Convenience: the next Ramadan 1st (for Ramadan-mode's countdown / auto-entry). */
export function getNextRamadanStart(from: Date = new Date()): Date {
  const hijri = gregorianToHijri(from);
  let date = firstDayOfHijriMonth(hijri.year, 9);
  if (date.getTime() < stripTime(from).getTime()) {
    date = firstDayOfHijriMonth(hijri.year + 1, 9);
  }
  return date;
}

export function getRamadanEndForYear(hijriYearOfRamadanStart: number): Date {
  const eidFitr = firstDayOfHijriMonth(hijriYearOfRamadanStart, 10);
  return new Date(eidFitr.getFullYear(), eidFitr.getMonth(), eidFitr.getDate() - 1);
}

export function isDateWithinRamadan(date: Date): boolean {
  return gregorianToHijri(date).month === 9;
}
