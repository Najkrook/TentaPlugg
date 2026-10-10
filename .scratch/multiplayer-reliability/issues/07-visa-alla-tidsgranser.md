# 07 — Visa båda svarsfönstren och samma deadline överallt

**What to build:** Spelaren ser den inledande 60-sekunderstiden och därefter åttasekundersfönstret från första mottagna svaret. Timer, svarsknappar och resultat följer samma tidsregel.

**Blocked by:** 03 — Ta emot samtidiga svar utan falska tidsstraff.

**Status:** ready-for-agent

**Workflow:** done

**Prioritet:** P2

**Fynd:** F7

**Parent:** [Specifikation](../spec.md)

- [x] Under aktiv runda utan svar visas återstående tid av 60 sekunder från rundans start, i stället för endast ”Väntar på svar…”. Nedräkningen före matchstart räknas inte som aktiv svarstid.
- [x] När första svarsposten har tagits emot växlar vyn till åtta sekunder från dess auktoritativa mottagningstid. Den gamla 60-sekundersgränsen används inte längre för rundans stängning.
- [x] Ett första svar strax före 60 sekunder ger det avsedda fulla åttasekundersfönstret, utan negativ tid, nolltidsblinkning eller för tidigt låsta knappar.
- [x] Siffror, progressindikator, knappaktivering och den slutliga svarskontrollen använder samma deadlinekontrakt. Exakt på deadline är rundan stängd för nya svar.
- [x] En ogiltig eller omsynkroniserande klocka visar det tillståndet i stället för en exakt nedräkning som inte går att lita på. Serverbekräftade svar och resultat ligger kvar.
- [x] Vid noll visas att svarstiden är slut medan slutresultatet hämtas; −50 presenteras först när ett verkligt timeoutresultat har fastställts. Ett i tid mottaget men sent sammanställt svar visas inte som timeout.
- [x] Nedräkningen är läsbar på mobil och dess betydelse finns i tillgänglig text. Uppdateringar ska inte läsa upp varje kvartsekund för skärmläsare.
- [x] Webbläsarprov täcker inledande 60-sekundersfönster, första svar nära dess slut, fullständigt uteblivna svar, sen snapshot och osäker klocka i Chromium och mobil WebKit.
- [x] Rena gränsprov för före/på/efter deadline stämmer med emulatorns verkliga mottagning och timeoutresultat. Varje uteblivet svar får högst ett straff.

**Varför blockerat:** 03 fastställer auktoritativ första mottagningstid och hur ett giltigt svar skiljs från en sen sammanställning. Timern ska visa detta slutliga kontrakt; klockkvalitet och kvittomodell ingår transitivt.

**Verifierbar leverans:** Låt båda spelarna avstå och följ den synliga nedräkningen hela vägen till timeout. Upprepa med ett första svar strax före 60 sekunder och se hela det nya åttasekundersfönstret.

## Comments

### Implementerat och verifierat 2026-10-10

- Vyn visar återstående tid av 60 sekunder före första svaret och byter till åtta sekunder från första auktoritativa mottagningstiden. Siffror och progressindikator använder `getRoundDeadline`, samma kontrakt som knappaktivering, klickkontroll och sammanställning av svarsposter. Exakt på deadline är svar stängda.
- Nedräkningen före matchstart visas separat. Vid ogiltig klocka visas omsynkronisering utan exakt svarstid eller matchstartssiffra. Bekräftade svar och poäng finns kvar.
- Vid noll visas ”Svarstiden är slut. Hämtar resultat…”. Vyn visar −50 endast för ett faktiskt fastställt timeoutresultat; saknat eget resultat tolkas inte längre som timeout.
- Timern har `role="timer"`, `aria-live="off"` och tillgänglig text med både återstående tid och svarsfönstrets betydelse. En separat statusrad annonserar endast förändrat tidsläge. Mobilhuvudet radbryts så att timern ryms utan sidscrollning.
- Webbläsarproven använder två isolerade klienter, verkliga Auth/Firestore-emulatorer och riktiga regler. De väntar hela den inledande minuten. Ett första svar skickas när två sekunder återstår; nästa svar tas emot efter den gamla 60-sekundersgränsen. Prenumerationsleverans fördröjs en sekund och verkliga sammanställningsskrivningar åtta sekunder. Proven verifierar att det nya fönstret inte blinkar noll eller går negativt och att båda svaren sparas korrekt utan falsk timeout.
- Vid fördröjd sammanställningscommit kan den befintliga resultatpausen hinna löpa ut före leveransen. Proven observerar därför varje renderat resultat via DOM-händelser i stället för att riskera att missa en kort banner. Den befintliga pausregeln ändras inte av denna ticket.

Verifiering:

- `npm test`: 208/208 godkända, inklusive rena före/på/efter-gränsprov för båda svarsfönstren mot samma sammanställning som används i emulatorn.
- `npm run test:rules`: 36/36 godkända mot isolerat `demo-tentaplugg`. Befintliga prov täcker faktiska svarsposter före/på/efter deadline, sent första svar, fördröjd sammanställning och engångsregistrerat resultat.
- `npx playwright test tests/e2e/multiplayer.spec.js --grep visible --workers 2`: 6/6 godkända. Täcker 60 sekunder utan svar och exakt ett straff per spelare, sent första svar och fullt nytt åttasekundersfönster, sen snapshot/sammanställning samt osäker klocka med bevarat bekräftat svar.
- Miljö: `http://127.0.0.1:5175`, Chromium 1280×720 och iPhone 13/WebKit 390×664. Browser-pluginen saknas (”Browser plugin not available”); projektets befintliga Playwright används. Sididentitet, meningsfullt innehåll, avsaknad av Vite-overlay, konsol-/nätfel, verkliga klick, sparade resultat och mobilbredd är kontrollerade. Skärmbilder av inledande timer och förlängt svarsfönster är granskade; testartefakter sparas utanför repot.
- `npm run build`, berörda filers Prettier-kontroll och `git diff --check`: godkända. Befintlig varning om stor Firebase-bundle kvarstår.

Ingen deploy har gjorts. Ticket 06 om återanslutning återstår; föräldraspecifikationen är inte färdig.
