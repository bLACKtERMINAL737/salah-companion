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
  { id: "makkah", label: "Makkah style", file: "Azaan in Makkah Beautiful Voice - Beautiful Azan made in Mecca - ISLAM - The Ultimate Peace (mp3cut.net).mp3" },
  { id: "madinah", label: "Madinah style", file: "/audio/azan-madinah.mp3" },
  { id: "short", label: "Short reminder chime", file: "/audio/azan-chime.mp3" },
];

let currentAudio: HTMLAudioElement | null = null;

export function playAzan(voiceId: string, volume: number): Promise<void> {
  stopAzan();
  const voice = AZAN_VOICES.find((v) => v.id === voiceId) ?? AZAN_VOICES[0]!;
  const audio = new Audio(voice.file);
  audio.volume = Math.min(1, Math.max(0, volume));
  currentAudio = audio;
  return audio.play().catch(() => {
    // Most likely: the file hasn't been added yet, or autoplay was blocked
    // because there was no recent user gesture. Either way, fail silently —
    // the on-screen notification still fires regardless of audio.
  });
}

export function stopAzan(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

export function previewAzan(voiceId: string, volume: number): Promise<void> {
  return playAzan(voiceId, volume);
}
