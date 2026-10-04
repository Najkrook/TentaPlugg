# Handoff Report: R2 Flexibel Spaced Repetition & Sessionsstorlek med Självskattad Svårighet

**Subagent**: `explorer_survey_2`  
**Handoff Type**: Hard (Survey Investigation Complete)  
**Parent Agent**: `caec6291-b7f4-4115-a415-2741cb85c00d`  
**Working Directory**: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_2`

---

## 1. Observation

1. **State Definition & Default Configuration**:
   - In `src/engine.js`: lines 26–29:
     ```javascript
     export const fresh = () => ({
       version: SCHEMA_VERSION,
       baselineStats: {},
       reviews: {},
       stats: {},
       history: [],
       drafts: {},
       attempts: {},
       plans: {},
       examDate: DEFAULT_EXAM_DATE,
       settingsAt: 0,
       theme: 'classic',
       preferredCount: 10,
     });
     ```
     `preferredCount: 10` is already defined in `fresh()`.
   - In `src/config.js`: lines 5–7:
     ```javascript
     export const SCHEMA_VERSION = 2;
     export const INTERVALS = [600000, 86400000, 259200000, 604800000, 1209600000];
     export const STUDY_TIME_ZONE = 'Europe/Stockholm';
     ```

2. **Existing Leitner Transition Logic**:
   - In `src/engine.js`: lines 36–64:
     ```javascript
     let ok = false;
     let rating = 'good';
     if (typeof okOrRating === 'boolean') {
       ok = okOrRating;
       rating = ok ? 'good' : 'again';
     } else if (typeof okOrRating === 'string') {
       rating = okOrRating;
       ok = rating !== 'again';
     } else if (typeof okOrRating === 'object' && okOrRating !== null) {
       rating = okOrRating.rating || (okOrRating.ok ? 'good' : 'again');
       ok = rating !== 'again';
     }

     if (!ok || rating === 'again') {
       box = 0;
       dueAt = at + INTERVALS[0];
     } else if (rating === 'hard') {
       box = Math.max(0, box);
       dueAt = at + Math.min(INTERVALS[box], 86400000);
       lastPromotionDay = day;
     } else if (rating === 'easy') {
       box = Math.min(4, box + 2);
       dueAt = at + INTERVALS[box];
       lastPromotionDay = day;
     } else if ((!previous || dueAt <= at) && lastPromotionDay !== day) {
       box = Math.min(4, box + 1);
       dueAt = at + INTERVALS[box];
       lastPromotionDay = day;
     }
     ```
     `nextStat` already contains branching for `'again'`, `'hard'`, `'easy'`, and default `'good'`.

3. **Practice Selection & Session Hardcoded Count**:
   - In `src/engine.js`: line 331–335:
     ```javascript
     export function selectPractice(
       bank,
       stats,
       topic = 'Alla',
       count = 10,
       now = Date.now(),
       { extra = false, seed = dayKey(now), weak = false } = {},
     ) {
     ```
   - In `src/main.js`: line 262:
     ```javascript
     let ids = selectPractice(bank, state.stats, topic, 10, Date.now(), options);
     ```
     `start()` currently hardcodes `10` questions when calling `selectPractice()`.

4. **Grading and Feedback**:
   - In `src/main.js`: lines 370–379:
     ```javascript
     } else grade(correct(q, session.answers[q.id]));
     function grade(ok, advance = false) {
       const q = currentQ();
       recordReview(state, session, q.id, ok, Date.now());
       updateResult(state, session, questions, Date.now());
       persist(true);
       if (advance) next();
       else announce(ok ? 'Rätt svar.' : 'Inte rätt denna gång. Förklaringen visas.');
     }
     ```
   - In `src/views/session.js`: lines 97–113:
     ```javascript
     ${
       q.self
         ? html`<p>Stämmer ditt svar med de viktiga punkterna?</p>
             <div class="self-actions">
               <button class="secondary" @click=${() => ctx.grade(false, true)}>
                 Behöver öva mer</button
               ><button class="primary" @click=${() => ctx.grade(true, true)}>
                 Jag kunde detta
               </button>
             </div>`
         : !s.grades[q.id]
           ? html`<button class="text-button" @click=${() => ctx.grade(true)}>
               Mitt svar är också korrekt
             </button>`
           : ''
     }
     ```
     Feedback displays binary "Behöver öva mer" / "Jag kunde detta" for `q.self`, and "Mitt svar är också korrekt" if incorrect for auto questions.

5. **Existing Test Suite Baseline**:
   - Ran `npm test`: 24 passing unit tests in 112.8 ms.
   - Ran `npm run build`: built in 1.88s without errors.
   - Grep for `hard` and `easy` in `tests/` returned 0 matches: neither `'hard'` nor `'easy'` ratings are currently tested.

---

## 2. Logic Chain

1. **Scheduling Engine Readiness**:
   - *From Observation 1 & 2*: `nextStat` already handles `'again'`, `'hard'`, `'good'`, and `'easy'`.
   - *From Observation 1*: `preferredCount: 10` is already an existing field in `fresh()`.
   - *Reasoning*: The engine design was already architected for these 4 ratings. Enabling them does not require rewrites of the core interval mathematics; it only requires exposing them in the UI, hooking `grade(rating)` into `recordReview`, and validating them via unit tests.

2. **Session Length Selection**:
   - *From Observation 3*: `main.js` line 262 hardcodes `count = 10` in `start()`.
   - *From Observation 1*: `state.preferredCount` exists but is unused.
   - *Reasoning*: Adding a segmented button control (`5`, `10`, `20`, `all-due`) to `home.js` and updating `state.preferredCount` allows `start(topic, options)` to use `options.count ?? state.preferredCount ?? 10`. If `all-due` is chosen, filtering `bank` to `stats[q.id]?.dueAt <= Date.now()` satisfies both fixed count and all-due question requirements.

3. **Self-Rated Repetition Grading**:
   - *From Observation 2 & 4*: During practice (`session.mode !== 'exam'`), when feedback is shown, the student should be able to rate difficulty as `Igen` (again), `Svårt` (hard), `Bra` (good), or `Lätt` (easy).
   - *Reasoning*:
     - For auto questions: `check()` initially sets `Bra` (`good`) if correct or `Igen` (`again`) if incorrect. Presenting the 4 buttons allows the student to confirm or adjust the rating.
     - For `q.self` in practice sessions: The 4 buttons replace the binary buttons.
     - In exam mode: `q.self` grading must retain "Jag kunde detta" and "Behöver öva mer" to avoid breaking Playwright e2e tests (`tests/e2e/app.spec.js` lines 41 & 100).

4. **Backwards Compatibility**:
   - *From Observation 1*: `SCHEMA_VERSION = 2`.
   - *Reasoning*: Do NOT increment `SCHEMA_VERSION` to 3. Keeping version 2 ensures `migrate()` does not reset `reviews`. Older reviews without `rating` evaluate `r.rating ?? r.ok` and fallback to `good` or `again` without schema faults or loss of history.

---

## 3. Caveats

- **Network Mode**: Investigation was conducted in read-only mode without network calls; emulators were not started during survey.
- **Theme Coupling**: R3 (Sakura Anime theme) will modify CSS and layout. The session length pills and difficulty rating buttons should use CSS variables and standard class names (`.length-pill`, `.rating-btn`, etc.) to easily adapt to both Classic and Sakura themes.
- **No Source Modifications**: As mandated by explorer role, zero source files were modified during this investigation.

---

## 4. Conclusion

Requirement R2 is cleanly implementable with low architectural risk:
1. `src/engine.js` already has the mathematical model for 4 difficulty levels (`again`, `hard`, `good`, `easy`) in `nextStat()`.
2. `src/config.js` intervals `[600000, 86400000, 259200000, 604800000, 1209600000]` map to:
   - Igen: Box 0 (10 min)
   - Svårt: Same Box (10 min in Box 0, 1 dag in Box 1–4)
   - Bra: Box + 1 (1d, 3d, 7d, 14d)
   - Lätt: Box + 2 (3d, 7d, 14d)
3. Adding session length selection (`5`, `10`, `20`, `all-due`) requires:
   - A segmented pill control in `src/views/home.js`.
   - Updating `start()` in `src/main.js` to read `options.count ?? state.preferredCount ?? 10`.
   - Adding `options.dueOnly` support in `selectPractice()`.
4. Adding self-rated difficulty requires:
   - Presenting `Igen`, `Svårt`, `Bra`, `Lätt` buttons with interval previews in `src/views/session.js` during feedback.
   - Updating `grade()` in `src/main.js` to pass the chosen rating string to `recordReview()`.
5. Backwards compatibility is 100% guaranteed by keeping `SCHEMA_VERSION = 2`.

---

## 5. Verification Method

To verify the investigation findings and test future implementations:
1. **Unit Test Verification**:
   ```powershell
   npm test
   ```
   Must pass all 24 existing tests plus new unit tests covering:
   - `nextStat` with `'again'`, `'hard'`, `'good'`, `'easy'`.
   - `recordReview` storing ratings.
   - `selectPractice` with count 5, 10, 20, and `dueOnly: true`.
   - `mergeProgress` preserving `preferredCount` on cross-device sync.
2. **Production Build Verification**:
   ```powershell
   npm run build
   ```
   Must compile cleanly without bundle or syntax errors.
3. **Inspectable Analysis File**:
   `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_2\analysis.md`
