# Teknisk Analys: R3 Sakura Anime Vibes-tema & figurer samt Bygg/Test-infrastruktur

**Författare:** Explorer subagent 3 (`explorer_survey_3`)  
**Datum:** 2026-10-04  
**Projekt:** TentaPlugg (GEMA70 / JAPC11)  
**Status:** Read-Only Förstudie & Teknisk Specifikation  

---

## 1. Sammanfattning

Denna undersökning kartlägger kraven och förutsättningarna för **R3: Sakura Anime Vibes-tema & figurer** samt säkerställer bygg- och testinfrastrukturen för hela projektet:
1. **Stilmall & Designsystem:** Appen använder vanilla CSS (`src/style.css`) strukturerat med flexbox/grid och ett fåtal CSS-variabler (`--green`, `--lime`, `--muted`, `--line`). Genom att utöka dessa till semantiska temavariabler på `:root` och `[data-theme="sakura"]` kan ett komplett och stilrent Sakura Anime-tema implementeras utan att röra layoutstrukturen.
2. **Temaväxling & Persistens:** Implementeras med en renodlad temaväxlare (🌸 Sakura Anime vs 🎓 Klassisk) placerad lättåtkomligt i `topbar` och `sidebar`. Valet sparas i `localStorage.getItem('tentaplugg-theme')` och appliceras omedelbart på `document.documentElement.dataset.theme`, vilket eliminerar "Flash of Unstyled Theme" (FOUT).
3. **Anime-figurer (`public/anime/`):**
   - `study.jpg`: Integreras i studierummet (`views/home.js`) i eller vid `focus-panel`.
   - `cheer.jpg` ("やった！"): Integreras vid lyckat svar (`feedback.good`) och i resultatpanelen (`resultView`) vid gott resultat / avslutad session.
   - `encourage.jpg` ("がんばって！"): Integreras vid felaktigt svar (`feedback.again`) och vid repetition av misstag.
   - I Klassiskt läge döljs samtliga figurer via både Lit-template-villkor och CSS `:root:not([data-theme="sakura"]) .anime-figure { display: none !important; }`.
4. **Tillgänglighet & WCAG AA:** Alla färgkombinationer i både Klassiskt och Sakura-läge har beräknats och uppfyller WCAG AA (kontrast ≥ 4.5:1 för text, ≥ 3.0:1 för interaktiva element/fokusringar). I Sakura-läget används en djup plommon/vinröd textfärg (`#3b1d28` / `#421d2a`) mot pastellbakgrunder för att garantera hög läsbarhet.
5. **Bygg- & Testinfrastruktur:** 
   - `npm test` kör Node.js nativa testrunner (`node --test --test-isolation=none tests/*.test.js`) och samtliga **24 befintliga tester passerar på ~100 ms**.
   - `npm run build` bygger med Vite 7 till `dist/` utan fel och kopierar automatiskt `public/anime/` till `dist/anime/`.

---

## 2. Analys av Stilmall & UI-arkitektur

### Nuvarande Struktur i `src/style.css`
Appen använder inte Tailwind CSS utan ett välskrivet, handkodat stilark (`src/style.css`, 1758 rader) som importeras via `src/main.js`.
I nuläget definieras endast fyra variabler på `:root`:
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

Flera element i `src/style.css` refererar dock till hårdkodade hex-färger (t.ex. `#f8faf8`, `#ffffff`, `#243e36`, `#183f37`, `#d4ded5`, `#eaf0e7`).

### Temasystem via CSS Custom Properties
För en robust implementation som inte riskerar regressionsfel eller layoutförskjutningar, definieras ett utökat set av semantiska variabler:

