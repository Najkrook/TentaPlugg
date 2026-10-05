import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  playAnimeSound,
  isSoundMuted,
  setSoundMuted,
  toggleSoundMuted,
  getSoundVolume,
  setSoundVolume,
  getEffectiveSoundVolume,
} from '../src/audio.js';

test('anime sound files exist on disk with valid file size (>10KB)', () => {
  const sounds = ['tuturu.mp3', 'nani.mp3', 'ara_ara.mp3', 'wow.mp3', 'arigato.mp3'];
  for (const sound of sounds) {
    const filePath = path.resolve('public/anime/sounds', sound);
    assert.ok(fs.existsSync(filePath), `File ${sound} should exist in public/anime/sounds/`);
    const stat = fs.statSync(filePath);
    assert.ok(
      stat.size > 10000,
      `File ${sound} should be greater than 10KB (actual: ${stat.size})`,
    );
  }
});

test('playAnimeSound strictly gates playback by theme (never plays in classic mode)', () => {
  setSoundMuted(false);
  assert.equal(playAnimeSound('tuturu', 'classic'), false, 'Must not play in classic mode');
  assert.equal(playAnimeSound('nani', 'classic'), false, 'Must not play in classic mode');
  assert.equal(playAnimeSound('ara_ara', 'classic'), false, 'Must not play in classic mode');
  assert.equal(playAnimeSound('wow', 'classic'), false, 'Must not play in classic mode');
  assert.equal(playAnimeSound('arigato', 'classic'), false, 'Must not play in classic mode');
  assert.equal(playAnimeSound('tuturu', undefined), false, 'Must not play without theme');
  assert.equal(playAnimeSound('tuturu', 'dark'), false, 'Must not play in unknown theme');
});

test('playAnimeSound respects mute toggle state', () => {
  setSoundMuted(true);
  assert.equal(isSoundMuted(), true);
  assert.equal(playAnimeSound('tuturu', 'sakura'), false, 'Must not play when muted');

  setSoundMuted(false);
  assert.equal(isSoundMuted(), false);

  toggleSoundMuted();
  assert.equal(isSoundMuted(), true);
  toggleSoundMuted();
  assert.equal(isSoundMuted(), false);
});

test('sound volume is lowered to 50% by default and controls effective audio level', () => {
  setSoundVolume(0.5);
  assert.equal(getSoundVolume(), 0.5, 'Default volume should be 50%');
  // Previous level was 0.45; 50% of 0.45 is 0.225
  assert.equal(getEffectiveSoundVolume(), 0.225, 'Effective volume must be 50% of previous 0.45');
});

test('setSoundVolume correctly sets volume, handles percentages, and clamps boundaries', () => {
  setSoundVolume(0.8);
  assert.equal(getSoundVolume(), 0.8);
  assert.equal(getEffectiveSoundVolume(), 0.36);

  // Percentage input (e.g., from range slider 0..100)
  setSoundVolume(30);
  assert.equal(getSoundVolume(), 0.3);

  // Clamp below 0
  setSoundVolume(-0.2);
  assert.equal(getSoundVolume(), 0);
  assert.equal(getEffectiveSoundVolume(), 0);
  assert.equal(playAnimeSound('tuturu', 'sakura'), false, 'Must not play when volume is 0');

  // Clamp above 1
  setSoundVolume(120);
  assert.equal(getSoundVolume(), 1);
  assert.equal(getEffectiveSoundVolume(), 0.45);

  // Reset to default 50%
  setSoundVolume(0.5);
  assert.equal(getSoundVolume(), 0.5);
});

test('CSS hard-hides sound-slider-wrapper and sound-slider outside Sakura mode', () => {
  const css = fs.readFileSync(path.resolve('src/style.css'), 'utf8');
  assert.ok(css.includes(':root:not([data-theme=\'sakura\']) .sound-slider-wrapper'));
  assert.ok(css.includes(':root:not([data-theme=\'sakura\']) .sound-slider'));
  assert.ok(css.includes('[data-theme=\'classic\'] .sound-slider-wrapper'));
  assert.ok(css.includes('[data-theme=\'classic\'] .sound-slider'));
});

