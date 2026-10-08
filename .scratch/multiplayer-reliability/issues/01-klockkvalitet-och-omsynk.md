# 01 — Tillförlitlig matchklocka med synlig omsynkronisering

**What to build:** En spelare blir redo först när matchklockans kvalitet räcker för gemensam start och svar. Dåliga prover, en gammal kalibrering eller återgång från bakgrunden leder till tydlig omsynkronisering i stället för flera sekunders dold avvikelse.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

**Workflow:** done

**Prioritet:** P1

**Fynd:** F3

**Parent:** [Specifikation](../spec.md)

- [x] Matchklockans resultat omfattar tid, osäkerhet, senaste mättidpunkt och giltighet; vyn använder samma giltighetsbeslut som anslutnings- och svarsflödet.
- [x] Högsta accepterade osäkerhet är 250 ms per klient och högsta ålder 60 s. Enbart det snabbaste provet räcker inte om även detta prov är osäkert.
- [x] När samtliga prover har sex sekunders fördröjt kvitto blir spelaren inte redo med en klocka som går cirka tre sekunder fel. Vyn visar synkronisering eller ett begripligt återförsök.
- [x] Kalibrering förnyas inför start, vid återgång till synlig flik och efter återanslutning. Svar och redo-bekräftelser spärras när klockan är ogiltig.
- [x] Tidsprover och klockkorrigeringar tillämpas i versionsordning; en gammal asynkron kalibrering kan inte skriva över en nyare.
- [x] Enhetsklockor med ±60 sekunders fel påverkar inte rundans tid eller start. Simulerad paus i monoton tid kräver en ny kalibrering innan fortsatt aktivt deltagande.
- [x] Återkommande kalibrering är begränsad och överlappande försök samordnas; temporära tidsprover städas och fel lämnar inte en oändlig laddningsindikator.
- [x] Verkliga anslutningsflöden mot emulatorerna samt smala deterministiska tidsprov visar skillnaden mellan giltig, osäker och föråldrad klocka. Chromium och mobil WebKit täcker den synliga återgången.
- [x] Befintliga prov för väggklockskevhet, deadline och svar före nedräkning fortsätter att passera.

**Avgränsning:** Inför endast den injicerbara tids-/transportgräns som behövs före ändringen. Ärendet ändrar inte matchens poängkurva och inför inte hela startprotokollet.

**Verifierbar leverans:** Två klienter med godtagbar anslutning visar synkroniserad tid; en klient med dåliga prover får tydlig omsynkronisering och blir redo först när kvaliteten återställts.

## Comments

### Genomfört 2026-10-08

Matchklockan har implementerats i `src/multiplayer-clock.js` och integrerats med `src/multiplayer.js` och `src/views/multiplayer.js`.

Arkitektur och mekanik:
- **Tid och osäkerhet:** Varje kalibrering tar tre tidsprov med `serverTimestamp()` och mäter Round Trip Time (RTT). Snabbaste provet väljs, med beräknad osäkerhet $RTT / 2$.
- **Kvalitetskriterier:** Maxgräns för osäkerhet är 250 ms och max ålder 60 s (`MAX_CLOCK_UNCERTAINTY_MS = 250`, `MAX_CLOCK_AGE_MS = 60000`). Om även det snabbaste provet överskrider 250 ms markeras klockan som `uncertain` och `valid: false`.
- **Lobby och närvaro:** Vid `createLobby` och `joinLobby` sätts `ready: clock.valid` och `clockStatus` i spelarens post. Värdens startknapp är inaktiverad tills alla deltagare är redo (`p.ready !== false`) och värdens egen klocka är giltig. Spelare med ogiltig klocka visas med rollen `Omsynkroniserar…` och en hjälpkort med omförsöksknapp (`.clock-sync-card` och `.resync-btn`).
- **Arena-spärr:** Om klockan blir ogiltig i arenan visas ett synkroniseringsfält (`.arena-sync-banner`), valknappar inaktiveras och svarsinlämning avvisas med status `rejected` och orsaken `clock-invalid`.
- **Livscykel och omsynkronisering:** Kalibreringen förnyas automatiskt vid `visibilitychange` (när fliken blir synlig igen), `pageshow`, `online`, vid upptäckt tidsglapp (>3 s i monoton timer) samt när klockans ålder överstiger 60 s.
- **Konkurrens och versionsordning:** Överlappande kalibreringsanrop samordnas via en delad promise. En monoton versionsräknare förhindrar att äldre asynkrona mätningar skriver över nyare resultat. Temporära tidsprov under `/users/{uid}/multiplayerClock/` raderas deterministiskt i transaktionens `finally`.
- **Väggklocksoberoende:** Klockan justeras relativt serverns tid och monoton tid (`performance.now()`), vilket gör spelstart och tidsgränser helt oberoende av lokal enhetsklocka (±60 s skeving).

Verifiering:
- `npm test`: 207/207 tester passerar, inklusive 11 deterministiska enhetstester i `tests/multiplayer-clock.test.js` som täcker osäkerhetsgränser, förkastande vid 6 s latens, 60 s åldrande, simulerade monotona pauser, versionsordning, anropssamordning och väggklocksoberoende.
- `npm run test:emulators`: 18/18 tester passerar, inklusive regeltester och transaktionsverifiering i emulatorn för klockkvalitet och spärrade inlämningar.
- `npx playwright test tests/e2e/multiplayer.spec.js`: 28/28 tester passerar i både Chromium och mobil WebKit (iPhone 13 viewport), inklusive:
  - Spelare med 6 s fördröjda tidsprov som visar omsynkroniseringskort och retry-knapp, och blir redo först när nätverkskvaliteten återställts.
  - Återgång till synlig flik (`visibilitychange`) som förnyar kalibreringen och bekräftar redo-status.
  - Befintliga tester för skev väggklocka, svar under nedräkning och deadline.
- `npm run build`, Prettier och `git diff --check`: Bygge och formatering slutförda utan fel.