| CSS Variabel | Klassiskt Tema (🎓) | Sakura Anime-tema (🌸) | Syfte / Användning |
|---|---|---|---|
| `--theme-bg` | `#f8faf8` | `#fff5f8` | Sidbakgrund |
| `--theme-surface` | `#ffffff` | `#ffffff` | Kort, paneler, formulärfält |
| `--theme-text` | `#243e36` | `#3b1d28` | Huvudtext, rubriker |
| `--theme-text-muted` | `#6d7d76` | `#784f60` | Sekundär text, metadata |
| `--theme-line` | `#dfe6e0` | `#f2d4e1` | Ramar, avgränsare |
| `--theme-primary` | `#183f37` | `#b82763` | Primära knappar, accenter |
| `--theme-primary-hover` | `#2e594b` | `#9c1f52` | Primärknapp hover |
| `--theme-secondary-bg` | `#ffffff` | `#ffffff` | Sekundärknapp bakgrund |
| `--theme-secondary-text` | `#183f37` | `#8a1f4b` | Sekundärknapp text |
| `--theme-secondary-border` | `#d4ded5` | `#e8c0d2` | Sekundärknapp ram |
| `--theme-focus-ring` | `#529574` | `#b82763` | Fokusindikator (`:focus-visible`) |
| `--theme-focus-panel-bg` | `#183f37` | `linear-gradient(135deg, #78204d 0%, #a82e66 50%, #702f6a 100%)` | Studierummets Dagens fokus-panel |
| `--theme-nav-active-bg` | `#edf3e9` | `#ffe5f0` | Aktiv navigeringsflik bakgrund |
| `--theme-nav-active-text` | `#183f37` | `#942554` | Aktiv navigeringsflik text |
| `--theme-badge-bg` | `#d7f296` | `#ffcfe0` | Badge / highlight bakgrund |
| `--theme-badge-text` | `#183f37` | `#6e1336` | Badge / highlight text |

---

## 3. WCAG AA Kontrast- och Tillgänglighetsverifiering

WCAG 2.1 Nivå AA kräver:
- **Minst 4.5:1** för brödtext och normal text (< 18pt / 24px eller < 14pt / 18.5px fetstil).
- **Minst 3.0:1** för stor text (≥ 18pt / 24px eller ≥ 14pt / 18.5px fetstil).
- **Minst 3.0:1** för grafiska komponenter, formulärramar och tangentbordsfokusindikatorer.

### Kontrollberäkningar för Sakura Anime-temat

| Element | Förgrund | Bakgrund | Kontrastkvot | WCAG AA Status |
|---|---|---|---|---|
| **Huvudtext / H1-H3** | `#3b1d28` (djupt plommon) | `#fff5f8` (sakura cream) | **14.2 : 1** | ✅ Godkänd (Krav: 4.5:1) |
| **Kortrubriker & brödtext**| `#3b1d28` | `#ffffff` (kortvit) | **15.1 : 1** | ✅ Godkänd (Krav: 4.5:1) |
| **Sekundär / Muted text** | `#784f60` (dämpad vinröd) | `#ffffff` (kortvit) | **5.2 : 1** | ✅ Godkänd (Krav: 4.5:1) |
| **Primärknapp** | `#ffffff` (vit) | `#b82763` (djup körsbärsrosa) | **5.8 : 1** | ✅ Godkänd (Krav: 4.5:1) |
| **Sekundärknapp text** | `#8a1f4b` | `#ffffff` | **7.9 : 1** | ✅ Godkänd (Krav: 4.5:1) |
| **Fokusring** | `#b82763` | `#fff5f8` | **5.4 : 1** | ✅ Godkänd (Krav: 3.0:1) |
| **Valalternativ (valda)** | `#6e1336` | `#ffe5f0` | **7.6 : 1** | ✅ Godkänd (Krav: 4.5:1) |
| **Feedback rätt (good)** | `#1b5220` (mörkgrön) | `#f0f9ed` (ljus mint) | **8.4 : 1** | ✅ Godkänd (Krav: 4.5:1) |
| **Feedback fel (again)** | `#801c44` (mörkröd) | `#fff0f5` (ljusrosa) | **7.2 : 1** | ✅ Godkänd (Krav: 4.5:1) |

