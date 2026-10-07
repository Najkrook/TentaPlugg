# Specifikation: Öva på månadens dagar

**Status:** ready-for-agent

**Workflow:** done

**Datum:** 2026-10-07

## 1. Bakgrund och syfte

I japanskan är månadens dagar (1–31) ökända för sina många oregelbundna läsningar. De första tio dagarna (一日 till 十日) använder urjapanska (wago) räkneord som slutar på *-ka* (med undantag för *tsuitachi*), och ytterligare undantag finns på den 14:e (*juuyokka*), 20:e (*hatsuka*) och 24:e (*nijuuyokka*). Övriga dagar följer i huvudsak mönstret kinesisk sifferläsning + *nichi* (med vissa ljudskiftningar som *shichinichi* och *kunichi*).

Syftet med denna övning är att ge studenten ett dedikerat verktyg för att nöta in dessa datumformer med omedelbar feedback, förklaringar av undantagsmönster och automatisk repetition av svåra dagar.

## 2. Fastställd design (Grilling-beslut)

Denna specifikation bygger på den gemensamma förståelse som fastställdes under intervjun:

1. **Omfattning & startlägen (Q1, Q8):**
   * Tre snabbval före start:
     1. **De första 10 (1–10):** Mjukstart med de mest grundläggande dagarna.
     2. **Alla undantag (1–10, 14, 20, 24):** Fokuserad drill på alla oregelbundna läsningar.
     3. **Hela månaden (1–31):** Fullständig kalenderdrill.
2. **Frågans format / Prompt (Q6):**
   * Prompten visar svenskt datum (t.ex. *”Den 4:e”* / *”4:e dagen i månaden”*) tillsammans med en visuell datum-/kalenderbricka (*4*).
   * Japanska kanji döljs i frågan för att tvinga fram aktiv hågkomst ur minnet utan att ge ledtrådar om uttalet.
3. **Svarsinmatning & stavningsvarianter (Q2, Q9):**
   * Fritextfält.
   * Accepterar både hiragana och romaji.
   * Flexibel stavning som godkänner vanliga transkriptioner (t.ex. för den 10:e godkänns både `とおか`, `tooka`, `touka` och `tōka`).
4. **Passflöde & felhantering (Q3, Q7):**
   * Körs ”tills det tar slut” eller användaren väljer ”Spara & lämna”.
   * **Loopande kortlek:** Frågor som besvaras fel läggs längst bak i kön och återkommer under samma pass tills användaren satt dem rätt minst en gång.
5. **Återkoppling & facit (Q4):**
   * Direkt facit per fråga med kanji, hiragana och romaji.
   * TTS-ljudknapp för att höra uttalet.
   * Pedagogisk förklaring för undantagsdagar (t.ex. förklaring till varför 4:e slutar på *-ka* och inte *-nichi*, samt specialfallet *hatsuka*).
6. **Placering & framsteg (Q5):**
   * Eget övningskort på startsidan.
   * Sparar resultat i profilens Leitner-/SRS-motor (`state.stats`), så att dagar med tidigare fel repeteras oftare över tid.

## 3. Arkitektur och teknisk lösning

### 3.1 Datamodell (`src/data.js`, `src/vocabulary-data.js`)
* Befintlig `calendarData.days_of_month` i `src/vocabulary-data.js` kompletteras vid behov med alias för romaji (t.ex. makron, vokalvarianter) och förklaringstexter.
* Frågeobjekt skapas med stabila ID:n `calendar-day-1` till `calendar-day-31`, ämne `'Dagar'` (eller `'Månadens dagar'`), svarsalternativ för alla stavningsvarianter och metadata (`dayNumber`, `isException`).

### 3.2 Inmatningsnormalisering (`src/engine.js`)
* Utöka eller säkerställa att `normalize` / svarens listor hanterar:
  * Makron: `ō` -> `oo` / `ou`, `ū` -> `uu`.
  * Mellanslag och skiljetecken strippas redan av befintlig `normalize`.

### 3.3 Flöde och sessionshantering (`src/session.js`, `src/main.js`)
* Nytt sessionsläge eller flagga `loopErrors: true`.
* När en fråga rättas med fel (`isOk === false`), läggs dess ID till sist i `session.ids` (och nollställs inför nästa omgång), så att passet fortsätter tills kön är tömd på fel.
* Avbrott via ”Spara & lämna” sparar aktuell historik och uppdaterar SRS utan krascher.

### 3.4 Presentation och UI (`src/views/home.js`, `src/views/session.js`, `src/style.css`)
* **Startsida:** Nytt kort för ”Öva på dagar” med snabbväljare för de 3 lägena (1–10, Undantag, 1–31) samt visning av antal bemästrade dagar.
* **Sessionsvy:** Specialvisning vid kalenderfrågor – en stilren datumbricka (kalenderblad med dagssiffran) och tydlig svensk prompt. Vid facit visas kanji, kana, romaji, ljud och förklaring.

## 4. Teststrategi
* Enhetstester för frågegenerering, svarsvarianter (makron, romaji, hiragana) och undantagsförklaringar.
* Tester för den loopande kortleken (felbesvarade frågor re-queueas och passet avslutas först när alla är rätt).
* Integrationstester för SRS-uppdatering och startsidans väljare.

## 5. Ärendeöversikt (Issues)
* **01:** Frågedata, svarsalias och pedagogiska undantagsförklaringar
* **02:** Lägesväljare och sessionsstart på startsidan
* **03:** Kalenderdesign på frågevyn och loopande kortlek
* **04:** SRS-integration, framstegsvisning och automattester
