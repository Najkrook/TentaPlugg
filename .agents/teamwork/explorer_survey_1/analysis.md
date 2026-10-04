# R1 Investigation Analysis: Kontrastiv felåterkoppling & Snabbguide-integration

**Datum**: 2026-10-04  
**Agent**: Explorer Subagent (`explorer_survey_1`)  
**Område**: R1 (Pedagogisk felåterkoppling, distraktorer och sessionsbevarande snabbguide)

---

## 1. Executive Summary

Denna förstudie analyserar krav R1 från användarförfrågan:
1. **Kontrastiv felåterkoppling vid kända distraktorer**: Vid felaktigt svar på partikelfrågor (exempelvis skillnaden mellan plats för existens `に` och handling `で`) ska studenten få en specifik förklaring till varför det valda alternativet inte passar i sammanhanget.
2. **Snabbguide-integration under pågående session**: Studenten ska kunna öppna och läsa relevanta grammatikregler från Snabbguiden direkt från sessionsvyn utan att sessionens tillstånd (`session.index`, svar, rättning, historik) nollställs eller förloras.

### Huvudsakliga upptäckter i kodbasen:
- **Redan förberedd motorlogik**: I `src/engine.js` (rad 227–325) finns redan en fullständig, välformulerad implementation av `getContrastiveFeedback(q, userAnswer)`. Den returnerar `{ text, guideId }` för vanliga partikelfel (`に` vs `で`, `は` vs `が`, `を` vs `が`, etc.) samt stödjer `q.contrastive[cleanAns]`.
- **Befintligt gap i gränssnittet**: `getContrastiveFeedback` anropas för närvarande **aldrig** någonstans i gränssnittet (`src/views/session.js` eller `src/main.js`). Det finns ingen visning av kontrastiva förklaringar när användaren svarar fel.
- **Navigeringsbegränsning i Snabbguiden**: Snabbguiden existerar som en separat huvudvy (`src/views/guide.js`, `src/data.js` rad 745–776). Att navigera till den sker via `navigate('guide')` i `src/main.js` (rad 252–257), vilket sätter `session = null` och lämnar sessionen. Det saknas en modal dialog/drawer som kan öppna relevanta regler under pågående session utan att avbryta passet.

---

## 2. Frågedatastrukturer och partikelfrågor

### 2.1 Datastruktur för frågor (`src/data.js` & `src/extra-content.js`)
Appen har totalt 400 frågor fördelade över 8 ämnesområden:
- `Partiklar`: 66 frågor
- `Böjningar`: 14 frågor
- `Ord & kanji`: 36 frågor
- `Grammatikteori`: 50 frågor
- `Ordföljd`: 38 frågor
- `Moror & stavelser`: 32 frågor
- `Läsförståelse`: 22 frågor
- `Kana`: 142 frågor

En typisk fråga har följande struktur:
```javascript
{
  id: 'l5-2',
  topic: 'Partiklar',
  prompt: 'しゅうまつひとりでうみ【　】およぎました。',
  answers: ['で'],
  explanation: 'で markerar platsen där handlingen att simma sker.',
  source: 'Lesson5 · lucka 2',
  official: true,
  choices: ['は', 'が', 'を', 'に', 'で', 'と', 'の', 'も', 'へ', '×'],
  contrastive?: { [distractor]: '...' },
  guideRef?: 'ni-de',
  self?: false,
  points?: 1,
  section: '2',
  promptLang: 'sv',
  answerLang: 'sv',
  choiceLang: 'ja'
}
```

### 2.2 Kategorier av partikelfrågor
Bland de 66 partikelfrågorna finns tre huvudkategorier:
1. **Lesson 5 luckövningar (`l5-1` till `l5-27`)** (27 st):
   - Flervalsfrågor med `choices: ['は', 'が', 'を', 'に', 'で', 'と', 'の', 'も', 'へ', '×']`.
   - Autograde: Jämförs mot facit (`answers`).
   - Typiska uppgifter testar just val mellan `に`, `で`, `を`, `は`, `が`, `と`, `の`, `×`.
2. **Övningsfrågor partiklar (`p-0` till `p-14`)** (15 st):
   - Flervalsfrågor med `choices: ['は', 'が', 'を', 'に', 'で', 'と', 'の', 'も', 'か', '×']`.
   - Innehåller klassiska kontrastpar:
     - `p-0`: `としょかん【　】本を読みます。` -> Svar: `で` (handling på plats)
     - `p-1`: `としょかん【　】本があります。` -> Svar: `に` (existens på plats)
