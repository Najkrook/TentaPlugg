// Mascot Dialogue & Poke-and-Talk System
import { playAnimeSound } from './audio.js';

export const MASCOT_QUOTES = [
  {
    jp: '先輩、今日もいっしょにがんばろう！✨',
    kaomoji: '( ๑>ᴗ<๑ )',
    sv: 'Kämpa på, senpai! 💕',
    sound: 'arigato',
  },
  {
    jp: 'すごい！その調子だよ〜！💮',
    kaomoji: '٩(ˊᗜˋ*)و',
    sv: 'Fantastiskt! Fortsätt så! ✨',
    sound: 'wow',
  },
  {
    jp: '一歩ずつ進めば大丈夫！🌸',
    kaomoji: '(ง •̀_•́)ง',
    sv: 'Ett steg i taget så klarar du det! 💕',
    sound: 'tuturu',
  },
  {
    jp: '日本語マスターへの道！🐱',
    kaomoji: '(*^▽^*)',
    sv: 'Vägen till att bli japanska-mästare! 🌸',
    sound: 'tuturu',
  },
  {
    jp: 'ちょっと休憩してもいいんだよ？🍵',
    kaomoji: '(⁎˃ᴗ˂⁎)',
    sv: 'Det är okej att ta en liten tepaus! 💕',
    sound: 'ara_ara',
  },
  {
    jp: 'いつも応援してるよ、先輩！💖',
    kaomoji: '(｡♥‿♥｡)',
    sv: 'Jag hejar alltid på dig, senpai! 💮',
    sound: 'arigato',
  },
  {
    jp: '合格祈願！絶対できるよ！💮',
    kaomoji: '٩(◕‿◕｡)۶',
    sv: 'Bästa tentapeppen! Du fixar det! 🌸',
    sound: 'wow',
  },
  {
    jp: 'えへへ、つんつんしたね？💕',
    kaomoji: '(⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)',
    sv: 'Hehe, petade du på mig? ✨',
    sound: 'ara_ara',
  },
];

let studyQuoteIndex = 0;
let sidebarQuoteIndex = 0;

export function getStudyQuoteIndex() {
  return studyQuoteIndex;
}

export function getSidebarQuoteIndex() {
  return sidebarQuoteIndex;
}

export function getStudyMascotQuote() {
  return MASCOT_QUOTES[studyQuoteIndex];
}

export function getSidebarMascotQuote() {
  return MASCOT_QUOTES[sidebarQuoteIndex];
}

export function cycleStudyMascotQuote() {
  studyQuoteIndex = (studyQuoteIndex + 1) % MASCOT_QUOTES.length;
  return MASCOT_QUOTES[studyQuoteIndex];
}

export function cycleSidebarMascotQuote() {
  sidebarQuoteIndex = (sidebarQuoteIndex + 1) % MASCOT_QUOTES.length;
  return MASCOT_QUOTES[sidebarQuoteIndex];
}

export function resetMascotDialogue() {
  studyQuoteIndex = 0;
  sidebarQuoteIndex = 0;
}

export function pokeStudyMascot(theme, playSoundFn = playAnimeSound) {
  const quote = cycleStudyMascotQuote();
  if (playSoundFn && theme) {
    playSoundFn(quote.sound, theme);
  }
  return quote;
}

export function pokeSidebarMascot(theme, playSoundFn = playAnimeSound) {
  const quote = cycleSidebarMascotQuote();
  if (playSoundFn && theme) {
    playSoundFn(quote.sound, theme);
  }
  return quote;
}

export function pokeMascot(type = 'study', theme, playSoundFn = playAnimeSound) {
  return type === 'sidebar'
    ? pokeSidebarMascot(theme, playSoundFn)
    : pokeStudyMascot(theme, playSoundFn);
}
