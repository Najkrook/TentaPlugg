# 01 — Tillförlitlig matchklocka med synlig omsynkronisering

**What to build:** En spelare blir redo först när matchklockans kvalitet räcker för gemensam start och svar. Dåliga prover, en gammal kalibrering eller återgång från bakgrunden leder till tydlig omsynkronisering i stället för flera sekunders dold avvikelse.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

**Workflow:** open

**Prioritet:** P1

**Fynd:** F3

**Parent:** [Specifikation](../spec.md)

- [ ] Matchklockans resultat omfattar tid, osäkerhet, senaste mättidpunkt och giltighet; vyn använder samma giltighetsbeslut som anslutnings- och svarsflödet.
- [ ] Högsta accepterade osäkerhet är 250 ms per klient och högsta ålder 60 s. Enbart det snabbaste provet räcker inte om även detta prov är osäkert.
- [ ] När samtliga prover har sex sekunders fördröjt kvitto blir spelaren inte redo med en klocka som går cirka tre sekunder fel. Vyn visar synkronisering eller ett begripligt återförsök.
- [ ] Kalibrering förnyas inför start, vid återgång till synlig flik och efter återanslutning. Svar och redo-bekräftelser spärras när klockan är ogiltig.
- [ ] Tidsprover och klockkorrigeringar tillämpas i versionsordning; en gammal asynkron kalibrering kan inte skriva över en nyare.
- [ ] Enhetsklockor med ±60 sekunders fel påverkar inte rundans tid eller start. Simulerad paus i monoton tid kräver en ny kalibrering innan fortsatt aktivt deltagande.
- [ ] Återkommande kalibrering är begränsad och överlappande försök samordnas; temporära tidsprover städas och fel lämnar inte en oändlig laddningsindikator.
- [ ] Verkliga anslutningsflöden mot emulatorerna samt smala deterministiska tidsprov visar skillnaden mellan giltig, osäker och föråldrad klocka. Chromium och mobil WebKit täcker den synliga återgången.
- [ ] Befintliga prov för väggklockskevhet, deadline och svar före nedräkning fortsätter att passera.

**Avgränsning:** Inför endast den injicerbara tids-/transportgräns som behövs före ändringen. Ärendet ändrar inte matchens poängkurva och inför inte hela startprotokollet.

**Verifierbar leverans:** Två klienter med godtagbar anslutning visar synkroniserad tid; en klient med dåliga prover får tydlig omsynkronisering och blir redo först när kvaliteten återställts.
