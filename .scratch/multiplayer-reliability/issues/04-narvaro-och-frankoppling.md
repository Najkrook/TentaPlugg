# 04 — Visa verklig närvaro och hantera frånkopplade deltagare

**What to build:** Värden ser vilka deltagare som faktiskt kan spela. En abrupt frånkopplad gäst står inte kvar som redo för alltid; pågående matcher ger en kort återanslutningsmöjlighet och fortsätter sedan enligt avhoppsreglerna.

**Blocked by:** 01 — Tillförlitlig matchklocka med synlig omsynkronisering.

**Status:** ready-for-agent

**Workflow:** done

**Prioritet:** P2

**Fynd:** F6

**Parent:** [Specifikation](../spec.md)

- [x] Varje deltagare har serverstämplad närvaro och anslutningsidentitet. Närvaro förnyas ungefär var tionde sekund och upphör att vara giltig efter 45 sekunder utan förnyelse.
- [x] Känd frånkoppling visas omedelbart och senast efter 45 sekunder räknas deltagaren inte längre som redo. Väntande lobbyantal och startknapp använder detta faktiska redo-underlag.
- [x] När endast värden finns kvar med giltig närvaro kan matchen inte startas. En föråldrad värd gör en väntande lobby inaktiv enligt dess stängningsflöde.
- [x] En aktiv match skiljer tillfälligt avbrott från uttryckligt avhopp. Ordinarie rundtid fortsätter under återanslutningsfristen; frånkoppling ger ingen extra svarstid.
- [x] Återkomst innan närvaron löpt ut kan förnya sessionen. När utgången väl har verkställts i en aktiv match registreras avhopp exakt en gång och kan inte ångras av ett sent heartbeat.
- [x] Matchen fortsätter med minst två återstående spelare och avslutas enligt befintlig regel när högst en återstår; poäng och ELO uppdateras inte flera gånger av konkurrerande närvarokontroller.
- [x] Omladdning eller abrupt stängning förlitar sig inte på asynkron unload-städning. Uttryckligt lämna fortsätter att ge omedelbart avhopp.
- [x] En gammal fliks callback eller session kan inte avregistrera en ny, giltig session. Om flera sessioner tillåts ska deltagaren anses närvarande så länge minst en tillåten session är giltig.
- [x] Närvaroskrivningar är åtskilda från svarsmottagningen och skapar inte en återkommande konfliktpunkt i den gemensamma lobbydatan. Nödvändiga ägar- och tidsvalideringar ingår i reglerna.
- [x] Emulator- och webbläsarprov täcker abrupt stängning, kort avbrott, 45-sekundersgränsen, försenat heartbeat och samtidig utgångshantering. Tiden styrs deterministiskt utan att ersätta den verkliga avhoppsoperationen.

**Varför blockerat:** 01 ger giltig matchtid och explicit osäkerhet, så att en skev enhetsklocka inte omedelbart frånkopplar en annan spelare.

**Verifierbar leverans:** Stäng en gäst utan städning, flytta testtiden förbi 45 sekunder och se att gästen inte längre är redo eller uppfyller startkravet. Upprepa i aktiv match och se ett enda korrekt avhopp.

## Comments

### Implementerat och verifierat 2026-10-08

- Nya lobbys har `presenceVersion: 1` och separata `presence/{uid}`-poster med serverstämplad `seenAt` och `sessionId`. En aktuell session tillåts per deltagare; en ny anslutning ersätter den gamla. Förnyelse från gammal session ignoreras, och automatiska callbacks avregistrerar inte en ny session.
- Alla deltagare förnyar var 10 s, även i match. Vid 45 s räknas närvaron som utgången. Regler kräver rätt autentiserad ägare, exakt fältform och serverns aktuella tid; en utgången/avhoppad deltagare får inte återupplivas i aktiv match. Kort avbrott kan förnya sessionen utan att ändra rundans tider.
- Lobbylista, vänteläge och startoperation använder närvaron. Starten läser närvaro atomärt, utesluter föråldrade gäster och kräver minst två närvarande spelare. Föråldrad värd gör lobbyn inaktiv.
- Lokal offline-händelse visas direkt. Abrupt stängning och omladdning skickar inget unload-avhopp. Övriga klienter upptäcker bortfallet när servernärvaron löper ut. Återinträdesvyn efter omladdning levereras fortsatt av ticket 06.
- Utgångskontrollen kräver giltig klocka och räknar konservativt med dess osäkerhet innan ett oåterkalleligt avhopp. Närvaron läses i samma transaktion som avhoppet, så en samtidig förnyelse kan inte tappas. Med minst två kvar fortsätter matchen; annars används befintligt atomärt matchavslut och ELO. Ett konkurrerande avslut stäms av mot det sparade slutresultatet om Firestore hinner regelvalidera före konfliktomförsök.
- För friska klienter används prenumererad närvaro; ingen återkommande transaktion läser alla deltagare förrän någon verkar ha löpt ut. Heartbeats skriver aldrig gemensam lobbydata.

Verifiering:

- `npm test`: 207/207 godkända.
- `npm run build`: godkänt; befintlig varning om stor Firebase-bundle kvarstår.
- `npm run test:rules` mot Auth/Firestore-emulatorerna och verkliga regler: 24/24 godkända. Täcker exakt 45-sekundersgräns, ägarskap, manipulerad tid, oförändrad lobby vid heartbeat, gammal session, kort avbrott, sent heartbeat, två samtidiga avslut, ELO exakt en gång och start med föråldrad gäst.
- `npx playwright test tests/e2e/multiplayer.spec.js`: 32/32 godkända i Chromium och mobil WebKit. Efter sista skyddet för automatisk stängning och ett nytt värdprov kördes `--grep "presence:"`: 6/6 godkända. Sammanlagt 34 olika multiplayerfall verifierade över körningarna.
- Flöden: skapa/join → abrupt gäststängning → en redo och spärrad start; aktiv match → kort offline/online utan ändrad rundtid → stängning → ett avhopp och ett slutresultat; värdstängning → stängt vänteläge utan avregistrerad gäst. Lokal URL `http://127.0.0.1:5175`, Chromium 1280×720 och iPhone 13/WebKit 390×664. Sididentitet, meningsfullt innehåll, ingen Vite-overlay, inga fångade pageerror-händelser och skärmbilder kontrollerades.
- Deterministisk utgång simuleras genom att åldra en närvaropost med emulatorns admin-fixture; själva klientoperationerna, transaktionerna, reglerna och resultatkontrollerna är verkliga. Ren gränsjämförelse provas på 44 999 respektive 45 000 ms.
- Bred `npm run test:ci`: regelprov godkända, 174/222 UI-prov godkända och 48 fel utanför multiplayer, främst overflow/layout på startsidan och i andra vyer. Dessa fel är inte åtgärdade inom denna ticket. Ingen produktionsdeploy utförd; Firestore-reglerna behöver följa med vid publicering.
