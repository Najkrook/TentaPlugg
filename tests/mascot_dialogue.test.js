import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { SOUND_FILES, playAnimeSound, setSoundMuted, setSoundVolume } from '../src/audio.js';
import {
  MASCOT_QUOTES,
  getStudyMascotQuote,
  getSidebarMascotQuote,
  getStudyQuoteIndex,
  getSidebarQuoteIndex,
  cycleStudyMascotQuote,
  cycleSidebarMascotQuote,
  resetMascotDialogue,
  pokeStudyMascot,
  pokeSidebarMascot,
  pokeMascot,
} from '../src/mascot-dialogue.js';

test('Audio Sound Mapping: ara_ara maps to /anime/sounds/ara_ara.mp3', () => {
  assert.equal(SOUND_FILES.ara_ara, '/anime/sounds/ara_ara.mp3');
  const filePath = path.resolve('public/anime/sounds/ara_ara.mp3');
  assert.ok(fs.existsSync(filePath), 'ara_ara.mp3 must exist on disk');
  const stat = fs.statSync(filePath);
  assert.ok(stat.size > 10000, `ara_ara.mp3 must be > 10KB (actual: ${stat.size})`);
});

test('Mascot Dialogue Catalogue: rich catalogue with at least 8 quotes and valid schemas', () => {
  assert.ok(
    MASCOT_QUOTES.length >= 8,
    `Catalogue must have at least 8 quotes (found: ${MASCOT_QUOTES.length})`,
  );
  const allowedSounds = ['arigato', 'tuturu', 'wow', 'ara_ara'];

  for (let i = 0; i < MASCOT_QUOTES.length; i++) {
    const q = MASCOT_QUOTES[i];
    assert.ok(
      typeof q.jp === 'string' && q.jp.length > 0,
      `Quote ${i} jp must be non-empty string`,
    );
    assert.ok(
      typeof q.kaomoji === 'string' && q.kaomoji.length > 0,
      `Quote ${i} kaomoji must be non-empty string`,
    );
    assert.ok(
      typeof q.sv === 'string' && q.sv.length > 0,
      `Quote ${i} sv must be non-empty string`,
    );
    assert.ok(
      allowedSounds.includes(q.sound),
      `Quote ${i} sound "${q.sound}" must be one of ${allowedSounds.join(', ')}`,
    );
  }
});

test('Mascot Dialogue Catalogue: starting quote preserves backwards compatibility', () => {
  const initial = MASCOT_QUOTES[0];
  assert.ok(
    initial.jp.includes('先輩、今日もいっしょにがんばろう！✨'),
    'First quote must match test requirement 先輩、今日もいっしょにがんばろう！✨',
  );
  assert.equal(initial.sound, 'arigato', 'First quote sound cue must be arigato');
  assert.equal(initial.sv, 'Kämpa på, senpai! 💕');
  assert.equal(initial.kaomoji, '( ๑>ᴗ<๑ )');
});

test('Dialogue Rotation: sequential cycling and wrap-around for study and sidebar mascots', () => {
  resetMascotDialogue();

  assert.equal(getStudyQuoteIndex(), 0);
  assert.equal(getSidebarQuoteIndex(), 0);
  assert.deepEqual(getStudyMascotQuote(), MASCOT_QUOTES[0]);
  assert.deepEqual(getSidebarMascotQuote(), MASCOT_QUOTES[0]);

  // Cycle study quotes sequentially through all entries and back to 0
  for (let i = 1; i <= MASCOT_QUOTES.length * 2; i++) {
    const nextQ = cycleStudyMascotQuote();
    const expectedIdx = i % MASCOT_QUOTES.length;
    assert.equal(getStudyQuoteIndex(), expectedIdx);
    assert.deepEqual(nextQ, MASCOT_QUOTES[expectedIdx]);
  }

  // Cycle sidebar quotes independently
  for (let i = 1; i <= MASCOT_QUOTES.length; i++) {
    const nextQ = cycleSidebarMascotQuote();
    const expectedIdx = i % MASCOT_QUOTES.length;
    assert.equal(getSidebarQuoteIndex(), expectedIdx);
    assert.deepEqual(nextQ, MASCOT_QUOTES[expectedIdx]);
  }

  resetMascotDialogue();
  assert.equal(getStudyQuoteIndex(), 0);
  assert.equal(getSidebarQuoteIndex(), 0);
});

