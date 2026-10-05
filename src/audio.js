// Audio manager for Sakura / Anime theme sound effects
let muted = false;

try {
  if (typeof localStorage !== 'undefined') {
    muted = localStorage.getItem('tentaplugg-sound-muted') === 'true';
  }
} catch (e) {}

const sounds = {
  tuturu: null,
  nani: null,
  ara_ara: null,
  wow: null,
  arigato: null,
};

function getAudio(type) {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
  const soundFiles = {
    tuturu: '/anime/sounds/tuturu.mp3',
    nani: '/anime/sounds/nani.mp3',
    ara_ara: '/anime/sounds/wow.mp3',
    wow: '/anime/sounds/wow.mp3',
    arigato: '/anime/sounds/arigato.mp3',
  };
  const file = soundFiles[type];
  if (!file) return null;

  if (!sounds[type]) {
    try {
      sounds[type] = new Audio(file);
      sounds[type].volume = 0.45;
    } catch (e) {
      return null;
    }
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
      localStorage.setItem('tentaplugg-sound-muted', String(muted));
    }
  } catch (e) {}
  return muted;
}

export function toggleSoundMuted() {
  return setSoundMuted(!muted);
}

export function playAnimeSound(type, theme) {
  // Hard theme gate: Never play any anime sounds unless in Sakura mode
  if (theme !== 'sakura' || muted) return false;

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
