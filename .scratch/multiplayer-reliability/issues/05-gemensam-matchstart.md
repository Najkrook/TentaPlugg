# 05 — Förbered alla deltagare före gemensam matchstart

**What to build:** Värd och gäster förbereder samma matchversion innan nedräkningen börjar. En fördröjd värd ska inte stå kvar i lobbyn medan gästerna redan samlar poäng.

**Blocked by:** 04 — Visa verklig närvaro och hantera frånkopplade deltagare.

**Status:** ready-for-agent

**Workflow:** open

**Prioritet:** P1

**Fynd:** F1

**Parent:** [Specifikation](../spec.md)

- [ ] Startflödet omfattar synlig förberedelse, versionsbundna redo-bekräftelser från varje avsedd deltagare, gemensam framtida start och nedräkning.
- [ ] Värden måste bekräfta samma villkor som gästerna: rätt matchinnehåll, rätt startversion, giltig anslutning och godtagbar klockkvalitet.
- [ ] Endast bekräftelser för aktuell startversion och giltig anslutningssession räknas. Dubbla startklick och konkurrerande startförsök skapar inte flera matcher eller versioner som kan poängsättas samtidigt.
- [ ] En bekräftad startoperation kan uppdatera värdens egen vy utan att en senare leverans på samma prenumeration måste inväntas. Sena uppdateringar får inte föra vyn bakåt.
- [ ] Två och tio friska klienter i kontrollerat lokalt nät får aktiva svarsalternativ inom 500 ms från varandra och visar samma runda och deadline.
- [ ] När leveransen av värdens startuppdatering fördröjs 13 sekunder fortsätter gästen inte ensam i en giltig poängsatt start medan värden står kvar i lobby. Flödet använder bekräftad lokal start eller omförbereder säkert.
- [ ] En gäst som inte kan bekräfta rätt startläge eller vars närvaro förfaller gör att försöket väntar eller avbryts. En större fast nedräkning ersätter inte bekräftelseprotokollet.
- [ ] Förberedelsen kan avbrytas av värden och pågår högst 30 sekunder innan den återgår till ett begripligt försök-igen-läge utan resultat eller ELO.
- [ ] En för sent mottagen eller ogiltig startversion får inte tillåta svar i en gammal start. Om ett allvarligt leveransfel gör första rundan orättvis innan samtliga kunnat börja ogiltigförklaras starten och dess preliminära poäng, utan ELO; denna återgång är versionsskyddad.
- [ ] Nya startfält och bekräftelser behörighetskontrolleras, och inkompatibla klienter får ett uppdateringsbesked i stället för att starta med gamla antaganden.
- [ ] Webbläsarprov med verkliga klienter och emulatorer täcker fördröjd värd/gäst, dubbel start, bortfall under förberedelse, avbryt/nytt försök och gamla leveranser. Störningar injiceras vid transport- eller prenumerationsgränsen, inte genom att förfalska slutresultatet.
- [ ] Ingen omplanering ger dubbla poäng eller ELO och befintliga normala match- och avhoppsflöden förblir fungerande.

**Varför blockerat:** Giltig tid från 01 och aktuell deltagarnärvaro från 04 är de faktiska villkoren för att en redo-bekräftelse ska kunna accepteras. Svarsmottagningens interna ombyggnad är inte ett krav för att leverera detta startbeteende.

**Verifierbar leverans:** Fördröj värdens startleverans och visa att ingen längre får den reproducerade skillnaden med gästen i poängsatt spel och värden kvar i lobby.
