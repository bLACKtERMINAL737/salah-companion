/**
 * Daily verse / dua content.
 *
 * Deliberately does NOT hardcode Arabic scripture from memory anywhere in
 * this file — for text this significant, a transcription slip is a real
 * risk, not just a style nitpick. Instead we keep a small local list of
 * well-known *references* (surah:ayah) and fetch the authoritative Arabic
 * + translation from alquran.cloud (a free, widely used public Quran API,
 * https://alquran.cloud/api) at request time.
 *
 * This build environment can't make live external calls to verify the
 * exact current response shape, so the fetch is defensive: it validates
 * the fields it needs before using them and fails soft into an "offline"
 * state rather than ever rendering something unverified as scripture.
 * Worth double-checking the response shape against the current docs
 * before shipping, and swapping in a different edition identifier for
 * translations in Arabic/Bangla if you want localized text too.
 */

export type DailyContentType = "verse" | "dua";

export interface DailyContentRef {
  id: string;
  type: DailyContentType;
  reference: string; // e.g. "2:255"
  surahName: string;
  theme: string;
}

export interface ResolvedContent extends DailyContentRef {
  arabic: string;
  translation: string;
}

// A small, low-risk rotation. Verses chosen for being extremely well-known
// (so misattribution risk from the API itself is minimal) and short.
export const DAILY_CONTENT: DailyContentRef[] = [
  { id: "ayatul-kursi", type: "verse", reference: "2:255", surahName: "Al-Baqarah", theme: "God's all-encompassing knowledge and protection" },
  { id: "dua-dunya-akhirah", type: "dua", reference: "2:201", surahName: "Al-Baqarah", theme: "Asking for good in this life and the next" },
  { id: "no-burden-beyond-ability", type: "verse", reference: "2:286", surahName: "Al-Baqarah", theme: "God does not burden a soul beyond what it can bear" },
  { id: "dua-forgive-shortcomings", type: "dua", reference: "3:8", surahName: "Aal-e-Imran", theme: "Asking that the heart not swerve after guidance" },
  { id: "with-hardship-ease", type: "verse", reference: "94:5", surahName: "Ash-Sharh", theme: "With hardship comes ease" },
  { id: "dua-increase-knowledge", type: "dua", reference: "20:114", surahName: "Ta-Ha", theme: "Asking for increase in knowledge" },
  { id: "light-verse", type: "verse", reference: "24:35", surahName: "An-Nur", theme: "God as the light of the heavens and earth" },
  { id: "dua-rabbana-atina", type: "dua", reference: "2:201", surahName: "Al-Baqarah", theme: "A short, complete dua for good in both worlds" },
  { id: "remembrance-of-god", type: "verse", reference: "13:28", surahName: "Ar-Ra'd", theme: "Hearts find rest in the remembrance of God" },
  { id: "al-asr", type: "verse", reference: "103:1", surahName: "Al-Asr", theme: "The value of time" },
];

const QURAN_API_BASE = "https://api.alquran.cloud/v1";

export function getContentOfTheDay(type?: DailyContentType, date: Date = new Date()): DailyContentRef {
  const pool = type ? DAILY_CONTENT.filter((c) => c.type === type) : DAILY_CONTENT;
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86_400_000);
  const item = pool[dayOfYear % pool.length];
  return item ?? DAILY_CONTENT[0]!;
}

interface AlquranAyahResponse {
  code: number;
  data?: { text?: string };
}

/**
 * Fetches Arabic + a translation for a reference. Returns null on any
 * network/parse failure so callers can show an offline-friendly state
 * instead of guessing.
 */
export async function fetchVerseText(reference: string, translationEdition = "en.sahih"): Promise<{ arabic: string; translation: string } | null> {
  try {
    const [arabicRes, translationRes] = await Promise.all([
      fetch(`${QURAN_API_BASE}/ayah/${reference}/quran-uthmani`),
      fetch(`${QURAN_API_BASE}/ayah/${reference}/${translationEdition}`),
    ]);
    if (!arabicRes.ok || !translationRes.ok) return null;

    const arabicJson = (await arabicRes.json()) as AlquranAyahResponse;
    const translationJson = (await translationRes.json()) as AlquranAyahResponse;

    const arabic = arabicJson.data?.text;
    const translation = translationJson.data?.text;
    if (!arabic || !translation) return null;

    return { arabic, translation };
  } catch {
    return null;
  }
}

export async function resolveContentOfTheDay(type?: DailyContentType, date?: Date): Promise<ResolvedContent> {
  const ref = getContentOfTheDay(type, date);
  const text = await fetchVerseText(ref.reference);
  return {
    ...ref,
    arabic: text?.arabic ?? "",
    translation: text?.translation ?? "",
  };
}
