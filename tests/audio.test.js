import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { playAnimeSound, isSoundMuted, setSoundMuted, toggleSoundMuted } from '../src/audio.js';

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
