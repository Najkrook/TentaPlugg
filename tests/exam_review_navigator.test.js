import test from 'node:test';
import assert from 'node:assert/strict';

import { sessionView, questionJumpTemplate } from '../src/views/session.js';
import { questions } from '../src/data.js';

function renderToString(result) {
  if (result === null || result === undefined || result === false) return '';
  if (typeof result === 'string') return result;
  if (typeof result === 'number' || typeof result === 'boolean') return String(result);
  if (Array.isArray(result)) return result.map(renderToString).join('');
  if (result.strings && Array.isArray(result.values)) {
    let out = '';
    for (let i = 0; i < result.strings.length; i++) {
      out += result.strings[i];
      if (i < result.values.length) {
        out += renderToString(result.values[i]);
      }
    }
    return out.replace(/>\s+(\d+)\s+</g, '>$1<');
  }
  return '';
}

function relativeLuminance(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const srgb = [r, g, b].map((val) =>
    val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (brighter + 0.05) / (darker + 0.05);
}

test('Exam navigator: taking exam before submit only shows neutral answered/current states', () => {
  const q1 = questions[0].id;
  const q2 = questions[1].id;
  const q3 = questions[2].id;

  const ctx = {
    session: {
      mode: 'exam',
      ids: [q1, q2, q3],
      index: 0,
      answers: {
        [q1]: 'svar1',
        // q2 unanswered
      },
      grades: {},
      review: false,
      submittedAt: undefined,
    },
    state: { stats: {} },
    jump: () => {},
  };

  const html = renderToString(questionJumpTemplate(ctx));

  // Should NOT leak correct/incorrect/pending during active exam
  assert.ok(!html.includes('correct'), 'Must not reveal correct status during exam');
  assert.ok(!html.includes('incorrect'), 'Must not reveal incorrect status during exam');
  assert.ok(!html.includes('pending'), 'Must not reveal pending status during exam');

  // Should show answered on q1 and current on index 0
  assert.match(html, /class="current answered"[^>]*>1<\/button>/);
  assert.match(html, /class=""[^>]*>2<\/button>/);
  assert.match(html, /aria-label="Fråga 1 \(besvarad\)"/);
  assert.match(html, /aria-label="Fråga 2"/);
});

test('Exam navigator: review mode marks correct (green), incorrect (red), and pending (yellow)', () => {
  const q1 = questions[0].id;
  const q2 = questions[1].id;
  const q3 = questions[2].id;

  const ctx = {
    session: {
      mode: 'exam',
      ids: [q1, q2, q3],
      index: 1,
      answers: {
        [q1]: 'rätt',
        [q2]: 'fel',
        [q3]: 'fritext',
      },
      grades: {
        [q1]: true,
        [q2]: false,
        // q3 is undefined (self-assessment pending)
      },
      review: true,
      submittedAt: 12345678,
    },
    state: { stats: {} },
    jump: () => {},
  };

  const html = renderToString(questionJumpTemplate(ctx));

  // q1 (index 0) is correct
  assert.match(html, /class="correct"[^>]*aria-label="Fråga 1 \(Rätt\)"[^>]*>1<\/button>/);

  // q2 (index 1) is current and incorrect
  assert.match(html, /class="current incorrect"[^>]*aria-label="Fråga 2 \(Fel\)"[^>]*>2<\/button>/);

  // q3 (index 2) is pending self-assessment
  assert.match(html, /class="pending"[^>]*aria-label="Fråga 3 \(Behöver kontrolleras\)"[^>]*>3<\/button>/);
});

test('Exam navigator: pending question updates dynamically when graded', () => {
  const qId = questions[0].id;

  const ctx = {
    session: {
      mode: 'exam',
      ids: [qId],
      index: 0,
      answers: { [qId]: 'eget svar' },
      grades: {},
      review: true,
    },
    state: { stats: {} },
    jump: () => {},
  };

  // Initially pending
  let html = renderToString(questionJumpTemplate(ctx));
  assert.ok(html.includes('pending'));
  assert.ok(html.includes('(Behöver kontrolleras)'));

  // User grades as good (kunde detta)
  ctx.session.grades[qId] = true;
  html = renderToString(questionJumpTemplate(ctx));
  assert.ok(html.includes('correct'));
  assert.ok(html.includes('(Rätt)'));
  assert.ok(!html.includes('pending'));

  // User updates grade to again (behöver öva mer)
  ctx.session.grades[qId] = false;
  html = renderToString(questionJumpTemplate(ctx));
  assert.ok(html.includes('incorrect'));
  assert.ok(html.includes('(Fel)'));
  assert.ok(!html.includes('pending'));
});

test('Exam navigator: resultView summary marks ok, wrong, and pending', () => {
  const q1 = questions[0].id;
  const q2 = questions[1].id;
  const q3 = questions[2].id;

  const ctx = {
    session: {
      attemptId: 'test-exam-attempt',
      mode: 'exam',
      ids: [q1, q2, q3],
      index: 0,
      answers: { [q1]: 'a', [q2]: 'b', [q3]: 'c' },
      grades: { [q1]: true, [q2]: false }, // q3 pending
      done: true,
    },
    state: { stats: {}, attempts: {}, history: [] },
    review: () => {},
    exit: () => {},
  };

  const html = renderToString(sessionView(ctx));
  assert.ok(html.includes('result-marker ok'));
  assert.ok(html.includes('result-marker wrong'));
  assert.ok(html.includes('result-marker pending'));
});

test('Contrast verification: Review button palettes comply with WCAG AA (>= 4.5:1)', () => {
  // Classic theme
  const classicCorrectBg = '#e0edcd';
  const classicCorrectText = '#20552d';
  assert.ok(
    contrastRatio(classicCorrectBg, classicCorrectText) >= 4.5,
    `Classic correct contrast (${contrastRatio(classicCorrectBg, classicCorrectText).toFixed(2)}) must be >= 4.5`,
  );

  const classicIncorrectBg = '#fbeae5';
  const classicIncorrectText = '#8c221d';
  assert.ok(
    contrastRatio(classicIncorrectBg, classicIncorrectText) >= 4.5,
    `Classic incorrect contrast (${contrastRatio(classicIncorrectBg, classicIncorrectText).toFixed(2)}) must be >= 4.5`,
  );

  const classicPendingBg = '#fef3d6';
  const classicPendingText = '#744707';
  assert.ok(
    contrastRatio(classicPendingBg, classicPendingText) >= 4.5,
    `Classic pending contrast (${contrastRatio(classicPendingBg, classicPendingText).toFixed(2)}) must be >= 4.5`,
  );

  // Sakura theme
  const sakuraCorrectBg = '#eaf5e6';
  const sakuraCorrectText = '#1b5e20';
  assert.ok(
    contrastRatio(sakuraCorrectBg, sakuraCorrectText) >= 4.5,
    `Sakura correct contrast (${contrastRatio(sakuraCorrectBg, sakuraCorrectText).toFixed(2)}) must be >= 4.5`,
  );

  const sakuraIncorrectBg = '#ffebee';
  const sakuraIncorrectText = '#991b1b';
  assert.ok(
    contrastRatio(sakuraIncorrectBg, sakuraIncorrectText) >= 4.5,
    `Sakura incorrect contrast (${contrastRatio(sakuraIncorrectBg, sakuraIncorrectText).toFixed(2)}) must be >= 4.5`,
  );

  const sakuraPendingBg = '#fff8e1';
  const sakuraPendingText = '#7c4a03';
  assert.ok(
    contrastRatio(sakuraPendingBg, sakuraPendingText) >= 4.5,
    `Sakura pending contrast (${contrastRatio(sakuraPendingBg, sakuraPendingText).toFixed(2)}) must be >= 4.5`,
  );
});
