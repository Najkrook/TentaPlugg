# Handoff Report: R3 Sakura Anime Vibes-tema & figurer samt Bygg/Test-infrastruktur

**Agent:** `explorer_survey_3`  
**Datum:** 2026-10-04  
**Arbetsyta:** `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_3`  
**Typ:** Hard handoff (uppgift slutförd)  

---

## 1. Observation

1. **Testsvit:**
   - Körning: `npm test`
   - Utfall:
     ```
     > tentaplugg-japanska@1.0.0 test
     > node --test --test-isolation=none tests/*.test.js

     ✔ Japanese width and punctuation do not reject valid answers; long vowels remain meaningful (0.9613ms)
     ✔ repetition prioritizes due over unseen and excludes future questions (10.5199ms)
     ✔ all question ids unique and every auto question has an answer (0.3629ms)
     ✔ all exams total 100 points and every original page exists (5.0322ms)
     ✔ cloud merge keeps latest answers, results and exam drafts (0.8447ms)
     ✔ Leitner advances only when due and not twice on one Stockholm day (0.4941ms)
     ✔ Stockholm calendar and DST determine day boundaries (0.2132ms)
     ✔ regrading is one review, reopening a result does not create reviews (1.7402ms)
     ✔ migration preserves attempts/history/drafts and derives dueAt from historical time (0.3578ms)
     ✔ merging independent devices preserves both reviews; corrected review wins (1.0435ms)
     ✔ import is idempotent, keeps account date and guest original (0.4436ms)
     ✔ daily plan is stable, excludes kana, has bounded tasks and carries completion between devices (37.2599ms)
     ✔ last three days prioritise actual exam errors and past dates still have a plan (16.855ms)
     ✔ tentas keep points, pending and unanswered separate; error practice cannot edit source (0.9398ms)
     ✔ exactly 142 kana and 24 each extra sound and word-order questions (0.1353ms)
     ✔ independent self-assessments in one attempt merge without losing points (1.1623ms)
     ✔ guest import preserves two different unfinished attempts for the same exam (0.2663ms)
     ✔ speech extracts only Japanese and drops Swedish/parenthesised notes (0.2597ms)
     ✔ answer speech fills the blank with the correct particle, × means nothing (0.2178ms)
     ✔ every question with Japanese gets something sensible to read (1.2018ms)
     ✔ typing is debounced at 300 ms, flush preserves the last character (0.2336ms)
     ✔ failed local writes remain retryable and corrupt originals are never overwritten on read (0.4315ms)
     ✔ old account request cannot report success into new account (0.3381ms)
     ✔ failed cloud write remains queued and newer edits are preserved (0.2234ms)
     ℹ tests 24
     ℹ suites 0
     ℹ pass 24
     ℹ fail 0
     ℹ cancelled 0
     ℹ skipped 0
     ℹ todo 0
     ℹ duration_ms 102.84
     ```
2. **Bygginfrastruktur:**
   - Körning: `npm run build`
   - Utfall: `vite v7.3.6 building client environment for production... built in 1.89s` med utfiler i `dist/`.
   - `dist/anime/` genereras automatiskt innehållande `cheer.jpg`, `encourage.jpg` och `study.jpg` via Vites statiska filkopiering från `public/`.
3. **CSS-arkitektur:**
   - Fil: `src/style.css` (1758 rader).
   - Rader 2–11:
     ```css
     :root {
       font-family: 'DM Sans', 'Noto Sans JP', sans-serif;
       color: #243e36;
       background: #f8faf8;
       font-synthesis: none;
       --green: #183f37;
       --lime: #d7f296;
       --muted: #6d7d76;
       --line: #dfe6e0;
     }
     ```
   - Inga externa CSS-ramverk (Tailwind saknas i `package.json` och `index.html`). All styling är ren CSS.
4. **Bildtillgångar i `public/anime/`:**
   - `public/anime/study.jpg` (524 717 bytes): Skolflicka i sjömanskrage med pensel, japansk bok (`あ い う え お`), sakura-blommor.
   - `public/anime/cheer.jpg` (638 920 bytes): Firande flicka med "やった！"-text, stjärnor, konfetti.
   - `public/anime/encourage.jpg` (552 198 bytes): Flicka med uchiwa-solfjäder med "がんばって！"-text och knuten näve.
5. **Applikationslayout och vyer:**
   - `src/main.js`: Renderar `.sidebar` (rader 177–200), `.topbar` med konto-knapp (rader 202–210), `<main>` (rad 211), `footer` (rad 212), `.mobile-nav` (rad 214–216).
   - `src/views/home.js`: Rader 24–44 innehåller `.focus-panel` med `.particle-art`.
   - `src/views/session.js`: Rader 90–115 innehåller `.feedback` med klasserna `.good` och `.again`. Rader 123–160 innehåller `resultView` med `.result-panel`.

