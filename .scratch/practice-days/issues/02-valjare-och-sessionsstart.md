# 02 — Lägesväljare och sessionsstart på startsidan

**What to build:** Implementera ett dedikerat övningskort för ”Öva på dagar” på startsidan med en trelägesväljare (1–10, Alla undantag, Hela månaden) och anslutning till appens sessionsstart.

**Blocked by:** 01 — Frågedata, svarsalias och pedagogiska undantagsförklaringar

**Status:** ready-for-agent

**Workflow:** done

**Prioritet:** P1

**Parent:** [Specifikation](../spec.md)

- [x] Lägg till ett visuellt tilltalande övningskort för månadens dagar på startsidan (`src/views/home.js`).
- [x] Implementera en lägesväljare med 3 distinkta val:
  1. *De första 10 (1–10)*: Urval av frågorna `calendar-day-1` till `calendar-day-10`.
  2. *Alla undantag*: Urval av dagarna 1–10, 14, 20 och 24.
  3. *Hela månaden (1–31)*: Samtliga 31 dagar.
- [x] Stöd att starta ett kalenderpass direkt via knappen på kortet (`startDaysPractice(mode)` i `src/main.js`).
- [x] Sätt sessionsegenskaper (`mode: 'practice'`, `topic: 'Dagar'`, `loopErrors: true`, `daysMode: mode`).
- [x] Tillgänglighet: Lägesväljaren ska vara navigerbar med tangentbord och använda korrekta ARIA-attribut.

**Avgränsning:** Ärendet berör startsidan och sessionsstarten. Rendering av själva frågorna under ett pågående pass hanteras i ärende 03.

**Verifierbar leverans:** Användaren kan välja mellan de tre lägena på startsidan och klicka på startknappen för att initiera ett pass med exakt de avsedda fråge-ID:na.
