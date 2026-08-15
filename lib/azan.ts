/**
 * Azan playback. The catalog below defines the *choices* a user sees in
 * Settings; it intentionally does not ship any audio. Azan recordings are
 * performances with their own rights — bundling someone's recitation
 * without permission isn't something to do by default. Drop licensed or
 * your-own-recorded mp3s into /public/audio using these exact filenames
 * (or edit the list) and playback works immediately. See README for
 * sourcing suggestions.
 */
export interface AzanVoice {
  id: string;
  label: string;
  file: string;
}

export const AZAN_VOICES: AzanVoice[] = [
  { id: "makkah", label: "Makkah style", file: "https://github.com/bLACKtERMINAL737/salah-companion/blob/d44c5d041d4098a5d315b48fbd354113c5b4244f/Azaan%20in%20Makkah%20Beautiful%20Voice%20-%20Beautiful%20Azan%20made%20in%20Mecca%20-%20ISLAM%20-%20The%20Ultimate%20Peace%20(mp3cut.net).mp3" },
  { id: "madinah", label: "Madinah style", file: "https://github.com/bLACKtERMINAL737/salah-companion/blob/d44c5d041d4098a5d315b48fbd354113c5b4244f/Azaan%20in%20Makkah%20Beautiful%20Voice%20-%20Beautiful%20Azan%20made%20in%20Mecca%20-%20ISLAM%20-%20The%20Ultimate%20Peace%20(mp3cut.net).mp3" },
  { id: "short", label: "Short reminder chime", file: "https://github.com/bLACKtERMINAL737/salah-companion/blob/d44c5d041d4098a5d315b48fbd354113c5b4244f/Azaan%20in%20Makkah%20Beautiful%20Voice%20-%20Beautiful%20Azan%20made%20in%20Mecca%20-%20ISLAM%20-%20The%20Ultimate%20Peace%20(mp3cut.net).mp3" },
];

let currentAudio: HTMLAudioElement | null = null;

export function stopAzan(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

export function playAzan(voiceId: string, volume: number): Promise<void> {
  stopAzan();
  
  const voice = AZAN_VOICES.find((v) => v.id === voiceId) ?? AZAN_VOICES[0];
  if (!voice) {
    console.error("No azan voice available");
    return Promise.reject("No voice found");
  }

  const audio = new Audio(voice.file);
  audio.volume = Math.min(1, Math.max(0, volume));
  currentAudio = audio;
  
  return audio.play().catch((err) => {
    console.warn(`Azan play failed for ${voiceId}:`, err);
    // ইউজারকে জানান (যেমন: টোস্ট নোটিফিকেশন)
    throw err; // অথবা রি-থ্রো করুন
  });
}

export function previewAzan(voiceId: string, volume: number): Promise<void> {
  return playAzan(voiceId, volume);
}
