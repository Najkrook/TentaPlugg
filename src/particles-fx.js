/**
 * Click & Touch Particle Burst System (R2)
 *
 * Spawns transient floating sparkle, heart, and sakura petal particles
 * originating from user click/tap coordinates in Sakura mode.
 *
 * Invariant defenses:
 * 1. Hard-Hiding: Particle elements carry .anime-figure and .kawaii-click-particle.
 * 2. Theme Gating: Strictly active only when getTheme() === 'sakura'.
 * 3. Accessibility: Strictly suppressed under prefers-reduced-motion.
 * 4. Dual-Cleanup: Automatic removal on 'animationend' + 1,000ms safety timeout fallback.
 * 5. Memory Safety: Capped at maximum 40 concurrent particles to prevent DOM accumulation.
 */

export const PARTICLE_GLYPHS = ['✨', '💖', '🌸', '💕', '⭐'];
export const MAX_CONCURRENT_PARTICLES = 40;

const activeParticles = [];
let cleanupListener = null;

/**
 * Purges and unmounts all active particle elements from the DOM.
 */
export function purgeParticles() {
  while (activeParticles.length > 0) {
    const el = activeParticles.pop();
    try {
      if (el && typeof el.remove === 'function') {
        el.remove();
      }
    } catch {}
  }
  if (typeof document !== 'undefined') {
    const remnants = document.querySelectorAll('.kawaii-click-particle');
    remnants.forEach((el) => {
      try {
        el.remove();
      } catch {}
    });
  }
}

/**
 * Returns the current count of active particle elements.
 */
export function getActiveParticleCount() {
  return activeParticles.length;
}

/**
 * Spawns a radial burst of transient floating particles at (x, y).
 *
 * @param {number} x - Client X origin coordinate
 * @param {number} y - Client Y origin coordinate
 * @param {object} [options]
 * @param {number} [options.count] - Number of particles (defaults to 5–7)
 * @param {string} [options.glyph] - Specific glyph to spawn
 * @returns {Array<HTMLElement>} Spawned particle elements
 */
export function spawnParticleBurst(x = 0, y = 0, options = {}) {
  if (typeof document === 'undefined') return [];

  const opts = options || {};

  if (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return [];
  }

  const rawCount = opts.count;
  const count = Number.isFinite(rawCount)
    ? Math.min(100, Math.max(0, Math.floor(rawCount)))
    : Math.floor(Math.random() * 3) + 5;

  const spawned = [];
  const container = document.body || document.documentElement;
  if (!container) return [];

  for (let i = 0; i < count; i++) {
    // Enforce concurrent particle ceiling to prevent memory leaks or DOM buildup
    while (activeParticles.length >= MAX_CONCURRENT_PARTICLES) {
      const oldest = activeParticles.shift();
      try {
        if (oldest && typeof oldest.remove === 'function') {
          oldest.remove();
        }
      } catch {}
    }

    const glyph = opts.glyph || PARTICLE_GLYPHS[Math.floor(Math.random() * PARTICLE_GLYPHS.length)];
    const angle = (2 * Math.PI * i) / count + (Math.random() * 0.4 - 0.2);
    const distance = 30 + Math.random() * 50; // 30–80px
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - (20 + Math.random() * 15); // Upward drift
    const rot = (Math.random() * 240 - 120).toFixed(1);

    const el = document.createElement('span');
    el.className = 'anime-figure kawaii-click-particle';
    el.setAttribute('aria-hidden', 'true');
    el.textContent = glyph;
    el.style.left = `${Math.round(x)}px`;
    el.style.top = `${Math.round(y)}px`;
    el.style.setProperty('--dx', `${dx.toFixed(1)}px`);
    el.style.setProperty('--dy', `${dy.toFixed(1)}px`);
    el.style.setProperty('--rot', `${rot}deg`);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      const idx = activeParticles.indexOf(el);
      if (idx !== -1) {
        activeParticles.splice(idx, 1);
      }
      try {
        if (typeof el.remove === 'function') {
          el.remove();
        }
      } catch {}
    };

    // Dual-cleanup: animationend + 1,000ms safety timeout fallback
    el.addEventListener('animationend', cleanup, { once: true });
    setTimeout(cleanup, 1000);

    container.appendChild(el);
    activeParticles.push(el);
    spawned.push(el);
  }

  return spawned;
}

/**
 * Initializes click/tap particle listeners on the window.
 *
 * @param {Function|string} getTheme - Callback returning the active theme name ('sakura' | 'classic')
 * @returns {Function} Teardown function removing the listener
 */
export function initClickParticles(getTheme) {
  if (typeof window === 'undefined') return () => {};

  if (cleanupListener) {
    cleanupListener();
    cleanupListener = null;
  }

  const handleClick = (e) => {
    const currentTheme = typeof getTheme === 'function' ? getTheme() : getTheme;
    if (currentTheme !== 'sakura') return;

    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const x = typeof e.clientX === 'number' ? e.clientX : 0;
    const y = typeof e.clientY === 'number' ? e.clientY : 0;
    spawnParticleBurst(x, y);
  };

  // Capture phase ensures clicks trigger bursts even if child buttons stop bubbling
  window.addEventListener('click', handleClick, { passive: true, capture: true });

  const teardown = () => {
    window.removeEventListener('click', handleClick, { capture: true });
    purgeParticles();
  };

  cleanupListener = teardown;
  return teardown;
}