3. **Tentamensfrågor GEMA70 (`gema70-3-1` till `gema70-3-18`)** (18 st):
   - Prompt: `Vilken funktion har den markerade partikeln?\n...`
   - Flerval ur `functionsList`: `['Topic', 'Subject', 'Listing things', 'Object', 'Do things together with', 'Tool', 'Location of action', 'Point of time', 'Location of existence', 'Quotation', 'Question', 'Also', 'Assertion', 'Possessive / nominal phrase', 'Direction']`.
   - Exempel: `たいていどこ【で】べんきょうしますか。` -> Svar: `Location of action`.
   - Exempel: `ルンド【に】はおおきいきょうかいがあります。` -> Svar: `Location of existence`.
4. **Lesson 5 granskning/självbedömning (`l5-review-1` till `l5-review-6`)** (6 st):
   - Rätt/Fel-bedömning av meningar (`self: true`).

---

## 3. Nuvarande svarsflöde och felåterkoppling

### 3.1 Flöde vid svar och rättning
1. **Val av svar**:
   - I `src/views/session.js` klickar användaren på en `.choice`-knapp -> `ctx.answer(c)` anropas.
   - Svaret sparas i `session.answers[q.id]`.
2. **Kontroll**:
   - Användaren klickar "Kontrollera svar" -> `ctx.check()` i `src/main.js` (rad 358–371).
   - `correct(q, session.answers[q.id])` utvärderar svaret.
   - `grade(ok)` anropas:
     - `recordReview(state, session, q.id, ok, Date.now())` sätter `session.grades[q.id] = ok`.
     - `updateResult(state, session, questions, Date.now())`.
     - `persist(true)` sparar till draft och schemalägger lokal lagring.
     - `render()`.
3. **Visning av feedback i gränssnittet (`src/views/session.js` rad 90–115)**:
   - Variabeln `feedback` sätts: `const feedback = (s.mode !== 'exam' && (graded || s.revealed?.[q.id])) || s.review;`.
   - När `feedback` är `true` och svaret är fel (`!s.grades[q.id]`):
     - Visar rubrik: `<h3>Titta på förklaringen och försök igen senare</h3>`.
     - Visar korrekt svar: `<p class="correct-answer">${languageText(q.answers?.join(' / '))}</p>`.
     - Visar TTS-knapp för svaret: `${speechButton(ctx, answer, 'Lyssna på svaret')}`.
     - Visar allmän förklaring: `<p>${languageText(q.explanation || q.model)}</p>`.
     - Visar knapp för manuell korrigering: `<button class="text-button" @click=${() => ctx.grade(true)}>Mitt svar är också korrekt</button>`.

### 3.2 Identifierade brister:
- **Ingen kontrastiv återkoppling**: Studenten får veta vad rätt svar är och ser grundförklaringen, men får ingen förklaring till *varför deras valda felaktiga distractor var fel*.
- **Ingen snabbkoppling till Snabbguiden**: Det finns ingen länk eller knapp för att fördjupa sig i den underliggande grammatiska regeln.

---

## 4. Modellering och visning av kontrastiv felåterkoppling

