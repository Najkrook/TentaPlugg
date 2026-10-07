import { calendarData } from './vocabulary-data.js';

export const CALENDAR_EXCEPTION_DAYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 20, 24];

export const CALENDAR_EXPLANATIONS = {
  1: '一日 (ついたち): Helt oregelbunden läsning. Härstammar från "tsukitachi" (månens uppkomst/nymåne).',
  2: '二日 (ふつか): Urjapansk (wago) läsning med ändelsen -ka.',
  3: '三日 (みっか): Urjapansk läsning med sokuon (dubbelkonsonant) och ändelsen -ka.',
  4: '四日 (よっか): Urjapansk läsning med sokuon och ändelsen -ka. Obs: heter inte "yonnichi"!',
  5: '五日 (いつか): Urjapansk läsning med ändelsen -ka.',
  6: '六日 (むいか): Urjapansk läsning med ändelsen -ka.',
  7: '七日 (なのか): Urjapansk läsning med ändelsen -ka.',
  8: '八日 (ようか): Urjapansk läsning med lång vokal (you/yō) och ändelsen -ka.',
  9: '九日 (ここのか): Urjapansk läsning med ändelsen -ka.',
  10: '十日 (とおか): Urjapansk läsning med lång vokal (too/tō/tou) och ändelsen -ka.',
  11: '十一日 (じゅういちにち): Regelbunden form: räkneordet 11 (じゅういち) + -nichi.',
  12: '十二日 (じゅうににち): Regelbunden form: räkneordet 12 (じゅうに) + -nichi.',
  13: '十三日 (じゅうさんにち): Regelbunden form: räkneordet 13 (じゅうさん) + -nichi.',
  14: '十四日 (じゅうよっか): Undantag! Kombinerar juu (10) med det oregelbundna "yokka" (4:e). Heter inte "juuyonnichi".',
  15: '十五日 (じゅうごにち): Regelbunden form: räkneordet 15 (じゅうご) + -nichi.',
  16: '十六日 (じゅうろくにち): Regelbunden form: räkneordet 16 (じゅうろく) + -nichi.',
  17: '十七日 (じゅうしちにち): Ljudval: 7 uttalas här "shichi" (inte "nana") följt av -nichi.',
  18: '十八日 (じゅうはちにち): Regelbunden form: räkneordet 18 (じゅうはち) + -nichi.',
  19: '十九日 (じゅうくにち): Ljudval: 9 uttalas här "ku" (inte "kyuu") följt av -nichi.',
  20: '二十日 (はつか): Helt unikt ord! Använder den urgamla japanska läsningen "hatsuka" istället för "nijuunichi".',
  21: '二十一日 (にじゅういちにち): Regelbunden form: räkneordet 21 (にじゅういち) + -nichi.',
  22: '二十二日 (にじゅうににち): Regelbunden form: räkneordet 22 (にじゅうに) + -nichi.',
  23: '二十三日 (にじゅうさんにち): Regelbunden form: räkneordet 23 (にじゅうさん) + -nichi.',
  24: '二十四日 (にじゅうよっか): Undantag! Kombinerar nijuu (20) med det oregelbundna "yokka" (4:e). Heter inte "nijuuyonnichi".',
  25: '二十五日 (にじゅうごにち): Regelbunden form: räkneordet 25 (にじゅうご) + -nichi.',
  26: '二十六日 (にじゅうろくにち): Regelbunden form: räkneordet 26 (にじゅうろく) + -nichi.',
  27: '二十七日 (にじゅうしちにち): Ljudval: 7 uttalas här "shichi" (inte "nana") följt av -nichi.',
  28: '二十八日 (にじゅうはちにち): Regelbunden form: räkneordet 28 (にじゅうはち) + -nichi.',
  29: '二十九日 (にじゅうくにち): Ljudval: 9 uttalas här "ku" (inte "kyuu") följt av -nichi.',
  30: '三十日 (さんじゅうにち): Regelbunden form: räkneordet 30 (さんじゅう) + -nichi.',
  31: '三十一日 (さんじゅういちにち): Regelbunden form: räkneordet 31 (さんじゅういち) + -nichi.',
};

