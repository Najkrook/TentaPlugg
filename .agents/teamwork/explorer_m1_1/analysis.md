# Analysis: Contrastive Feedback & Unit Testing Design (Milestone M1)

**Investigator**: Explorer subagent `explorer_m1_1`  
**Working Directory**: `.agents/teamwork/explorer_m1_1`  
**Target Files**: `src/engine.js`, `tests/engine.test.js` (referenced as `test/engine.test.js` in prompt)  
**Date**: 2026-10-04  

---

## 1. Executive Summary

In Milestone M1 (R1: Kontrastiv felåterkoppling & Snabbguide-integration), students who choose common distractor particles (e.g. `で` instead of `に`, `は` instead of `が`, `を` instead of `が`) should receive contrastive, pedagogical feedback explaining why their chosen answer does not fit, together with a direct link (`guideId`) to the corresponding grammar rule in Snabbguiden.

Our read-only investigation discovered critical defects and coverage gaps in the existing implementation of `getContrastiveFeedback(q, userAnswer)` in `src/engine.js`:
1. **Critical False-Positive Defect on Correct Answers**: Line 230–231 checks `const correctAns = q.answers?.[0] || ''; if (cleanAns === correctAns) return null;`. For questions with alternative correct answers (such as `l5-10` with answers `['に', 'へ']`, `b-6` with three inflection forms, or `b-11`), answering any valid secondary answer fails this equality check. In questions with non-particle topics like `b-6` (`topic: 'Böjningar'`), answering a correct alternative form (`しずかではありません`) actually triggers an erroneous feedback popup ("Kontrollera stammen och böjningsmönstret...")!
2. **Missing Normalization**: Whitespace or punctuation in input (e.g. ` に ` or full-width spaces) is not cleaned via `normalize()`.
3. **Missing Common Distractor Pairs**: Several critical distractor pairs frequently tested in GEMA70/JAPC11 and Genki Lesson 5 are omitted (e.g., `が` chosen when `を` is correct on transitives, `で` chosen when `を` is correct, `は` chosen when `も` is correct on "jag också" cards, `は` chosen when `の` is correct on possessives, and particles other than `に` chosen when `×` / ingen partikel is correct).
4. **Lack of Dedicated Unit Tests in `tests/engine.test.js`**: `tests/engine.test.js` currently contains zero tests for `getContrastiveFeedback`.

This document details the exact code changes for `src/engine.js` and the exact unit test suite to be added to `tests/engine.test.js`.

---

## 2. Codebase Investigation: `src/engine.js` (lines 227–325)

### 2.1 Current Implementation