### 4.1 Logik: `getContrastiveFeedback(q, userAnswer)` i `src/engine.js`
Funktionen i `src/engine.js` (rad 227–325) har följande logik:

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
    // 1. で valt, men rätt är に / へ
    if (cleanAns === 'で' && ['に', 'へ'].includes(correctAns)) {
      return {
        text: 'Du valde で. で används för platsen där en aktiv handling sker (t.ex. 本を読みます), medan に här anger plats för existens (あります/います), mål för förflyttning, eller personen man träffar.',
        guideId: 'ni-de',
      };
    }
    // 2. に valt, men rätt är で
    if (cleanAns === 'に' && correctAns === 'で') {
      return {
        text: 'Du valde に. に anger riktning, bestämd tidpunkt eller existens (あります/います), medan で markerar platsen där en handling eller aktivitet faktiskt utförs.',
        guideId: 'ni-de',
      };
    }
    // 3. は valt, men rätt är が
    if (cleanAns === 'は' && correctAns === 'が') {
      return {
        text: 'Du valde は. は sätter meningens övergripande tema (vad satsen handlar om), medan が här markerar objektet vid 好き/嫌い/わかります, eller lyfter fram subjektet som ny information.',
        guideId: 'wa-ga',
      };
    }
    // 4. が valt, men rätt är は
    if (cleanAns === 'が' && correctAns === 'は') {
      return {
        text: 'Du valde が. が används för ny information eller vid verb som 分かる/好き, men här etableras ett övergripande tema för hela satsen med は.',
        guideId: 'wa-ga',
      };
    }
    // 5. を valt, men rätt är が
    if (cleanAns === 'を' && correctAns === 'が') {
      return {
        text: 'Du valde を. を markerar direkt objekt vid transitiva handlingar (t.ex. 食べます), men vid 好き (tycka om) och わかります (förstå) används partikeln が i japanska.',
        guideId: 'wa-ga',
      };
    }
    // 6. を valt, men rätt är に
    if (cleanAns === 'を' && correctAns === 'に') {
      return {
        text: 'Du valde を. を markerar direkt objekt, men vid transportmedel (som バスに乗ります) eller personen man träffar eller frågar används partikeln に.',
        guideId: 'wo-to-no-mo',
      };
    }
    // 7. に valt, men rätt är ×
    if (cleanAns === 'に' && correctAns === '×') {
      return {
        text: 'Du valde に. Relativa tidsord som あした, きのう, まいにち, しゅうまつ och adverb tar normalt inte partikeln に.',
        guideId: 'no-particle',
      };
    }
    // 8. × valt, men rätt är en partikel
    if (cleanAns === '×' && ['に', 'で', 'を', 'は', 'が', 'と', 'の'].includes(correctAns)) {
      return {
        text: `Du valde × (ingen partikel). Här behövs partikeln ${correctAns} för att binda samman orden och klargöra satsens grammatiska relation.`,
        guideId: ['に', 'で'].includes(correctAns) ? 'ni-de' : ['は', 'が'].includes(correctAns) ? 'wa-ga' : 'wo-to-no-mo',
      };
    }
    // 9. と valt, men rätt är の
    if (cleanAns === 'と' && correctAns === 'の') {
      return {
        text: 'Du valde と. と betyder ”tillsammans med” eller binder ihop sidoordnade substantiv (”och”), medan の knyter ihop substantiv där det ena beskriver eller äger det andra.',
        guideId: 'wo-to-no-mo',
      };
    }
    // 10. の valt, men rätt är と
    if (cleanAns === 'の' && correctAns === 'と') {
      return {
        text: 'Du valde の. の anger ägande eller bestämning (”Xs Y”), medan と binder samman två separata substantiv (”X och Y”) eller anger sällskap.',
        guideId: 'wo-to-no-mo',
      };
    }
    // 11. へ valt, men rätt är で
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

### 4.2 Föreslagna förbättringar i `engine.js`
1. **Säkerställ att alternativa korrekta svar inte triggar kontrastiv feedback**:
   Om frågan godkänner flera svar (t.ex. `l5-10`: `answers: ['に', 'へ']`), kontrollerar funktionen för närvarande endast `cleanAns === correctAns` mot `answers[0]`. Om användaren svarade `へ`, är `cleanAns !== 'に'`, vilket är onödigt riskabelt.
   *Lösning*: Ändra villkoret till:
   ```javascript
   if (correct(q, userAnswer)) return null;
   ```
2. **Normalisering av användarsvar**:
   Använd `normalize(userAnswer)` för att hantera eventuella blanksteg eller japanska skiljetecken (`。`).
3. **Komplettera vanliga distraktorer**:
   - `で` valt vid tidsuttryck där rätt är `に` (t.ex. `７時【に】起きます`): Förklara att bestämda klockslag tar `に`.
   - `Location of action` vs `Location of existence` vid tentamensfrågorna (`particleExam`).

### 4.3 Gränssnittsrepresentation i `src/views/session.js`
När svaret är fel (`!s.grades[q.id]`) och `contrastive` finns, renderas en dedikerad callout-ruta:

```html
${contrastive
  ? html`<div class="contrastive-box">
      <div class="contrastive-header">
        ${icon('Info')}
        <strong>Varför inte ditt svar?</strong>
      </div>
      <p class="contrastive-text">${contrastive.text}</p>
      ${contrastive.guideId
        ? html`<button class="text-button guide-shortcut-btn" @click=${() => ctx.openGuide(contrastive.guideId)}>
            ${icon('BookOpen')} Läs regeln i Snabbguiden
          </button>`
        : ''}
    </div>`
  : ''}
```

---

## 5. Snabbguide-integration under pågående session

### 5.1 Snabbguidens nuvarande arkitektur
I `src/data.js` exporteras `guides`:
1. `id: 'wa-ga'`: `は eller が?`
2. `id: 'ni-de'`: `に eller で?`
3. `id: 'wo-to-no-mo'`: `を・と・の・も`
4. `id: 'no-particle'`: `När behövs ingen partikel?`
5. `id: 'adjectives'`: `I- och na-adjektiv`
6. `id: 'moras'`: `Moror och stavelser`