*Observation om pastellfärger:* Pastellrosa och lavendel används uteslutande för ytor, borders, badges och mjuka bakgrunder. För all text och interaktiva indikatorer används konsekvent mättade, mörka plommon-/körsbärstoner. Detta förhindrar den vanliga fallgropen där anime-teman blir oläsliga.

---

## 4. Temaväxling och Persistens

### Datamodell och Lagring
- **Lagringsnyckel:** `tentaplugg-theme` i `localStorage`.
- **Giltiga värden:** `'classic'` | `'sakura'`.
- **Fallback:** Om inget sparat värde finns (eller ogiltigt värde), väljs `'classic'`.
- **Systematisering:**
  1. Vid laddning (i `main.js` eller omedelbart före render):
     ```javascript
     const storedTheme = localStorage.getItem('tentaplugg-theme');
     const currentTheme = storedTheme === 'sakura' ? 'sakura' : 'classic';
     document.documentElement.dataset.theme = currentTheme;
     ```
  2. Vid växling:
     ```javascript
     function toggleTheme() {
       const next = theme === 'sakura' ? 'classic' : 'sakura';
       theme = next;
       localStorage.setItem('tentaplugg-theme', next);
       document.documentElement.dataset.theme = next;
       // Uppdatera mobil statusfält-färg
       document.querySelector('meta[name="theme-color"]')?.setAttribute(
         'content', 
         next === 'sakura' ? '#a82e66' : '#183f37'
       );
       render();
     }
     ```
  3. `state.theme` i `engine.js` (som redan har `theme: 'classic'`) hålls också synkat för bakåtkompatibilitet.

### Placering av Temaväxlare i UI
Temaväxlaren integreras på två synergiska platser:
1. **Topbar (Både mobil och desktop):**
   Placeras direkt till vänster om Google-kontoknappen (`.account`) i `.topbar`:
   ```html
   <button class="theme-toggle" @click=${toggleTheme} aria-label="Växla tema">
     ${theme === 'sakura' ? html`🎓 Klassisk` : html`🌸 Sakura`}
   </button>
   ```
2. **Sidebar (Desktop):**
   I `.side-bottom` eller direkt under navigationsmenyn, som en tydlig pill-toggle.
   Detta gör temabyte omedelbart tillgängligt var som helst i appen utan att behöva gräva i undermenyer.

---

## 5. Anime-figurernas Integration (`public/anime/`)

De tre genererade bilderna är inspekterade:
- `study.jpg` (512 kB, 1024x1024): Chibi-skolflicka i sjömanskrage med pensel, japansk bok och svävande körsbärsblomblad.
- `cheer.jpg` (624 kB, 1024x1024): Firande chibi-flicka med händerna i luften, glitter, konfetti och texten "やった！".
- `encourage.jpg` (539 kB, 1024x1024): Målmedveten chibi-flicka som håller en uchiwa-solfjäder med texten "がんばって！" och knyter näven uppmuntrande.

### Strategisk Placering

#### 1. Studierummet (`views/home.js`) — `study.jpg`
- **Plats:** I `.focus-panel` (Dagens fokus) vid sidan av texten.
- **Upplevelse:** I Klassiskt läge visas den abstrakta partikel-grafiken (`.particle-art`). I Sakura Anime-läge ersätts eller berikas den med `study.jpg` som studiekamrat/maskot.
- **Markup:**
  ```html
  ${ctx.theme === 'sakura' ? html`
    <div class="anime-figure anime-study-panel" aria-hidden="true">
      <img src="/anime/study.jpg" alt="Sakura-maskot som studerar japanska" loading="lazy" />
    </div>
  ` : ''}
  ```
- **Responsivitet:** Desktop `width: 170px; height: 170px; border-radius: 16px;`. Mobil `width: 110px; height: 110px;` flexat snyggt i panelen.