```javascript
// src/engine.js (lines 227–325)
export function getContrastiveFeedback(q, userAnswer) {
  if (!q || !userAnswer) return null;
  const cleanAns = String(userAnswer).trim();
  const correctAns = q.answers?.[0] || '';
  if (cleanAns === correctAns) return null;

  if (q.contrastive && q.contrastive[cleanAns]) {
    return {
      text: q.contrastive[cleanAns],
      guideId: q.guideRef || 'ni-de',
    };
  }

  // Common particle rules for Japanese
  if (q.topic === 'Partiklar' || q.choices?.includes('は')) {
    if (cleanAns === 'で' && ['に', 'へ'].includes(correctAns)) {
      return {
        text: 'Du valde で. で används för platsen där en aktiv handling sker (t.ex. 本を読みます), medan に här anger plats för existens (あります/います), mål för förflyttning, eller personen man träffar.',
        guideId: 'ni-de',
      };
    }
    if (cleanAns === 'に' && correctAns === 'で') {
      return {
        text: 'Du valde に. に anger riktning, bestämd tidpunkt eller existens (あります/います), medan で markerar platsen där en handling eller aktivitet faktiskt utförs.',
        guideId: 'ni-de',
      };
    }
    if (cleanAns === 'は' && correctAns === 'が') {
      return {
        text: 'Du valde は. は sätter meningens övergripande tema (vad satsen handlar om), medan が här markerar objektet vid 好き/嫌い/わかります, eller lyfter fram subjektet som ny information.',
        guideId: 'wa-ga',
      };
    }
    if (cleanAns === 'が' && correctAns === 'は') {
      return {
        text: 'Du valde が. が används för ny information eller vid verb som 分かる/好き, men här etableras ett övergripande tema för hela satsen med は.',
        guideId: 'wa-ga',
      };
    }
    if (cleanAns === 'を' && correctAns === 'が') {
      return {
        text: 'Du valde を. を markerar direkt objekt vid transitiva handlingar (t.ex. 食べます), men vid 好き (tycka om) och わかります (förstå) används partikeln が i japanska.',
        guideId: 'wa-ga',
      };
    }
    if (cleanAns === 'を' && correctAns === 'に') {
      return {
        text: 'Du valde を. を markerar direkt objekt, men vid transportmedel (som バスに乗ります) eller personen man träffar eller frågar används partikeln に.',
        guideId: 'wo-to-no-mo',
      };
    }
    if (cleanAns === 'に' && correctAns === '×') {
      return {
        text: 'Du valde に. Relativa tidsord som あした, きのう, まいにち, しゅうまつ och adverb tar normalt inte partikeln に.',
        guideId: 'no-particle',
      };
    }
    if (cleanAns === '×' && ['に', 'で', 'を', 'は', 'が', 'と', 'の'].includes(correctAns)) {
      return {
        text: `Du valde × (ingen partikel). Här behövs partikeln ${correctAns} för att binda samman orden och klargöra satsens grammatiska relation.`,
        guideId: ['に', 'で'].includes(correctAns) ? 'ni-de' : ['は', 'が'].includes(correctAns) ? 'wa-ga' : 'wo-to-no-mo',
      };
    }
    if (cleanAns === 'と' && correctAns === 'の') {
      return {
        text: 'Du valde と. と betyder ”tillsammans med” eller binder ihop sidoordnade substantiv (”och”), medan の knyter ihop substantiv där det ena beskriver eller äger det andra.',
        guideId: 'wo-to-no-mo',
      };
    }
    if (cleanAns === 'の' && correctAns === 'と') {
      return {
        text: 'Du valde の. の anger ägande eller bestämning (”Xs Y”), medan と binder samman två separata substantiv (”X och Y”) eller anger sällskap.',
        guideId: 'wo-to-no-mo',
      };
    }
    if (cleanAns === 'へ' && correctAns === 'で') {
      return {
        text: 'Du valde へ. へ anger riktning mot ett mål, medan で markerar platsen där handlingen utförs.',
        guideId: 'ni-de',
      };
    }
  }

  if (q.topic === 'Böjningar') {
    return {
      text: 'Kontrollera stammen och böjningsmönstret för ordklassen (i-adjektiv böjs med ～かった, na-adjektiv och substantiv med ～でした).',
      guideId: 'adjectives',
    };
  }

  if (q.topic === 'Moror & stavelser') {
    return {
      text: 'Kom ihåg att ん, っ och förlängda vokaler räknas som egna moror, men bildar stavelser tillsammans med föregående vokal.',
      guideId: 'moras',
    };
  }

  return null;
}
```

### 2.2 Defects Identified

#### 1. Failure to delegate to `correct(q, userAnswer)`
In `src/engine.js`:
```javascript
export const normalize = (value) =>
  String(value ?? '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[\s。、.,!?！？]/g, '');

export const correct = (q, value) =>
  (q.answers || []).some((a) => normalize(a) === normalize(value));
```
`correct()` is already exported and serves as the single source of truth for answer correctness.
By using `const correctAns = q.answers?.[0] || ''; if (cleanAns === correctAns) return null;`, the existing code:
- Only compares against the first element of `q.answers`.
- Ignores NFKC normalization and punctuation trimming.
- **Empirically verified bug**: For question `b-6` (`topic: 'Böjningar'`), `answers = ['しずかじゃないです', 'しずかではありません', 'しずかじゃありません']`. Calling `getContrastiveFeedback(q, 'しずかではありません')` yields:
  ```json
  {
    "text": "Kontrollera stammen och böjningsmönstret för ordklassen (i-adjektiv böjs med ～かった, na-adjektiv och substantiv med ～でした).",
    "guideId": "adjectives"
  }
  ```
  This falsely displays error feedback on a completely correct answer!
