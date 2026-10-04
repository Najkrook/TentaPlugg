# Handoff Report: R1 Kontrastiv felåterkoppling & Snabbguide-integration

**Agent**: `explorer_survey_1`  
**Datum**: 2026-10-04  
**Uppdrag**: Undersökning av R1 (Kontrastiv felåterkoppling vid kända distraktorer & Snabbguide-integration under pågående session)

---

## 1. Observation

1. **Frågedatastruktur och partikelfrågor**:
   - Fil: `src/data.js` (rad 13–23, 117–123, 165–185, 347–393).
   - Totalt 400 frågor i appen; 66 frågor har `topic: 'Partiklar'`:
     - 27 st Lesson 5 luckövningar (`l5-1` till `l5-27`), alla med `choices: ['は', 'が', 'を', 'に', 'で', 'と', 'の', 'も', 'へ', '×']`.
     - 15 st partikelfrågor (`p-0` till `p-14`), alla med `choices: ['は', 'が', 'を', 'に', 'で', 'と', 'の', 'も', 'か', '×']`.
     - 18 st tentamensfrågor GEMA70 (`gema70-3-1` till `gema70-3-18`), alla med flerval ur `functionsList`.
     - 6 st Lesson 5 rätt/fel-frågor (`l5-review-1` till `l5-review-6`), självbedömda (`self: true`).

2. **Befintlig motorlogik för kontrastiv feedback**:
   - Fil: `src/engine.js` (rad 227–325).
   - Funktionen `getContrastiveFeedback(q, userAnswer)` finns redan implementerad och exporterad:
     ```javascript
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
         // ... ytterligare regler för は/が, を/が, を/に, に/×, ×/partikel, と/の, へ/で
       }
       // ... regler för Böjningar och Moror & stavelser
     }
     ```
   - Verifierat via körning:
     `getContrastiveFeedback(p_0, 'に')` ger text om skillnaden mellan に och で samt `guideId: 'ni-de'`.
     `getContrastiveFeedback(p_1, 'で')` ger text om で för handling vs に för existens samt `guideId: 'ni-de'`.

3. **Feedback i sessionsvyn är bortkopplad från motorn**:
   - Fil: `src/views/session.js` (rad 90–115).
   - Vid felaktigt svar visas:
     - `<h3>Titta på förklaringen och försök igen senare</h3>`
     - `<p class="correct-answer">${languageText(q.answers?.join(' / '))}</p>`
     - `<p>${languageText(q.explanation || q.model)}</p>`
     - Knappen `Mitt svar är också korrekt`.
   - `grep_search` bekräftar att `getContrastiveFeedback` **inte anropas i någon vy eller fil i hela projektet** (0 anrop utanför dess egen definition på rad 227 i `engine.js`).

4. **Snabbguide och sessionsnavigering**:
   - Fil: `src/data.js` (rad 745–776): `guides` innehåller 6 regler med id: `'wa-ga'`, `'ni-de'`, `'wo-to-no-mo'`, `'no-particle'`, `'adjectives'`, `'moras'`. Dessa matchar exakt de `guideId` som returneras av `getContrastiveFeedback`.
   - Fil: `src/views/guide.js` (rad 1–33): Rendera helsidesvy med `.guide-grid` och `speechButton`.
   - Fil: `src/main.js` (rad 252–257):
     ```javascript
     function navigate(id) {
       flush();
       session = null;
       view = id;
       render(true);
     }
     ```
     Klick på "Snabbguide" i navigeringsmenyn sätter `session = null`, vilket avbryter pågående session och återgår till sidvy.

---

## 2. Logic Chain

1. **Från Observation 1 och 2**: De vanligaste felen som studenter gör på tentor och övningar (t.ex. `に` för existens vs `で` för handlingsplats) finns explicit representerade i partikelövningarna (`l5` och `p`) och hanteras av `getContrastiveFeedback(q, userAnswer)` i `src/engine.js`.
2. **Från Observation 2 och 3**: Eftersom `getContrastiveFeedback` redan genererar högkvalitativ kontrastiv text och korrekt `guideId`, men saknar anrop i `src/views/session.js`, är den primära uppgiften för kontrastiv återkoppling att:
   - Anropa `getContrastiveFeedback(q, value)` vid felaktigt svar (`!s.grades[q.id]`) i `sessionView`.
   - Rendera en tydlig callout (`.contrastive-box`) med texten och en åtgärdsknapp för att öppna Snabbguiden.
