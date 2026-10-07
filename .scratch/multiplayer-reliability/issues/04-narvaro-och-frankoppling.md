# 04 — Visa verklig närvaro och hantera frånkopplade deltagare

**What to build:** Värden ser vilka deltagare som faktiskt kan spela. En abrupt frånkopplad gäst står inte kvar som redo för alltid; pågående matcher ger en kort återanslutningsmöjlighet och fortsätter sedan enligt avhoppsreglerna.

**Blocked by:** 01 — Tillförlitlig matchklocka med synlig omsynkronisering.

**Status:** ready-for-agent

**Workflow:** open

**Prioritet:** P2

**Fynd:** F6

**Parent:** [Specifikation](../spec.md)

- [ ] Varje deltagare har serverstämplad närvaro och anslutningsidentitet. Närvaro förnyas ungefär var tionde sekund och upphör att vara giltig efter 45 sekunder utan förnyelse.
- [ ] Känd frånkoppling visas omedelbart och senast efter 45 sekunder räknas deltagaren inte längre som redo. Väntande lobbyantal och startknapp använder detta faktiska redo-underlag.
- [ ] När endast värden finns kvar med giltig närvaro kan matchen inte startas. En föråldrad värd gör en väntande lobby inaktiv enligt dess stängningsflöde.
- [ ] En aktiv match skiljer tillfälligt avbrott från uttryckligt avhopp. Ordinarie rundtid fortsätter under återanslutningsfristen; frånkoppling ger ingen extra svarstid.
- [ ] Återkomst innan närvaron löpt ut kan förnya sessionen. När utgången väl har verkställts i en aktiv match registreras avhopp exakt en gång och kan inte ångras av ett sent heartbeat.
- [ ] Matchen fortsätter med minst två återstående spelare och avslutas enligt befintlig regel när högst en återstår; poäng och ELO uppdateras inte flera gånger av konkurrerande närvarokontroller.
- [ ] Omladdning eller abrupt stängning förlitar sig inte på asynkron unload-städning. Uttryckligt lämna fortsätter att ge omedelbart avhopp.
- [ ] En gammal fliks callback eller session kan inte avregistrera en ny, giltig session. Om flera sessioner tillåts ska deltagaren anses närvarande så länge minst en tillåten session är giltig.
- [ ] Närvaroskrivningar är åtskilda från svarsmottagningen och skapar inte en återkommande konfliktpunkt i den gemensamma lobbydatan. Nödvändiga ägar- och tidsvalideringar ingår i reglerna.
- [ ] Emulator- och webbläsarprov täcker abrupt stängning, kort avbrott, 45-sekundersgränsen, försenat heartbeat och samtidig utgångshantering. Tiden styrs deterministiskt utan att ersätta den verkliga avhoppsoperationen.

**Varför blockerat:** 01 ger giltig matchtid och explicit osäkerhet, så att en skev enhetsklocka inte omedelbart frånkopplar en annan spelare.

**Verifierbar leverans:** Stäng en gäst utan städning, flytta testtiden förbi 45 sekunder och se att gästen inte längre är redo eller uppfyller startkravet. Upprepa i aktiv match och se ett enda korrekt avhopp.