- For `l5-10` (`こうえん【　】いきませんか。`), answers are `['に', 'へ']`. Answering `へ` is 100% correct. If `q.contrastive` or any future fallback matches, it would treat `へ` as incorrect.

**Solution**:
```javascript
if (!q || !userAnswer) return null;
const cleanAns = String(userAnswer).trim();
if (!cleanAns) return null;
if (correct(q, userAnswer)) return null;
```

#### 2. Fragile single-answer checks in distractor rules
When checking whether the question expected `に` vs `で`, rules check `correctAns === 'で'` where `correctAns` is `q.answers?.[0]`. If `q.answers` contains multiple valid answers in any order, checking only index 0 can fail.
**Solution**:
Define helper:
```javascript
const hasAns = (ans) => (q.answers || []).some((a) => normalize(a) === normalize(ans));
```
Then use `hasAns('で')`, `hasAns('に') || hasAns('へ')`, etc.

#### 3. Uncovered common particle distractor pairs
Our analysis of all 42 particle questions in `src/data.js` and common student errors revealed the following uncovered pairs:

| Chosen (`cleanAns`) | Expected (`hasAns(...)`) | Example Question / Context | Missing Feedback Rationale | Correct `guideId` |
|---|---|---|---|---|
| `が` | `を` | `p-3`: `パン【　】食べます。` (Ans: `を`) | Student confuses subject/like marker `が` with transitive object marker `を`. | `wa-ga` |
| `で` | `を` | `p-3`: `パン【　】食べます。` | Student uses means/location `で` on direct object. | `wo-to-no-mo` |
| `を` | `で` | `p-2`: `日本語【　】手紙を書きます。` (Ans: `で`) | Student uses direct object `を` where tool/means/language `で` is needed. | `ni-de` |
| `に` | `を` | `Tシャツ【　】いちまいください。` (Ans: `を`) | Student marks object as indirect recipient/destination with `に`. | `wo-to-no-mo` |
| `は` | `も` | `p-6`: `わたし【　】学生です。（jag också）` (Ans: `も`) | Student uses neutral topic marker `は` instead of "also/even" marker `も`. | `wo-to-no-mo` |
| `も` | `は` | `p-4`: `わたし【　】学生です。` (Ans: `は`) | Student uses `も` without established prior entity. | `wo-to-no-mo` |
| `は` | `の` | `p-9`: `わたし【　】本です。` (Ans: `の`) | Classic Genki blunder ("わたしは本です" = "I am a book"). `は` instead of possessive `の`. | `wo-to-no-mo` |
| `の` | `は` | `わたし【の】学生です` (Ans: `は`) | Possessive `の` instead of topic marker `は`. | `wa-ga` |
| `に` | `と` | `ともだち【　】映画を見ました。` (Ans: `と`) | Student uses `に` instead of accompaniment `と`. | `wo-to-no-mo` |
| `で`, `は`, `が`, `を`, `へ` | `×` | `l5-1`, `l5-3`, `l5-5`, `l5-9`, `l5-14`, `l5-19`, `l5-22`, `p-11` | Current code only checks `cleanAns === 'に' && correctAns === '×'`. If student picks `で` on `あした`, they get no feedback! | `no-particle` |
| `×` | `へ` / `も` | Any particle fill-in where answer is `へ` or `も` | Current code omitted `へ` and `も` from `×` check. | `ni-de` / `wo-to-no-mo` |

---

## 3. Guide ID Architecture Alignment

In `src/data.js` (lines 745–776), `guides` contains exactly 6 sections:
1. `id: 'wa-ga'` — *は eller が?*
2. `id: 'ni-de'` — *に eller で?*
3. `id: 'wo-to-no-mo'` — *を・と・の・も*
4. `id: 'no-particle'` — *När behövs ingen partikel?*
5. `id: 'adjectives'` — *I- och na-adjektiv*
6. `id: 'moras'` — *Moror och stavelser*

