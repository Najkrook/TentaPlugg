# 07 — Visa båda svarsfönstren och samma deadline överallt

**What to build:** Spelaren ser den inledande 60-sekunderstiden och därefter åttasekundersfönstret från första mottagna svaret. Timer, svarsknappar och resultat följer samma tidsregel.

**Blocked by:** 03 — Ta emot samtidiga svar utan falska tidsstraff.

**Status:** ready-for-agent

**Workflow:** open

**Prioritet:** P2

**Fynd:** F7

**Parent:** [Specifikation](../spec.md)

- [ ] Under aktiv runda utan svar visas återstående tid av 60 sekunder från rundans start, i stället för endast ”Väntar på svar…”. Nedräkningen före matchstart räknas inte som aktiv svarstid.
- [ ] När första svarsposten har tagits emot växlar vyn till åtta sekunder från dess auktoritativa mottagningstid. Den gamla 60-sekundersgränsen används inte längre för rundans stängning.
- [ ] Ett första svar strax före 60 sekunder ger det avsedda fulla åttasekundersfönstret, utan negativ tid, nolltidsblinkning eller för tidigt låsta knappar.
- [ ] Siffror, progressindikator, knappaktivering och den slutliga svarskontrollen använder samma deadlinekontrakt. Exakt på deadline är rundan stängd för nya svar.
- [ ] En ogiltig eller omsynkroniserande klocka visar det tillståndet i stället för en exakt nedräkning som inte går att lita på. Serverbekräftade svar och resultat ligger kvar.
- [ ] Vid noll visas att svarstiden är slut medan slutresultatet hämtas; −50 presenteras först när ett verkligt timeoutresultat har fastställts. Ett i tid mottaget men sent sammanställt svar visas inte som timeout.
- [ ] Nedräkningen är läsbar på mobil och dess betydelse finns i tillgänglig text. Uppdateringar ska inte läsa upp varje kvartsekund för skärmläsare.
- [ ] Webbläsarprov täcker inledande 60-sekundersfönster, första svar nära dess slut, fullständigt uteblivna svar, sen snapshot och osäker klocka i Chromium och mobil WebKit.
- [ ] Rena gränsprov för före/på/efter deadline stämmer med emulatorns verkliga mottagning och timeoutresultat. Varje uteblivet svar får högst ett straff.

**Varför blockerat:** 03 fastställer auktoritativ första mottagningstid och hur ett giltigt svar skiljs från en sen sammanställning. Timern ska visa detta slutliga kontrakt; klockkvalitet och kvittomodell ingår transitivt.

**Verifierbar leverans:** Låt båda spelarna avstå och följ den synliga nedräkningen hela vägen till timeout. Upprepa med ett första svar strax före 60 sekunder och se hela det nya åttasekundersfönstret.