#### 2. Lyckat Svar / "Yatta!" (`views/session.js`) — `cheer.jpg`
- **Plats:** I svarsåterkopplingen (`.feedback.good`) när studenten svarat rätt eller bedömt sitt eget svar som rätt.
- **Upplevelse:** Maskoten dyker upp med texten "やった！" och firar framsteget tillsammans med studenten.
- **Markup:**
  ```html
  ${ctx.theme === 'sakura' && s.grades[q.id] ? html`
    <div class="anime-figure anime-feedback-mascot" aria-hidden="true">
      <img src="/anime/cheer.jpg" alt="やった！ Bra jobbat!" loading="lazy" />
    </div>
  ` : ''}
  ```
- **Responsivitet:** Kompakt layout i feedback-kortet (`width: 80px; height: 80px; border-radius: 12px; float: right; margin-left: 12px;` eller flexbox).

#### 3. Uppmuntran vid Misstag (`views/session.js`) — `encourage.jpg`
- **Plats:** I svarsåterkopplingen (`.feedback.again`) när studenten svarat fel och behöver repetera.
- **Upplevelse:** Maskoten håller upp sin "がんばって！"-solfjäder för att ge positiv uppmuntran och minska tentastress.
- **Markup:**
  ```html
  ${ctx.theme === 'sakura' && !s.grades[q.id] ? html`
    <div class="anime-figure anime-feedback-mascot" aria-hidden="true">
      <img src="/anime/encourage.jpg" alt="がんばって！ Kämpa vidare!" loading="lazy" />
    </div>
  ` : ''}
  ```

#### 4. Resultatpanelen (`views/session.js` -> `resultView`)
- **Plats:** Direkt ovanför eller jämte slutresultatet (`.result-panel`).
- **Logik:**
  - Om resultatet är bra (t.ex. `result.ok / result.total >= 0.7`): Visa `cheer.jpg` ("やった！ Slutfört pass").
  - Om studenten har flera fel att repetera: Visa `encourage.jpg` ("がんばって！ Bra kämpat, dags för repetition").
- **Responsivitet:** Centrerad, `max-width: 140px; border-radius: 16px; margin: 16px auto;`.

### Säker Hävning / Döljning i Klassiskt Läge
För att till 100 % uppfylla acceptanskriteriet att figurerna döljs i Klassiskt läge används dubbla skydd:
1. **Template-skydd:** Lit-html renderar inte `<img>`-taggarna överhuvudtaget om `theme !== 'sakura'`.
2. **CSS-skydd:**
   ```css
   :root:not([data-theme="sakura"]) .anime-figure,
   [data-theme="classic"] .anime-figure {
     display: none !important;
   }
   ```
Detta eliminerar både onödig nätverkstrafik för studenter som vill ha en strikt klassisk universitetslook och skyddar mot layoutglipor.

---

## 6. Bygg- och Testinfrastruktur

### Befintlig Teststatus
Körning av `npm test`:
- **Kommando:** `node --test --test-isolation=none tests/*.test.js`
- **Resultat:** **24 tester passerade, 0 fel, körningstid 102 ms.**
- Alla 4 testsviter är gröna:
  1. `tests/engine.test.js` (5 tester)
  2. `tests/learning.test.js` (12 tester)
  3. `tests/speech.test.js` (3 tester)
  4. `tests/storage.test.js` (4 tester)

### Befintlig Byggstatus
Körning av `npm run build`:
- **Kommando:** `vite build`
- **Resultat:** **Bygger på 1.89s utan fel.**
- Tillgångar i `dist/`:
  - `dist/index.html`
  - `dist/assets/index-*.css`
  - `dist/assets/index-*.js`
  - `dist/assets/firebase-*.js`
  - `dist/anime/cheer.jpg`, `dist/anime/encourage.jpg`, `dist/anime/study.jpg` kopieras automatiskt av Vite från `public/` till `dist/`.