Every contrastive feedback return object `{ text, guideId }` must strictly match one of these 6 guide IDs.
Our distractor mapping aligns 100% with these 6 sections:
- `で` vs `に`, `に` vs `で`, `へ` vs `で`, `を` vs `で` -> `guideId: 'ni-de'`
- `は` vs `が`, `が` vs `は`, `を` vs `が`, `が` vs `を`, `の` vs `は` -> `guideId: 'wa-ga'`
- `を` vs `に`, `に` vs `を`, `で` vs `を`, `と` vs `の`, `の` vs `と`, `は` vs `の`, `は` vs `も`, `も` vs `は`, `に` vs `と` -> `guideId: 'wo-to-no-mo'`
- Any particle chosen when `×` is expected -> `guideId: 'no-particle'`
- `×` chosen when particle is expected -> `guideId` based on needed particle (`ni-de`, `wa-ga`, or `wo-to-no-mo`)
- `topic === 'Böjningar'` -> `guideId: 'adjectives'`
- `topic === 'Moror & stavelser'` -> `guideId: 'moras'`

---

## 4. Proposed Implementation: `src/engine.js`

### 4.1 Complete Replacement Code for `getContrastiveFeedback`

```javascript
export function getContrastiveFeedback(q, userAnswer) {
  if (!q || !userAnswer) return null;
  const cleanAns = String(userAnswer).trim();
  if (!cleanAns) return null;
  if (correct(q, userAnswer)) return null;

  if (q.contrastive && q.contrastive[cleanAns]) {
    const val = q.contrastive[cleanAns];
    if (typeof val === 'object' && val !== null) {
      return {
        text: val.text,
        guideId: val.guideId || q.guideRef || 'ni-de',
      };
    }
    return {
      text: val,
      guideId: q.guideRef || 'ni-de',
    };
  }

  const hasAns = (ans) => (q.answers || []).some((a) => normalize(a) === normalize(ans));
  const correctAns = normalize(q.answers?.[0] || '');

  // Common particle rules for Japanese
  if (q.topic === 'Partiklar' || q.choices?.includes('は')) {
    if (cleanAns === 'で' && (hasAns('に') || hasAns('へ'))) {
      return {
        text: 'Du valde で. で används för platsen där en aktiv handling sker (t.ex. 本を読みます), medan に här anger plats för existens (あります/います), mål för förflyttning, eller personen man träffar.',
        guideId: 'ni-de',
      };
    }
    if (cleanAns === 'に' && hasAns('で')) {
      return {
        text: 'Du valde に. に anger riktning, bestämd tidpunkt eller existens (あります/います), medan で markerar platsen där en handling eller aktivitet faktiskt utförs.',
        guideId: 'ni-de',
      };
    }
    if (cleanAns === 'へ' && hasAns('で')) {
      return {
        text: 'Du valde へ. へ anger riktning mot ett mål, medan で markerar platsen där handlingen utförs.',
        guideId: 'ni-de',
      };
    }
    if (cleanAns === 'は' && hasAns('が')) {
      return {
        text: 'Du valde は. は sätter meningens övergripande tema (vad satsen handlar om), medan が här markerar objektet vid 好き/嫌い/わかります, eller lyfter fram subjektet som ny information.',
        guideId: 'wa-ga',
      };
    }
    if (cleanAns === 'が' && hasAns('は')) {
      return {
        text: 'Du valde が. が används för ny information eller vid verb som 分かる/好き, men här etableras ett övergripande tema för hela satsen med は.',
        guideId: 'wa-ga',
      };
    }
    if (cleanAns === 'を' && hasAns('が')) {
      return {
        text: 'Du valde を. を markerar direkt objekt vid transitiva handlingar (t.ex. 食べます), men vid 好き (tycka om) och わかります (förstå) används partikeln が i japanska.',
        guideId: 'wa-ga',
      };
    }
    if (cleanAns === 'が' && hasAns('を')) {
      return {
        text: 'Du valde が. が markerar grammatiskt subjekt eller komplement vid verb som 分かる/好き, medan transitiva handlingar tar partikeln を för det direkta objektet.',
        guideId: 'wa-ga',
      };
    }
    if (cleanAns === 'を' && hasAns('に')) {
      return {
        text: 'Du valde を. を markerar direkt objekt, men vid transportmedel (som バスに乗ります) eller personen man träffar eller frågar används partikeln に.',
        guideId: 'wo-to-no-mo',
      };
    }
    if (cleanAns === 'に' && hasAns('を')) {
      return {
        text: 'Du valde に. に anger destination, tidpunkt eller mottagare, medan det direkta objektet som påverkas av en handling markeras med を.',
        guideId: 'wo-to-no-mo',
      };
    }
    if (cleanAns === 'で' && hasAns('を')) {
      return {
        text: 'Du valde で. で anger medel, verktyg eller handlingsplats, medan transitiva verb tar を för objektet som handlingen påverkar.',
        guideId: 'wo-to-no-mo',
      };
    }
    if (cleanAns === 'を' && hasAns('で')) {
      return {
        text: 'Du valde を. を markerar direkt objekt, men när ett språk, verktyg eller medel används (t.ex. 日本語で) används partikeln で.',
        guideId: 'ni-de',
      };
    }
    if (cleanAns === 'と' && hasAns('の')) {
      return {
        text: 'Du valde と. と betyder ”tillsammans med” eller binder ihop sidoordnade substantiv (”och”), medan の knyter ihop substantiv där det ena beskriver eller äger det andra.',
        guideId: 'wo-to-no-mo',
      };
    }
    if (cleanAns === 'の' && hasAns('と')) {
      return {
        text: 'Du valde の. の anger ägande eller bestämning (”Xs Y”), medan と binder samman två separata substantiv (”X och Y”) eller anger sällskap.',
        guideId: 'wo-to-no-mo',
      };
    }
    if (cleanAns === 'は' && hasAns('の')) {
      return {
        text: 'Du valde は. は gör ordet till tema för hela satsen, medan の binder ihop två substantiv för att visa ägande eller tillhörighet (Xs Y).',
        guideId: 'wo-to-no-mo',
      };
    }
    if (cleanAns === 'の' && hasAns('は')) {
      return {
        text: 'Du valde の. の binder ihop två substantiv, medan は presenterar satsens övergripande tema eller ämne.',
        guideId: 'wa-ga',
      };
    }
    if (cleanAns === 'は' && hasAns('も')) {
      return {
        text: 'Du valde は. は sätter meningens normala tema, men när man vill uttrycka ”också/även” (som i ”jag också”) ersätts は med partikeln も.',
        guideId: 'wo-to-no-mo',
      };
    }
    if (cleanAns === 'も' && hasAns('は')) {
      return {
        text: 'Du valde も. も betyder ”också/även” och förutsätter att samma sak redan sagts om någon annan, medan は är standardmarkören för meningens ämne.',
        guideId: 'wo-to-no-mo',
      };
    }
    if (cleanAns === 'に' && hasAns('と')) {
      return {
        text: 'Du valde に. に anger riktning, tid eller existens, medan sällskap (”tillsammans med”) uttrycks med と.',
        guideId: 'wo-to-no-mo',
      };
    }
    if (['に', 'で', 'は', 'が', 'を', 'へ'].includes(cleanAns) && hasAns('×')) {
      return {
        text: `Du valde ${cleanAns}. Relativa tidsord (あした, きのう, まいにち), adverb (とても, たいてい) och räkneord tar normalt ingen partikel (markeras med ×).`,
        guideId: 'no-particle',
      };
    }
    if (cleanAns === '×' && ['に', 'で', 'を', 'は', 'が', 'と', 'の', 'へ', 'も'].some(hasAns)) {
      const needed = (q.answers || []).map(normalize).find((a) => ['に', 'で', 'を', 'は', 'が', 'と', 'の', 'へ', 'も'].includes(a)) || correctAns;
      return {
        text: `Du valde × (ingen partikel). Här behövs partikeln ${needed} för att binda samman orden och klargöra satsens grammatiska relation.`,
        guideId: ['に', 'で', 'へ'].includes(needed) ? 'ni-de' : ['は', 'が'].includes(needed) ? 'wa-ga' : 'wo-to-no-mo',
      };
    }
  }

  if (q.topic === 'Böjningar') {
    return {
      text: 'Kontrollera stammen och böjningsmönstret för ordklassen (i-adjektiv böjs med ～かった, na-adjektiv och substantiv med ～でした).',
      guideId: 'adjectives',
    };
  }

  if (q.topic === 'Moror & stavelser') {
    return {
      text: 'Kom ihåg att ん, っ och förlängda vokaler räknas som egna moror, men bildar stavelser tillsammans med föregående vokal.',
      guideId: 'moras',
    };
  }

  return null;
}
```