3. **Från Observation 4**: Eftersom `navigate('guide')` i `main.js` nollställer `session`, kan studenten i dagsläget inte konsultera Snabbguiden utan att sessionen avslutas. För att uppfylla acceptanskriteriet *"Relevant avsnitt i Snabbguiden kan öppnas och läsas direkt från sessionsvyn utan att sessionen nollställs"* krävs en modal dialog (`<dialog class="guide-modal">`) eller overlay i `sessionView`/`main.js`.
4. **Tillståndshantering**: Genom att hantera modalen via en tillståndsvariabel (`activeGuideModal`) eller `openGuide(guideId)` på `ctx`:
   - `session` behålls intakt i minnet (samma index, samma svar, samma resultat).
   - När modalen stängs (via Esc, X-knapp eller backdrop) återvänder användaren direkt till samma fråga.
   - Om ett specifikt `guideId` (t.ex. `'ni-de'`) skickas med vid öppning från en felåterkoppling, kan detta avsnitt markeras/fokuseras i modalen.

---

## 3. Caveats

- **Alternativa korrekta svar**: I `engine.js` kontrolleras `cleanAns === correctAns` endast mot `answers[0]`. Om en fråga har flera godkända svar (t.ex. `l5-10`: `['に', 'へ']`) och studenten svarar `へ`, måste `correct(q, userAnswer)` användas som skydd så att inte felaktig kontrastiv feedback visas.
- **Normalisering**: Svar från textrutor kan innehålla japanska punkter (`。`) eller mellanslag. `cleanAns` bör normaliseras med `normalize(userAnswer)`.
- **Tentamensfrågor (particleExam)**: Frågorna i `particleExam` har flerval ur `functionsList` (t.ex. `'Location of action'` vs `'Location of existence'`). `getContrastiveFeedback` kan med fördel utökas för att stödja dessa distraktorer eller via `q.contrastive`.

---

## 4. Conclusion

Lösningen för R1 är tydlig, väl avgränsad och bygger vidare på redan påbörjad arkitektur:
1. **I `src/engine.js`**: Förfina `getContrastiveFeedback` med `if (correct(q, userAnswer)) return null;`, `normalize(userAnswer)` och eventuella distraktorer för funktionsfrågor.
2. **I `src/views/session.js`**: Rendera kontrastiv förklaring vid felval (`!s.grades[q.id]`) samt lägg till en länk/knapp till Snabbguiden i felrutan och en "Snabbguide"-knapp i sessionens toppmeny.
3. **I `src/main.js` & `src/style.css`**: Inför en tillgänglig modal dialog (`<dialog class="guide-modal">`) som kan visa Snabbguiden direkt under sessionen med fokus på relevant sektion, utan att anropa `navigate()` eller påverka `session`.

---

## 5. Verification Method

Oberoende verifiering kan utföras med följande steg:
1. **Enhetstester**:
   ```powershell
   npm test
   ```
   Säkerställ att samtliga 24 befintliga tester fortsätter att passera.
2. **Nya enhetstester för kontrastiv feedback**:
   Lägg till tester i `tests/engine.test.js` som anropar `getContrastiveFeedback`:
   - Val av `に` vid `としょかん【　】本を読みます` (`p-0`, facit `で`) -> returnerar förklaring och `guideId: 'ni-de'`.
   - Val av `で` vid `としょかん【　】本があります` (`p-1`, facit `に`) -> returnerar förklaring och `guideId: 'ni-de'`.
   - Val av `へ` vid `l5-10` (`answers: ['に', 'へ']`) -> returnerar `null`.
3. **E2E / Gränssnittstest**:
   Starta ett partikelpass, välj ett felaktigt alternativ (`に` istället för `で`), klicka "Kontrollera svar".
   Verifiera att:
   - Den kontrastiva förklaringen syns i felrutan.
   - Klick på "Läs i Snabbguiden" öppnar modalen för Snabbguiden med avsnittet "に eller で?" synligt.
   - Stängning av modalen återställer sessionsvyn på samma fråga med oförändrade svar.
   - Bygget fungerar:
     ```powershell
     npm run build
     ```