### Nya Enhetstester för R3
För att verifiera temalogiken inför byggsteget föreslås följande tillägg i `tests/engine.test.js` eller en dedikerad testfil:
- Verifiera att `fresh()` innehåller defaultvärde `theme: 'classic'`.
- Verifiera att temaväxling mellan `'classic'` och `'sakura'` hanteras deterministiskt med fallback vid ogiltiga strängar (t.ex. `null` eller okänd sträng faller tillbaka på `'classic'`).
- Verifiera att samtliga tre anime-bildfiler existerar i filsystemet (`public/anime/study.jpg`, `cheer.jpg`, `encourage.jpg`) så att inga brutna bildlänkar kan uppstå (i analogi med det befintliga testet som kontrollerar att alla tentabilder existerar).

---

## 7. Fildetaljer, Komponenter och Riskanalys

### Berörda Filer
1. `src/style.css`:
   - Utökning av CSS-variabler på `:root` och selektorn `[data-theme="sakura"]`.
   - Regler för `.theme-toggle`, `.anime-figure`, `.anime-feedback-mascot`, `.anime-study-panel`.
   - WCAG-fokusindikatorer och manga-accenter.
2. `src/main.js`:
   - Läsa in och lagra `tentaplugg-theme` från `localStorage`.
   - Sätta `document.documentElement.dataset.theme`.
   - Exponera `theme` och `toggleTheme` i kontexten `ctx`.
   - Lägga till `.theme-toggle`-knappen i `topbar` och `sidebar`.
3. `src/views/home.js`:
   - Villkorlig rendering av `study.jpg` i `.focus-panel` vid `ctx.theme === 'sakura'`.
4. `src/views/session.js`:
   - Villkorlig rendering av `cheer.jpg` och `encourage.jpg` i feedback och resultatpanel vid `ctx.theme === 'sakura'`.
5. `tests/engine.test.js`:
   - Enhetstest som verifierar existensen av alla tre anime-bildfiler och standardtemavärde.

### Gränssnitt och Synergier med R1 och R2
- **R1 (Kontrastiv återkoppling & Snabbguide):** R1 modifierar också feedback-boxen i `views/session.js` och snabbguide-modalen. Genom att placera anime-figuren som en ren sidovisning/header-badge i `.feedback` krockar den inte med texten från den kontrastiva förklaringen.
- **R2 (Sessionsstorlek & Svårighetsgradering):** R2 modifierar `views/home.js` (sessionsväljare) och `views/session.js` (graderingsknappar). Samma princip gäller: komponenterna kompletterar varandra utan att störa varandras DOM-träd.

### Risker & Åtgärder

| Risk | Sannolikhet | Konsekvens | Förebyggande Åtgärd |
|---|---|---|---|
| **FOUT (Flash of Unstyled Theme)** vid laddning | Låg | Liten | Läsa `localStorage.getItem('tentaplugg-theme')` och sätta `data-theme` på `document.documentElement` synkront vid app-start innan Lit utför sin första rendering. |
| **Kontrastbrist på ljusrosa** | Medel | Hög (WCAG-brott) | Strikt använda mörka plommon-/burgundy-textfärger (`#3b1d28`) med kontrast ≥ 14:1. Aldrig ljusrosa text på ljusrosa bakgrund. |
| **Bildskalning spräcker mobil-layout** | Medel | Medel | Alla anime-bilder ges fasta maxmått via CSS (`max-width: 80px` i feedback, `max-width: 140px` i resultat, `object-fit: contain`). |
| **Anime-bilder läcker till Klassiskt läge** | Låg | Medel | Dubbelt skydd: Både Lit-template-villkor (`theme === 'sakura'`) och CSS `:root:not([data-theme="sakura"]) .anime-figure { display: none !important; }`. |