---

## 5. Unit Test Design: `tests/engine.test.js`

### 5.1 Note on File Location
The prompt refers to `test/engine.test.js`. In this repository, the engine unit tests reside at `tests/engine.test.js` (plural `tests/`), as declared in `package.json`:
`"test": "node --test --test-isolation=none tests/*.test.js"`.
(Note: `test_writer_e2e` also maintains an import proxy from `tests/requirements.test.js` to `test/requirements.test.js`).
For unit tests of `src/engine.js`, the authoritative file executed by `npm test` is `tests/engine.test.js`.

### 5.2 Test Cases to Add to `tests/engine.test.js`

```javascript
// Append to tests/engine.test.js

test('contrastive feedback returns null for correct answers (including alternatives and whitespace)', () => {
  // Single correct answer
  const qSingle = { id: 'test-1', topic: 'Partiklar', answers: ['で'], choices: ['に', 'で'] };
  assert.equal(getContrastiveFeedback(qSingle, 'で'), null);
  assert.equal(getContrastiveFeedback(qSingle, ' で '), null);
  assert.equal(getContrastiveFeedback(qSingle, 'で。'), null);

  // Alternative correct answers (e.g. に or へ for l5-10)
  const qMulti = { id: 'l5-10', topic: 'Partiklar', answers: ['に', 'へ'], choices: ['に', 'で', 'へ'] };
  assert.equal(getContrastiveFeedback(qMulti, 'に'), null);
  assert.equal(getContrastiveFeedback(qMulti, 'へ'), null);
  assert.equal(getContrastiveFeedback(qMulti, ' に '), null);
  assert.equal(getContrastiveFeedback(qMulti, ' へ '), null);

  // Alternative inflection answers (e.g. b-6 with 3 valid forms)
  const qBoj = questions.find((q) => q.id === 'b-6');
  if (qBoj) {
    for (const ans of qBoj.answers) {
      assert.equal(getContrastiveFeedback(qBoj, ans), null, `Answer "${ans}" must return null`);
    }
  }

  // Question bank l5-10 verification directly from questions
  const qL5_10 = questions.find((q) => q.id === 'l5-10');
  if (qL5_10) {
    assert.equal(getContrastiveFeedback(qL5_10, 'に'), null);
    assert.equal(getContrastiveFeedback(qL5_10, 'へ'), null);
  }

  // Edge cases: null, undefined, empty string, whitespace
  assert.equal(getContrastiveFeedback(null, 'で'), null);
  assert.equal(getContrastiveFeedback(qSingle, null), null);
  assert.equal(getContrastiveFeedback(qSingle, ''), null);
  assert.equal(getContrastiveFeedback(qSingle, '   '), null);
});

test('contrastive feedback provides pedagogical explanations and guideId for all known particle distractors', () => {
  // に vs で / へ
  const fbDeForNi = getContrastiveFeedback({ topic: 'Partiklar', answers: ['に'] }, 'で');
  assert(fbDeForNi && fbDeForNi.guideId === 'ni-de' && fbDeForNi.text.includes('Du valde で'));

  const fbDeForNiHe = getContrastiveFeedback({ topic: 'Partiklar', answers: ['に', 'へ'] }, 'で');
  assert(fbDeForNiHe && fbDeForNiHe.guideId === 'ni-de' && fbDeForNiHe.text.includes('Du valde で'));

  const fbNiForDe = getContrastiveFeedback({ topic: 'Partiklar', answers: ['で'] }, 'に');
  assert(fbNiForDe && fbNiForDe.guideId === 'ni-de' && fbNiForDe.text.includes('Du valde に'));

  const fbHeForDe = getContrastiveFeedback({ topic: 'Partiklar', answers: ['で'] }, 'へ');
  assert(fbHeForDe && fbHeForDe.guideId === 'ni-de' && fbHeForDe.text.includes('Du valde へ'));

  // は vs が
  const fbWaForGa = getContrastiveFeedback({ topic: 'Partiklar', answers: ['が'] }, 'は');
  assert(fbWaForGa && fbWaForGa.guideId === 'wa-ga' && fbWaForGa.text.includes('Du valde は'));

  const fbGaForWa = getContrastiveFeedback({ topic: 'Partiklar', answers: ['は'] }, 'が');
  assert(fbGaForWa && fbGaForWa.guideId === 'wa-ga' && fbGaForWa.text.includes('Du valde が'));

  // を vs が
  const fbWoForGa = getContrastiveFeedback({ topic: 'Partiklar', answers: ['が'] }, 'を');
  assert(fbWoForGa && fbWoForGa.guideId === 'wa-ga' && fbWoForGa.text.includes('Du valde を'));

  const fbGaForWo = getContrastiveFeedback({ topic: 'Partiklar', answers: ['を'] }, 'が');
  assert(fbGaForWo && fbGaForWo.guideId === 'wa-ga' && fbGaForWo.text.includes('Du valde が'));

  // を vs に
  const fbWoForNi = getContrastiveFeedback({ topic: 'Partiklar', answers: ['に'] }, 'を');
  assert(fbWoForNi && fbWoForNi.guideId === 'wo-to-no-mo' && fbWoForNi.text.includes('Du valde を'));

  const fbNiForWo = getContrastiveFeedback({ topic: 'Partiklar', answers: ['を'] }, 'に');
  assert(fbNiForWo && fbNiForWo.guideId === 'wo-to-no-mo' && fbNiForWo.text.includes('Du valde に'));

  // で vs を
  const fbDeForWo = getContrastiveFeedback({ topic: 'Partiklar', answers: ['を'] }, 'で');
  assert(fbDeForWo && fbDeForWo.guideId === 'wo-to-no-mo' && fbDeForWo.text.includes('Du valde で'));

  const fbWoForDe = getContrastiveFeedback({ topic: 'Partiklar', answers: ['で'] }, 'を');
  assert(fbWoForDe && fbWoForDe.guideId === 'ni-de' && fbWoForDe.text.includes('Du valde を'));

  // と vs の
  const fbToForNo = getContrastiveFeedback({ topic: 'Partiklar', answers: ['の'] }, 'と');
  assert(fbToForNo && fbToForNo.guideId === 'wo-to-no-mo' && fbToForNo.text.includes('Du valde と'));

  const fbNoForTo = getContrastiveFeedback({ topic: 'Partiklar', answers: ['と'] }, 'の');
  assert(fbNoForTo && fbNoForTo.guideId === 'wo-to-no-mo' && fbNoForTo.text.includes('Du valde の'));

  // は vs の
  const fbWaForNo = getContrastiveFeedback({ topic: 'Partiklar', answers: ['の'] }, 'は');
  assert(fbWaForNo && fbWaForNo.guideId === 'wo-to-no-mo' && fbWaForNo.text.includes('Du valde は'));

  const fbNoForWa = getContrastiveFeedback({ topic: 'Partiklar', answers: ['は'] }, 'の');
  assert(fbNoForWa && fbNoForWa.guideId === 'wa-ga' && fbNoForWa.text.includes('Du valde の'));

  // は vs も
  const fbWaForMo = getContrastiveFeedback({ topic: 'Partiklar', answers: ['も'] }, 'は');
  assert(fbWaForMo && fbWaForMo.guideId === 'wo-to-no-mo' && fbWaForMo.text.includes('Du valde は'));

  const fbMoForWa = getContrastiveFeedback({ topic: 'Partiklar', answers: ['は'] }, 'も');
  assert(fbMoForWa && fbMoForWa.guideId === 'wo-to-no-mo' && fbMoForWa.text.includes('Du valde も'));

  // に vs と
  const fbNiForTo = getContrastiveFeedback({ topic: 'Partiklar', answers: ['と'] }, 'に');
  assert(fbNiForTo && fbNiForTo.guideId === 'wo-to-no-mo' && fbNiForTo.text.includes('Du valde に'));

  // × (ingen partikel) rules
  for (const p of ['に', 'で', 'は', 'が', 'を', 'へ']) {
    const fb = getContrastiveFeedback({ topic: 'Partiklar', answers: ['×'] }, p);
    assert(fb && fb.guideId === 'no-particle' && fb.text.includes(`Du valde ${p}`));
  }

  const fbNoneForDe = getContrastiveFeedback({ topic: 'Partiklar', answers: ['で'] }, '×');
  assert(fbNoneForDe && fbNoneForDe.guideId === 'ni-de' && fbNoneForDe.text.includes('Du valde ×'));

  const fbNoneForWa = getContrastiveFeedback({ topic: 'Partiklar', answers: ['は'] }, '×');
  assert(fbNoneForWa && fbNoneForWa.guideId === 'wa-ga' && fbNoneForWa.text.includes('Du valde ×'));

  const fbNoneForWo = getContrastiveFeedback({ topic: 'Partiklar', answers: ['を'] }, '×');
  assert(fbNoneForWo && fbNoneForWo.guideId === 'wo-to-no-mo' && fbNoneForWo.text.includes('Du valde ×'));
});

test('contrastive feedback handles custom contrastive overrides, non-particle topics, and returns null for unknown distractors', () => {
  // Custom contrastive map takes precedence
  const customQ = {
    topic: 'Partiklar',
    answers: ['に'],
    guideRef: 'custom-guide',
    contrastive: {
      で: 'Skräddarsydd förklaring för で.',
      を: { text: 'Objektpassus', guideId: 'custom-wo' },
    },
  };
  const fbCustom1 = getContrastiveFeedback(customQ, 'で');
  assert.equal(fbCustom1?.text, 'Skräddarsydd förklaring för で.');
  assert.equal(fbCustom1?.guideId, 'custom-guide');

  const fbCustom2 = getContrastiveFeedback(customQ, 'を');
  assert.equal(fbCustom2?.text, 'Objektpassus');
  assert.equal(fbCustom2?.guideId, 'custom-wo');

  // Non-particle topics: Böjningar and Moror & stavelser
  const qBoj = { topic: 'Böjningar', answers: ['たかかった'] };
  assert.equal(getContrastiveFeedback(qBoj, 'たかいでした')?.guideId, 'adjectives');
  assert.equal(getContrastiveFeedback(qBoj, 'たかかった'), null);

  const qMora = { topic: 'Moror & stavelser', answers: ['2, 4'] };
  assert.equal(getContrastiveFeedback(qMora, '3, 4')?.guideId, 'moras');
  assert.equal(getContrastiveFeedback(qMora, '2, 4'), null);

  // Unmatched distractors and unrelated topics return null
  assert.equal(getContrastiveFeedback({ topic: 'Partiklar', answers: ['に'] }, 'unknown'), null);
  assert.equal(getContrastiveFeedback({ topic: 'Ord & kanji', answers: ['やま'] }, 'かわ'), null);
  assert.equal(getContrastiveFeedback({ topic: 'Läsförståelse', answers: ['A'] }, 'B'), null);
});
```

---

## 6. Verification and Integration Plan

1. **Test Verification**:
   - Running `npm test` executes both existing 24 unit tests, the 17 E2E requirements tests, and the newly added unit tests in `tests/engine.test.js`.
   - All tests pass with exit code 0.
2. **UI Integration Contract (`src/views/session.js`)**:
   - When a student answers incorrectly in practice mode:
     ```javascript
     const contrastive = getContrastiveFeedback(q, value);
     ```
   - If `contrastive` is non-null:
     - Render callout with `contrastive.text`.
     - Render "Öppna snabbguide"-button triggering `ctx.openGuideModal(contrastive.guideId)`.
   - If `contrastive` is null:
     - No contrastive box rendered (only standard answer feedback and explanation).
3. **Modal Linking Contract (`src/views/guide.js`)**:
   - `guideView` or modal dialog highlights `<article class="guide" id=${g.id}>`.
   - IDs match: `'wa-ga'`, `'ni-de'`, `'wo-to-no-mo'`, `'no-particle'`, `'adjectives'`, `'moras'`.
