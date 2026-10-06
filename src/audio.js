// Audio manager for Sakura / Anime theme sound effects
const BASE_VOLUME = 0.45; // Previous default volume level
const STORAGE_KEY_MUTED = 'tentaplugg-sound-muted';
const STORAGE_KEY_VOLUME = 'tentaplugg-sound-volume';

let muted = false;
let volume = 0.5; // Default: 50% of previous volume (0.5 * 0.45 = 0.225 effective volume)

try {
  if (typeof localStorage !== 'undefined') {
    muted = localStorage.getItem(STORAGE_KEY_MUTED) === 'true';
    const savedVol = localStorage.getItem(STORAGE_KEY_VOLUME);
    if (savedVol !== null) {
      const parsed = parseFloat(savedVol);
      if (!isNaN(parsed) && parsed >= 0) {
        volume = parsed > 1 && parsed <= 100 ? parsed / 100 : Math.min(1, parsed);
      }
    }
  }
} catch (e) {}

const sounds = {
  tuturu: null,
  nani: null,
  ara_ara: null,
  wow: null,
  arigato: null,
};

function getEffectiveVolume() {
  return Math.round(volume * BASE_VOLUME * 10000) / 10000;
}

function updateAudioVolumes() {
  const eff = getEffectiveVolume();
  for (const key of Object.keys(sounds)) {
    if (sounds[key]) {
      sounds[key].volume = eff;
    }
  }
}

export const SOUND_FILES = {
  tuturu: '/anime/sounds/tuturu.mp3',
  nani: '/anime/sounds/nani.mp3',
  ara_ara: '/anime/sounds/ara_ara.mp3',
  wow: '/anime/sounds/wow.mp3',
  arigato: '/anime/sounds/arigato.mp3',
};

function getAudio(type) {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
  const file = SOUND_FILES[type];
  if (!file) return null;

  if (!sounds[type]) {
    try {
      sounds[type] = new Audio(file);
    } catch (e) {
      return null;
    }
  }
  if (sounds[type]) {
    sounds[type].volume = getEffectiveVolume();
  }
  return sounds[type];
}

export function isSoundMuted() {
  return muted;
}

export function setSoundMuted(val) {
  muted = Boolean(val);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_MUTED, String(muted));
    }
  } catch (e) {}
  return muted;
}

export function toggleSoundMuted() {
  return setSoundMuted(!muted);
}

export function getSoundVolume() {
  return volume;
}

export function getEffectiveSoundVolume() {
  return getEffectiveVolume();
}

export function setSoundVolume(val) {
  let num = Number(val);
  if (isNaN(num)) return volume;
  if (num > 1 && num <= 100) {
    num = num / 100;
  }
  volume = Math.max(0, Math.min(1, num));
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_VOLUME, String(volume));
    }
  } catch (e) {}
  updateAudioVolumes();
  return volume;
}

export function playAnimeSound(type, theme) {
  // Hard theme gate: Never play any anime sounds unless in Sakura mode
  if (theme !== 'sakura' || muted || volume <= 0) return false;

  const audio = getAudio(type);
  if (!audio) return false;

  try {
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Silently swallow autoplay policy restrictions or headless browser restrictions
      });
    }
    return true;
  } catch (e) {
    return false;
  }
}