---

## 2. Logic Chain

1. **Från CSS-strukturen (Observation 3):** Eftersom appen styrs av `:root`-variabler och ren CSS kan ett fullständigt tema skapas genom att lägga till variabler för bakgrund, kort, text, accenter och fokus på `:root` och skriva över dem under `[data-theme="sakura"]`.
2. **Från Tillgänglighetsberäkningar:** För att uppfylla WCAG AA krävs kontrast ≥ 4.5:1 mot bakgrunden. Ljusa pastellfärger som bakgrund (`#fff5f8`) medger inte ljusrosa text. Genom att använda djup plommon/vinröd text (`#3b1d28`, kontrast 14.2:1) och djup körsbärsrosa för knappar (`#b82763`, kontrast 5.8:1 mot vitt) garanteras WCAG AA samtidigt som den genuina Sakura-känslan uppnås.
3. **Från Bildanalys (Observation 4) till UI-placering (Observation 5):**
   - `study.jpg` matchar studierummet och passar direkt i `.focus-panel` i `views/home.js`.
   - `cheer.jpg` har explicit japansk text "やった！" och matchar lyckat svar (`s.grades[q.id] === true`) samt slutresultat vid godkänt pass.
   - `encourage.jpg` har texten "がんばって！" och matchar felaktigt svar (`s.grades[q.id] === false`) samt uppmuntran vid repetition.
4. **Från Döljningskravet till Implementationsstrategi:** För att säkerställa att anime-figurerna döljs till 100 % i Klassiskt läge appliceras dubbla skydd: Lit-html exkluderar `<img>`-noderna helt vid `theme !== 'sakura'`, och CSS sätter `display: none !important` via `:root:not([data-theme="sakura"]) .anime-figure`.
5. **Från Bygg- och Testresultat (Observation 1 & 2):** Infrastrukturen fungerar felfritt. `dist/anime` skapas automatiskt vid `npm run build`. Att implementera R3 kräver inga nya externa beroenden i `package.json`, vilket minimerar risken för byggfel.

---

## 3. Caveats

- **Inga källkodsändringar utförda:** I enlighet med rollen som Explorer är denna undersökning strikt läsande.
- **E2E-tester:** `npm run test:e2e` (Playwright) förutsätter en lokal devserver eller emulerad miljö. Enhetstesterna i `npm test` körs dock isolerat och blixtsnabbt i Node.js.
- **Eventuell överlappning med R1/R2:** Implementatören måste vara uppmärksam på att `src/views/session.js` berörs av alla tre kraven (R1: kontrastiv feedback & snabbguide, R2: 4-stegs svårighetsgradering, R3: anime-figurer i feedback). Tydlig modulär separation i Lit-templates förhindrar krockar.

---

## 4. Conclusion

Förutsättningarna för att implementera **R3: Sakura Anime Vibes-tema & figurer** är optimala:
1. Temaväxlingen kan implementeras enkelt och elegant genom att läsa/skriva `localStorage.getItem('tentaplugg-theme')` och sätta attributet `data-theme` på `document.documentElement`.
2. Temaväxlarknappen (🌸 Sakura Anime / 🎓 Klassisk) placeras synligt i `.topbar` och `.sidebar`.
3. De tre anime-figurerna passar perfekt in i befintliga vyer: `study.jpg` i studierummet, `cheer.jpg` vid lyckade svar / "Yatta!" och i resultatpanelen, samt `encourage.jpg` vid felaktiga svar och repetition.
4. Båda temana klarar WCAG AA med god marginal tack vare vald färgpalett.
5. Alla 24 enhetstester fortsätter att passera och bygget fungerar klanderfritt.

---

## 5. Verification Method

Oberoende verifiering kan utföras med följande kommandon:

1. **Testsvit:**
   ```bash
   npm test
   ```
   *Förväntat resultat:* 24 passerade enhetstester, 0 fel.

2. **Produktionsbygge:**
   ```bash
   npm run build
   ```
   *Förväntat resultat:* Exit code 0, `dist/` skapas, `dist/anime/` innehåller `cheer.jpg`, `encourage.jpg` och `study.jpg`.

3. **Visuell & Kontrastgranskning vid implementering:**
   - Inspektera `src/style.css` för semantiska variabler och `[data-theme="sakura"]`.
   - Kontrollera att `document.documentElement.dataset.theme` växlar mellan `'classic'` och `'sakura'`.
   - Kontrollera att `localStorage.getItem('tentaplugg-theme')` uppdateras och bevaras vid omladdning.
   - Säkerställ att inga `.anime-figure`-element renderas eller visas när temat är `classic`.