I `src/views/guide.js` renderas dessa som en tvåkolumnig grid (`.guide-grid`) med ljuduppspelning för exempel (`speechButton`).

### 5.2 Problemet med att lämna sessionen
I `src/main.js`:
```javascript
function navigate(id) {
  flush();
  session = null;
  view = id;
  render(true);
}
```
Om användaren klickar på "Snabbguide" i sidonavigeringen nollställs `session = null`.
Passets index och kontext lämnas, och studenten måste senare navigera tillbaka och återuppta passet.

### 5.3 Lösning: I-session Modal Dialog (`<dialog class="guide-modal">`)
Genom att implementera en modal dialog eller overlay:
1. **Bevarande av session**: `session`-variabeln förblir helt orörd! Inget `session = null`, inget tappat `session.index`, inga förlorade svar eller rättningar.
2. **Öppning**:
   - Från en knapp i sessionshuvudet: `<button class="text-button" @click=${() => ctx.openGuide()}>${icon('Library')} Snabbguide</button>`.
   - Från kontrastiv felåterkoppling: `<button class="text-button" @click=${() => ctx.openGuide(contrastive.guideId)}>...`.
3. **Målstyrd fokus/markering**:
   - Om `ctx.openGuide('ni-de')` anropas, öppnas modalen med sektionen `'ni-de'` markerad och rullad till toppen.
   - Ett filter eller flikar (eller vertikal lista med ankare) gör det enkelt att se just den relevanta regeln direkt.
4. **Stängning**:
   - Esc-tangent (inbyggt i HTML `<dialog>`).
   - Stäng-knapp (`icon('X')`).
   - Klick på backdrop.
   - När dialogen stängs är sessionen exakt där studenten lämnade den.
5. **Tillgänglighet (WCAG AA)**:
   - Naturligt fokusskydd (focus trap) med HTML5 `<dialog>`.
   - Återställer fokus till triggande element vid stängning.
   - Inga kontrastproblem eller overflow på mobila skärmar.

---

## 6. Identifiering av berörda filer och komponenter

| Fil | Roll i R1 | Ändringsbehov |
|---|---|---|
| `src/engine.js` | Affärslogik | Säkerställ export och förfina `getContrastiveFeedback` (använd `correct()`-vakt, normalisering). |
| `src/views/session.js` | UI för övningspass | Importera `getContrastiveFeedback`. Rendera kontrastiv callout vid fel. Lägg till Snabbguide-knapp i topbar och felruta. |
| `src/main.js` | Appkoordinator & tillstånd | Lägg till `activeGuideModal`-tillstånd eller modalrenderare, exponera `openGuide(id)` och `closeGuide()` på `ctx`. Rör ej `session` vid modalvisning. |
| `src/style.css` | Styling | CSS för `.contrastive-box`, `.guide-modal`, `.guide-modal::backdrop`, aktivt avsnitts-highlight. |
| `tests/engine.test.js` | Enhetstester | Tester som verifierar att `getContrastiveFeedback` returnerar rätt text och `guideId` för relevanta fel. |
| `tests/e2e/app.spec.js` | E2E-tester | E2E-test för visning av kontrastiv feedback och öppnande/stängande av Snabbguide i session utan dataförlust. |

---

## 7. Edge cases & risker

1. **Flera godkända svar**:
   Frågor som `l5-10` har `answers: ['に', 'へ']`. Om studenten svarar `へ`, får inte felaktigt en kontrastiv förklaring visas. Skydd: `if (correct(q, userAnswer)) return null;`.
2. **Tangentbordsinmatning (IME / japansk text)**:
   I fritextfält kan svar innehålla fullbreddsblanksteg eller japanska punkter (`。`). Normalisering med `normalize()` förhindrar falska träffar.
3. **Självbedömda frågor (`q.self`)**:
   För frågor med modellösning bedömer studenten själv. Kontrastiv feedback ska endast aktiveras när det finns ett faktiskt distraktorsvar (främst flervalsfrågor och strukturerade partikelfrågor).
4. **Ljud/TTS i modalen**:
   Om studenten lyssnar på exempel i Snabbguide-modalen och stänger den ska ljudet stoppas via `stopSpeech()`.
5. **Tentamensläge (`mode === 'exam'`)**:
   Under pågående tentamen visas ingen feedback förrän inlämning och granskning (`review`). Den kontrastiva återkopplingen ska därför endast synas i träningsläge samt under tentamensgranskning (`review`).
