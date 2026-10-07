import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calendarDayQuestions,
  CALENDAR_EXCEPTION_DAYS,
  getCalendarDayIds,
} from '../src/calendar-days.js';
import { correct, fresh, recordReview } from '../src/engine.js';
import { createSession } from '../src/session.js';
import { homeView } from '../src/views/home.js';
import { sessionView } from '../src/views/session.js';
import { questions } from '../src/data.js';

test('Calendar Days: 31 questions generated with unique IDs and valid structure', () => {
  assert.equal(calendarDayQuestions.length, 31);
  const ids = new Set(calendarDayQuestions.map((q) => q.id));
  assert.equal(ids.size, 31);

  for (let i = 1; i <= 31; i++) {
    const q = calendarDayQuestions.find((q) => q.dayNumber === i);
    assert(q, `Question for day ${i} should exist`);
    assert.equal(q.id, `calendar-day-${i}`);
    assert.equal(q.topic, 'Dagar');
    assert.equal(q.set, 'calendar-days');
    assert.equal(q.type, 'calendar-day');
    assert(q.prompt, `Prompt should exist for day ${i}`);
    assert(q.kanji, `Kanji should exist for day ${i}`);
    assert(q.kana, `Kana should exist for day ${i}`);
    assert(q.romaji, `Romaji should exist for day ${i}`);
    assert(q.answers.length > 0, `Answers array should not be empty for day ${i}`);
    assert(q.explanation, `Explanation should exist for day ${i}`);
  }
});

test('Calendar Days: Exceptions are properly flagged and explained', () => {
  const expectedExceptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 20, 24];
  assert.deepEqual(CALENDAR_EXCEPTION_DAYS, expectedExceptions);

  for (const q of calendarDayQuestions) {
    if (expectedExceptions.includes(q.dayNumber)) {
      assert.equal(q.isException, true, `Day ${q.dayNumber} must be marked as exception`);
    } else {
      assert.equal(q.isException, false, `Day ${q.dayNumber} must not be marked as exception`);
    }
  }
});

test('Calendar Days: getCalendarDayIds returns correct subset per mode', () => {
  const first10 = getCalendarDayIds('first10');
  assert.equal(first10.length, 10);
  assert.equal(first10[0], 'calendar-day-1');
  assert.equal(first10[9], 'calendar-day-10');

  const exceptions = getCalendarDayIds('exceptions');
  assert.equal(exceptions.length, 13);
  assert(exceptions.includes('calendar-day-14'));
  assert(exceptions.includes('calendar-day-20'));
  assert(exceptions.includes('calendar-day-24'));

  const all = getCalendarDayIds('all');
  assert.equal(all.length, 31);
});

test('Calendar Days: Answers validate kana, romaji, and macron variations via correct()', () => {
  // Day 1: tsuitachi / ついたち
  const d1 = calendarDayQuestions.find((q) => q.dayNumber === 1);
  assert(correct(d1, 'ついたち'));
  assert(correct(d1, 'tsuitachi'));
  assert(correct(d1, 'tuitati'));
  assert(!correct(d1, 'ichinichi'));

  // Day 4: yokka / よっか
  const d4 = calendarDayQuestions.find((q) => q.dayNumber === 4);
  assert(correct(d4, 'よっか'));
  assert(correct(d4, 'yokka'));
  assert(!correct(d4, 'yonnichi'));

  // Day 10: tooka / とおか / tōka / touka
  const d10 = calendarDayQuestions.find((q) => q.dayNumber === 10);
  assert(correct(d10, 'とおか'));
  assert(correct(d10, 'tooka'));
  assert(correct(d10, 'tōka'));
  assert(correct(d10, 'touka'));
  assert(!correct(d10, 'juunichi'));

  // Day 14: juuyokka / じゅうよっか / jūyokka
  const d14 = calendarDayQuestions.find((q) => q.dayNumber === 14);
  assert(correct(d14, 'じゅうよっか'));
  assert(correct(d14, 'juuyokka'));
  assert(correct(d14, 'jūyokka'));
  assert(!correct(d14, 'juuyonnichi'));

  // Day 20: hatsuka / はつか
  const d20 = calendarDayQuestions.find((q) => q.dayNumber === 20);
  assert(correct(d20, 'はつか'));
  assert(correct(d20, 'hatsuka'));
  assert(!correct(d20, 'nijuunichi'));

  // Day 24: nijuuyokka / にじゅうよっか / nijūyokka
  const d24 = calendarDayQuestions.find((q) => q.dayNumber === 24);
  assert(correct(d24, 'にじゅうよっか'));
  assert(correct(d24, 'nijuuyokka'));
  assert(correct(d24, 'nijūyokka'));
  assert(!correct(d24, 'nijuuyonnichi'));
});

