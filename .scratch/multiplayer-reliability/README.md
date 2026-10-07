# Multiplayer: godkänd specifikation och ärenden

**Status:** ready-for-agent — specifikationen och sju tickets publicerades lokalt efter användarens godkännande 2026-10-07. Ticket 02 är implementerad och verifierad; övriga sex tickets återstår.

[Läs hela specifikationen](spec.md).

## Godkänd testgräns

Testa de verkliga användarflödena med flera isolerade webbläsarklienter mot lokala Firebase-emulatorer och riktiga behörighetsregler. Verifiera både vad spelarna ser och vad som sparas. Komplettera med små deterministiska klockprov; ersätt inte spelreglerna med mockar. Det återanvänder projektets befintliga testgränser.

## Ärendeindelning

1. **[Tillförlitlig matchklocka med synlig omsynkronisering](issues/01-klockkvalitet-och-omsynk.md).** Blocked by: inga. Levererar giltighetskontrollerad tid och tydlig omsynkronisering vid dåliga prover eller återgång till fliken. Täcker F3.
2. **[Lås första svaret och visa dess leveransstatus](issues/02-las-forsta-svaret.md).** Blocked by: inga. Levererar första-klick-lås, skickarstatus och korrekt kvitto även vid dubbelklick eller leveransfel. Täcker F4.
3. **[Ta emot samtidiga svar utan falska tidsstraff](issues/03-samtidiga-svar-utan-tidsstraff.md).** Blocked by: 01, 02. Levererar oberoende svarsmottagning, rättvisa tidsberäkningar, idempotent sammanställning och engångsregistrerat slutresultat. Täcker F2.
4. **[Visa verklig närvaro och hantera frånkopplade deltagare](issues/04-narvaro-och-frankoppling.md).** Blocked by: 01. Levererar korrekt redo-antal och begränsad återanslutningsfrist följd av ett enda avhopp. Täcker F6.
5. **[Förbered alla deltagare före gemensam matchstart](issues/05-gemensam-matchstart.md).** Blocked by: 04 (01 ingår transitivt). Levererar bekräftad förberedelse, gemensam startversion och säker hantering av försenad värd eller gäst. Täcker F1.
6. **[Återanslut samma spelare efter omladdning](issues/06-ateranslut-efter-omladdning.md).** Blocked by: 02, 05 (04 ingår transitivt). Levererar återinträde till aktuellt läge utan dubbla svar, fel konto eller återupplivat avhopp. Täcker F5.
7. **[Visa båda svarsfönstren och samma deadline överallt](issues/07-visa-alla-tidsgranser.md).** Blocked by: 03. Levererar synlig 60-sekunderstimer, korrekt växling till åtta sekunder och konsekvent knapp-/timeoutbeteende. Täcker F7.

Ticket 02 är klar (2026-10-07). Nästa tillgängliga ärende är 01; ticket 03 väntar fortfarande på 01. Vart och ett innehåller egna acceptanskriterier, verifierbar leverans och motivering för sina blockerare. Ingen separat horisontell refaktorering föreslås.

## Godkända gränser

- Högst 250 ms uppskattad klockosäkerhet per klient och högst 60 s gammal kalibrering.
- Högst 500 ms skillnad i spelstart i kontrollerade friska testförhållanden.
- Högst 30 s förberedelse innan tydligt försök-igen-läge.
- Heartbeat var 10 s och giltig närvaro i 45 s, med återanslutning inom denna frist. Ordinarie rundtid fortsätter under ett avbrott.
- Befintliga 60 s före första svaret, därefter 8 s och 2 s resultatpaus samt befintlig poängkurva och ELO behålls.

Gränserna godkändes tillsammans med specifikationen. Obegränsat långsamt nät garanteras inte en exakt gemensam start; spelet måste i stället avbryta eller omförbereda en orättvis start tydligt och utan ELO.

## Tracker-setup

Användaren har valt lokala Markdown-filer, standardetiketterna och AGENTS.md. Följande konfiguration är aktiverad:

- [Agentinstruktioner](../../AGENTS.md).
- [Tracker-konfiguration](../../docs/agents/issue-tracker.md).
- [Standardetiketter](../../docs/agents/triage-labels.md).
- [Domändokumentens layout och läsregler](../../docs/agents/domain.md).

Specifikationen finns som `spec.md` och sju separata tickets i `issues/`, med status `ready-for-agent`. Ticket 02 har `Workflow: done`; övriga har öppet genomförande. Dessa skills kan nu använda konfigurationen, som också kan redigeras direkt vid behov. Ingen implementation, stängning av föräldraärende eller appdeploy ingick i planeringsuppdraget.

## Godkännande och verifiering

Användaren godkände testgränsen, de sju ärendenas storlek och beroenden samt AGENTS.md med svaret ”Godkänn förslaget och använd AGENTS.md (rekommenderas)”. Täckning av F1–F7, länkar, beroendeordning och Markdown-formatering har kontrollerats. Godkänd planering innebär inte att buggarna är åtgärdade eller att framtida acceptanstester har passerat.
