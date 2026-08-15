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

// ============================================================
// 📌 এখানে আপনার অডিও ফাইলগুলোর লিংক বা পাথ দিন
// ============================================================

export const AZAN_VOICES: AzanVoice[] = [
  { 
    id: "makkah", 
    label: "Makkah style", 
    file: "/audio/azan-makkah.mp3"  // লোকাল ফাইল (public/audio ফোল্ডারে রাখুন)
  },
  { 
    id: "madinah", 
    label: "Madinah style", 
    file: "/audio/azan-madinah.mp3" 
  },
  { 
    id: "short", 
    label: "Short reminder chime", 
    file: "/audio/azan-chime.mp3" 
  },
];

// ============================================================
// 🎵 অডিও প্লেব্যাক লজিক
// ============================================================

let currentAudio: HTMLAudioElement | null = null;

/**
 * বর্তমান অডিও থামায় এবং রিসেট করে
 */
export function stopAzan(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

/**
 * অ্যাজান প্লে করে
 * @param voiceId - কোন ভয়েস বাজাবে (makkah, madinah, short)
 * @param volume - ভলিউম লেভেল (0.0 থেকে 1.0)
 * @returns Promise<void>
 */
export function playAzan(voiceId: string, volume: number): Promise<void> {
  // আগের অডিও থামান
  stopAzan();
  
  // ভয়েস খুঁজে বের করুন
  const voice = AZAN_VOICES.find((v) => v.id === voiceId);
  if (!voice) {
    console.error(`❌ Voice not found: ${voiceId}`);
    return Promise.reject(new Error(`Voice "${voiceId}" not found`));
  }

  // অডিও তৈরি করুন
  const audio = new Audio(voice.file);
  
  // ভলিউম সেট করুন (0-1 এর মধ্যে)
  audio.volume = Math.min(1, Math.max(0, volume));
  
  // কারেন্ট অডিও ট্র্যাক রাখুন
  currentAudio = audio;
  
  // অডিও প্লে করুন
  return audio.play()
    .then(() => {
      console.log(`✅ Azan playing: ${voice.label}`);
    })
    .catch((err) => {
      console.warn(`⚠️ Azan play failed for ${voiceId}:`, err);
      
      // ইউজার-ফ্রেন্ডলি এরর মেসেজ
      let errorMessage = "Audio playback failed. ";
      if (err.name === "NotAllowedError") {
        errorMessage += "Please interact with the page first (click anywhere).";
      } else if (err.name === "NotFoundError") {
        errorMessage += `File not found: ${voice.file}. Please add the audio file.`;
      } else {
        errorMessage += err.message || "Unknown error.";
      }
      
      throw new Error(errorMessage);
    });
}

/**
 * অ্যাজান প্রিভিউ (সেটিংসে প্রিভিউ করার জন্য)
 */
export function previewAzan(voiceId: string, volume: number): Promise<void> {
  // প্রিভিউতে ভলিউম একটু কম রাখুন (হঠাৎ জোরে আওয়াজ এড়াতে)
  const previewVolume = Math.min(volume, 0.5);
  return playAzan(voiceId, previewVolume);
}

/**
 * বর্তমানে কোন অডিও বাজছে কিনা চেক করে
 */
export function isAzanPlaying(): boolean {
  return currentAudio !== null && !currentAudio.paused;
}

/**
 * বর্তমান অডিওর ভলিউম পরিবর্তন করে
 */
export function setAzanVolume(volume: number): void {
  if (currentAudio) {
    currentAudio.volume = Math.min(1, Math.max(0, volume));
  }
}