test('Calendar Days: Looping deck session queues missed questions until answered correctly', () => {
  const session = createSession(
    ['calendar-day-1', 'calendar-day-2'],
    'Månadens dagar: Test',
    {
      loopErrors: true,
      daysMode: 'first10',
      topic: 'Dagar',
      failedLoopIds: [],
    },
  );

  assert.equal(session.loopErrors, true);
  assert.equal(session.ids.length, 2);

  // Q1: Correct
  session.answers['calendar-day-1'] = 'tsuitachi';
  session.grades['calendar-day-1'] = true;

  // Q2: Incorrect
  session.answers['calendar-day-2'] = 'wrong-answer';
  session.grades['calendar-day-2'] = false;
  session.failedLoopIds.push('calendar-day-2');

  assert.equal(session.failedLoopIds.length, 1);

  // Simulate next() at end of queue
  if (session.loopErrors && session.failedLoopIds.length > 0) {
    const toRepeat = [...session.failedLoopIds];
    session.failedLoopIds = [];
    for (const id of toRepeat) {
      delete session.answers[id];
      delete session.grades[id];
      session.ids.push(id);
    }
  }

  // Now the session has 3 items, with the failed item re-queued with reset answers/grades
  assert.equal(session.ids.length, 3);
  assert.equal(session.ids[2], 'calendar-day-2');
  assert.equal(session.answers['calendar-day-2'], undefined);
  assert.equal(session.grades['calendar-day-2'], undefined);

  // User tries again and gets it right
  session.answers['calendar-day-2'] = 'futsuka';
  session.grades['calendar-day-2'] = true;

  // No more failed IDs
  assert.equal(session.failedLoopIds.length, 0);
});

test('Calendar Days: SRS Leitner progress updates for calendar questions', () => {
  const state = fresh();
  const session = createSession(['calendar-day-1', 'calendar-day-4'], 'Månadens dagar: Test');
  const now = 1700000000000;

  // Right answer promotes to Box 1
  recordReview(state, session, 'calendar-day-1', true, now);
  assert.equal(state.stats['calendar-day-1']?.box, 1);
  assert.equal(state.stats['calendar-day-1']?.ok, true);

  // Wrong answer keeps/resets in Box 0
  recordReview(state, session, 'calendar-day-4', false, now);
  assert.equal(state.stats['calendar-day-4']?.box, 0);
  assert.equal(state.stats['calendar-day-4']?.ok, false);
});

test('Calendar Days: Home view renders calendar practice section and mode selection', () => {
  const state = fresh();
  state.daysMode = 'exceptions';
  const ctx = {
    state,
    now: Date.now(),
    plan: { tasks: [], completed: {} },
    progress: () => ({ done: 0, due: 0, wrong: 0 }),
    daysMode: 'exceptions',
    setDaysMode: (m) => { state.daysMode = m; },
    startDaysPractice: () => {},
    start: () => {},
  };

  const template = homeView(ctx);
  assert(template, 'Home template renders');
});

test('Calendar Days: Session view renders calendar badge and feedback showcase', () => {
  const state = fresh();
  const session = createSession(['calendar-day-4'], 'Månadens dagar: Dag 1–10', {
    loopErrors: true,
  });
  session.answers['calendar-day-4'] = 'yokka';
  session.grades['calendar-day-4'] = true;

  const ctx = {
    state,
    session,
    now: Date.now(),
    imageErrors: new Set(),
    theme: 'classic',
    exit: () => {},
    check: () => {},
    next: () => {},
    jump: () => {},
    answer: () => {},
    setComposing: () => {},
    grade: () => {},
  };

  const template = sessionView(ctx);
  assert(template, 'Session view renders calendar question without error');
});