/**
 * Genererar en komplett lista av svarsalias för ett datum,
 * inklusive kana, Hepburn-romaji, dubbla vokaler, makron och vanliga transkriptioner.
 */
export function buildDayAnswers(entry) {
  const ans = new Set();
  if (entry.kana) ans.add(entry.kana);
  if (entry.romaji) ans.add(entry.romaji);

  // Kända specialalias per dag
  const customAliases = {
    1: ['tuitati'],
    2: ['hutuka'],
    5: ['ituka'],
    8: ['yōka', 'yooka', 'yoka'],
    10: ['tōka', 'touka', 'toka'],
    11: ['jūichinichi', 'zyuuitiniti'],
    12: ['jūninichi', 'zyuuniniti'],
    13: ['jūsannichi', 'zyuusanniti'],
    14: ['jūyokka', 'zyuuyokka'],
    15: ['jūgonichi', 'zyuugoniti'],
    16: ['jūrokunichi', 'zyuurokuniti'],
    17: ['jūshichinichi', 'zyuusitinici', 'juushitinichi'],
    18: ['jūhachinichi', 'zyuuhaciniti'],
    19: ['jūkunichi', 'zyuukuniti'],
    20: ['hatuka'],
    21: ['nijūichinichi'],
    22: ['nijūninichi'],
    23: ['nijūsannichi'],
    24: ['nijūyokka'],
    25: ['nijūgonichi'],
    26: ['nijūrokunichi'],
    27: ['nijūshichinichi', 'nijuushitinichi'],
    28: ['nijūhachinichi'],
    29: ['nijūkunichi'],
    30: ['sanjūnichi'],
    31: ['sanjūichinichi'],
  };

  const dayAliases = customAliases[entry.day] || [];
  for (const a of dayAliases) {
    ans.add(a);
  }

  // Automatiska härledda alias från romaji
  if (entry.romaji) {
    // juu -> jū
    if (entry.romaji.includes('juu')) {
      ans.add(entry.romaji.replace(/juu/g, 'jū'));
    }
    // ou -> ō / oo
    if (entry.romaji.includes('ou')) {
      ans.add(entry.romaji.replace(/ou/g, 'ō'));
      ans.add(entry.romaji.replace(/ou/g, 'oo'));
    }
    // oo -> ō / ou
    if (entry.romaji.includes('oo')) {
      ans.add(entry.romaji.replace(/oo/g, 'ō'));
      ans.add(entry.romaji.replace(/oo/g, 'ou'));
    }
  }

  return Array.from(ans);
}

export const calendarDayQuestions = (calendarData?.days_of_month || []).map((entry) => {
  const isException = CALENDAR_EXCEPTION_DAYS.includes(entry.day);
  const suffix = entry.day === 1 || entry.day === 2 || entry.day === 21 || entry.day === 22 || entry.day === 31 ? ':a' : ':e';
  const prompt = `Den ${entry.day}${suffix}`;

  return {
    id: `calendar-day-${entry.day}`,
    topic: 'Dagar',
    set: 'calendar-days',
    type: 'calendar-day',
    dayNumber: entry.day,
    kanji: entry.kanji,
    kana: entry.kana,
    romaji: entry.romaji,
    sv: entry.sv || prompt,
    prompt,
    subprompt: `Månadens ${entry.day}${suffix} dag`,
    promptLang: 'sv',
    answerLang: 'ja',
    isException,
    explanation: CALENDAR_EXPLANATIONS[entry.day] || `${entry.kanji} (${entry.kana}): Regelbunden form.`,
    answers: buildDayAnswers(entry),
    source: 'Kalenderövning (Månadens dagar)',
  };
});

export function getCalendarDayIds(mode = 'all') {
  if (mode === 'first10') {
    return calendarDayQuestions.filter((q) => q.dayNumber <= 10).map((q) => q.id);
  }
  if (mode === 'exceptions') {
    return calendarDayQuestions.filter((q) => q.isException).map((q) => q.id);
  }
  return calendarDayQuestions.map((q) => q.id);
}