test('Poke-and-Talk Interaction: pokeStudyMascot and pokeSidebarMascot trigger sound cue', () => {
  resetMascotDialogue();
  setSoundMuted(false);
  setSoundVolume(0.5);

  const playedSounds = [];
  const mockPlaySound = (type, theme) => {
    playedSounds.push({ type, theme });
    return theme === 'sakura';
  };

  const poked1 = pokeStudyMascot('sakura', mockPlaySound);
  assert.deepEqual(poked1, MASCOT_QUOTES[1]);
  assert.equal(playedSounds.length, 1);
  assert.equal(playedSounds[0].type, MASCOT_QUOTES[1].sound);
  assert.equal(playedSounds[0].theme, 'sakura');

  const pokedSidebar = pokeSidebarMascot('sakura', mockPlaySound);
  assert.deepEqual(pokedSidebar, MASCOT_QUOTES[1]);
  assert.equal(playedSounds.length, 2);
  assert.equal(playedSounds[1].type, MASCOT_QUOTES[1].sound);

  // Classic mode gating: poke with theme 'classic' does not trigger playback
  const pokedClassic = pokeMascot('study', 'classic', playAnimeSound);
  assert.ok(pokedClassic); // Returns quote, but playAnimeSound returns false
  assert.equal(playAnimeSound(pokedClassic.sound, 'classic'), false);

  resetMascotDialogue();
});

test('Sidebar Peeking Mascot: asset, CSS classes, and short viewport scroll styling', () => {
  // 1. Asset existence and format
  const assetPath = path.resolve('public/anime/mascot_peek.jpg');
  assert.ok(fs.existsSync(assetPath), 'mascot_peek.jpg must exist in public/anime/');
  const buffer = fs.readFileSync(assetPath);
  assert.ok(buffer.length > 40000, 'mascot_peek.jpg must be > 40KB');
  // JPEG magic bytes
  assert.equal(buffer[0], 0xff);
  assert.equal(buffer[1], 0xd8);
  assert.equal(buffer[2], 0xff);

  // 2. CSS styles for sidebar mascot and sidebar scrollbar
  const css = fs.readFileSync(path.resolve('src/style.css'), 'utf8');

  // Verify .sidebar has overflow properties to prevent clipping on short viewports
  assert.ok(css.includes('overflow-y: auto;'), '.sidebar must have overflow-y: auto;');
  assert.ok(css.includes('overflow-x: hidden;'), '.sidebar must have overflow-x: hidden;');
  assert.ok(css.includes('scrollbar-width: thin;'), '.sidebar must have scrollbar-width: thin;');

  // Verify .sidebar-chibi-card styling under sakura
  assert.ok(css.includes("[data-theme='sakura'] .sidebar-chibi-card"));
  assert.ok(css.includes("[data-theme='sakura'] .sidebar-chibi-img-wrap"));
  assert.ok(css.includes("[data-theme='sakura'] .sidebar-chibi-bubble"));

  // 3. Hard-hiding invariant: .anime-figure is hidden outside sakura
  assert.ok(css.includes(":root:not([data-theme='sakura']) .anime-figure"));
  assert.ok(css.includes("[data-theme='classic'] .anime-figure"));
});

test('Sidebar & Home Mascot Markup: Lit-HTML source code verifies dual-layer hard-hiding', () => {
  const mainJs = fs.readFileSync(path.resolve('src/main.js'), 'utf8');

  // Verify sidebar mascot is rendered conditionally
  assert.ok(
    mainJs.includes("state.theme === 'sakura'"),
    'Sidebar chibi card must be conditioned on state.theme === "sakura"',
  );
  assert.ok(
    mainJs.includes('anime-figure sidebar-chibi-card'),
    'Sidebar chibi card must include anime-figure sidebar-chibi-card classes',
  );
  assert.ok(
    mainJs.includes('/anime/mascot_peek.jpg'),
    'Sidebar chibi card must use /anime/mascot_peek.jpg',
  );
  assert.ok(
    mainJs.includes('sidebar-chibi-bubble'),
    'Sidebar chibi card must include sidebar-chibi-bubble',
  );
  assert.ok(
    mainJs.includes('pokeSidebarMascot'),
    'Sidebar chibi card must wire pokeSidebarMascot interaction',
  );

  const homeJs = fs.readFileSync(path.resolve('src/views/home.js'), 'utf8');
  assert.ok(
    homeJs.includes("ctx.theme === 'sakura'"),
    'Home study mascot must be conditioned on ctx.theme === "sakura"',
  );
  assert.ok(
    homeJs.includes('anime-study-avatar-btn'),
    'Home mascot must include anime-study-avatar-btn',
  );
  assert.ok(
    homeJs.includes('onPokeStudy') || homeJs.includes('pokeStudyMascot'),
    'Home mascot must wire pokeStudy interaction',
  );
});
