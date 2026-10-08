# 03 — Ta emot samtidiga svar utan falska tidsstraff

**What to build:** Tio spelare kan svara samtidigt utan att databasens interna väntan gör deras svar sena. Sparat val och serverns mottagningstid ligger fast medan rundpoäng, ställning och slutresultat sammanställs.

**Blocked by:** 01 — Tillförlitlig matchklocka med synlig omsynkronisering; 02 — Lås första svaret och visa dess leveransstatus.

**Status:** ready-for-agent

**Workflow:** in-progress

**Prioritet:** P1

**Fynd:** F2

**Parent:** [Specifikation](../spec.md)

- [ ] Ett första svar per match, runda och deltagare sparas som en oföränderlig post med stabil identitet och serverstämplad mottagningstid. Mottagandet kräver inte omskrivning av gemensam lobbydata.
- [ ] Samma försök och innehåll kan omlevereras idempotent. Ett annat val eller manipulerad mottagningstid kan inte skriva över ett sparat svar.
- [ ] Vyn och den offentliga svarsoperationen behåller det första-val- och kvittokontrakt som levererats i 02.
- [ ] Första svarstid, svarsfönster, snabbaste korrekta svar och poäng beräknas från mottagna svar. Intern transaktionsstart, omförsök och färdigställandetid påverkar inte svarstiden.
- [ ] Ett dokumenterat stabilt val avgör ordningen vid exakt samma servermottagningstid; lika mottagningstid ger lika tidspoäng för rätt svar.
- [ ] Rundavslut kan inte tilldela timeout till ett svar som tagits emot före deadline. Även sammanställning som fördröjts till efter deadline ska inkludera svaret. Svar exakt på eller efter deadline avvisas.
- [ ] Flera deltagare kan hjälpa till med sammanställning eller återuppta den efter värdens bortfall utan dubbla poäng, återgång till gammal runda eller fastlåst match.
- [ ] Sista rundans giltiga svar inkluderas innan slutresultatet fastställs; matchstatistik och ELO för alla deltagare skrivs exakt en gång, atomärt enligt befintligt kontrakt.
- [ ] Verkliga regler begränsar de nya svarsskrivningarna till rätt autentiserad deltagare, version och runda samt skyddar val och mottagningstid. Inför inte svagare regler för att kringgå transaktionsproblem.
- [ ] Nya matcher har en uttrycklig protokollversion. Inkompatibla klienter får inte blanda gamla skrivningar med det nya protokollet; tidigare färdiga resultat är fortsatt läsbara.
- [ ] Fem nya tiopersonsmatcher med samtidiga svar ger tio riktiga, godtagna svar per provrunda och noll falska timeoutstraff. Verifiera själva svarsposterna, inte endast att resultatsamlingen har tio poster som kan innehålla timeout.
- [ ] Poängen i belastningsprovet stämmer med de registrerade mottagningstiderna. Ett deterministiskt prov som tvingar omförsök efter mottagandet visar oförändrade poäng och deadlines.
- [ ] Gränsfall för dubbla leveranser, sent svar, sista runda och två samtidiga avslut provas genom emulatorerna; UI-kvittot provas genom minst ett riktigt webbläsarflöde.

**Varför blockerat:** 01 tillför klockans giltighet och samma deadlinekontrakt i vyn. 02 tillför den stabila svaravsikten och det användarsynliga kvitto som den nya mottagningen ska bära hela vägen.

**Avgränsning:** Nätets verkliga transporttid till servern är fortfarande en del av svarstiden. Ärendet får inte lösa samtidigheten genom att fritt lita på en klientangiven bakdatering eller genom att aktivera betald backend.

**Verifierbar leverans:** Tio klienter kan demonstrera samtidiga rätta svar utan timeout från databasens köer; även en framtvingad konflikt under sammanställningen behåller samtliga mottagna svar.
