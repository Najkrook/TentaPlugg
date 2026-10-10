# 03 — Ta emot samtidiga svar utan falska tidsstraff

**What to build:** Tio spelare kan svara samtidigt utan att databasens interna väntan gör deras svar sena. Sparat val och serverns mottagningstid ligger fast medan rundpoäng, ställning och slutresultat sammanställs.

**Blocked by:** 01 — Tillförlitlig matchklocka med synlig omsynkronisering; 02 — Lås första svaret och visa dess leveransstatus.

**Status:** ready-for-agent

**Workflow:** done

**Prioritet:** P1

**Fynd:** F2

**Parent:** [Specifikation](../spec.md)

- [x] Ett första svar per match, runda och deltagare sparas som en oföränderlig post med stabil identitet och serverstämplad mottagningstid. Mottagandet kräver inte omskrivning av gemensam lobbydata.
- [x] Samma försök och innehåll kan omlevereras idempotent. Ett annat val eller manipulerad mottagningstid kan inte skriva över ett sparat svar.
- [x] Vyn och den offentliga svarsoperationen behåller det första-val- och kvittokontrakt som levererats i 02.
- [x] Första svarstid, svarsfönster, snabbaste korrekta svar och poäng beräknas från mottagna svar. Intern transaktionsstart, omförsök och färdigställandetid påverkar inte svarstiden.
- [x] Ett dokumenterat stabilt val avgör ordningen vid exakt samma servermottagningstid; lika mottagningstid ger lika tidspoäng för rätt svar.
- [x] Rundavslut kan inte tilldela timeout till ett svar som tagits emot före deadline. Även sammanställning som fördröjts till efter deadline ska inkludera svaret. Svar exakt på eller efter deadline avvisas.
- [x] Flera deltagare kan hjälpa till med sammanställning eller återuppta den efter värdens bortfall utan dubbla poäng, återgång till gammal runda eller fastlåst match.
- [x] Sista rundans giltiga svar inkluderas innan slutresultatet fastställs; matchstatistik och ELO för alla deltagare skrivs exakt en gång, atomärt enligt befintligt kontrakt.
- [x] Verkliga regler begränsar de nya svarsskrivningarna till rätt autentiserad deltagare, version och runda samt skyddar val och mottagningstid. Inför inte svagare regler för att kringgå transaktionsproblem.
- [x] Nya matcher har en uttrycklig protokollversion. Inkompatibla klienter får inte blanda gamla skrivningar med det nya protokollet; tidigare färdiga resultat är fortsatt läsbara.
- [x] Fem nya tiopersonsmatcher med samtidiga svar ger tio riktiga, godtagna svar per provrunda och noll falska timeoutstraff. Verifiera själva svarsposterna, inte endast att resultatsamlingen har tio poster som kan innehålla timeout.
- [x] Poängen i belastningsprovet stämmer med de registrerade mottagningstiderna. Ett deterministiskt prov som tvingar omförsök efter mottagandet visar oförändrade poäng och deadlines.
- [x] Gränsfall för dubbla leveranser, sent svar, sista runda och två samtidiga avslut provas genom emulatorerna; UI-kvittot provas genom minst ett riktigt webbläsarflöde.

**Varför blockerat:** 01 tillför klockans giltighet och samma deadlinekontrakt i vyn. 02 tillför den stabila svaravsikten och det användarsynliga kvitto som den nya mottagningen ska bära hela vägen.

**Avgränsning:** Nätets verkliga transporttid till servern är fortfarande en del av svarstiden. Ärendet får inte lösa samtidigheten genom att fritt lita på en klientangiven bakdatering eller genom att aktivera betald backend.

**Verifierbar leverans:** Tio klienter kan demonstrera samtidiga rätta svar utan timeout från databasens köer; även en framtvingad konflikt under sammanställningen behåller samtliga mottagna svar.


## Comments

### Implementerat och verifierat 2026-10-09

- Implementation finns i commit `ce8e2f4` (ticket 3). Regressionsprovet före ändringen godtog endast 6 av 10 samtidiga svar.
- Varje svar tas emot i en egen dokumenttransaktion under `answers/{roundIndex}_{uid}`, utan gemensam lobby i transaktionens konfliktmängd. Reglerna binder mottagningen till autentiserad deltagare, aktuell runda och protokoll 2. `receivedAt` måste vara serverns `request.time`; val, försöksidentitet och mottagningstid kan inte ändras. Exakt omleverans är tillåten.
- Poäng och deadlines sammanställs från de oföränderliga posterna. Tidigare rundpoäng räknas bort före ny sammanställning, vilket gör omförsök idempotenta. Lika servermottagningstid ger lika tidspoäng; UID i kodpunktsordning avgör snabbaste korrekta svar vid exakt lika tid.
- Innan första svaret har sammanställts tillåter mottagningen kandidater fram till den yttersta möjliga gränsen (rundstart + 68 s). Detta bevarar hela åttasekundersfönstret även vid ett första svar nära 60 s. Sammanställningen och det offentliga API-kvittot avvisar kandidater på/efter den verkliga deadlinen; en lagrad kandidat är alltså inte ensam bevis för ett godtaget svar. Belastningsprovet verifierar både råpost och slutligt godtaget svar.
- Sammanställning och timeout läser alla deltagares svarsposter, även saknade dokument, i samma transaktion. Ett konkurrerande mottagande tvingar omförsök före timeout eller slutregistrering. Sista rundans svar, poäng, statistik och ELO fastställs atomärt. Avhopp sammanställer också redan mottagna svar och håller lobbyns poänglista uppdaterad.
- Alla klienter observerar svarsposter och kan hjälpa till med sammanställning. Första-val-lås, skickarstatus, serverkvitto och återförsök med samma val kvarstår. Ett transportfel behandlas inte som bevis för sent svar.
- Nya lobbys och matcher har `protocolVersion: 2`. Matchändringar kräver en ny serverstämplad `gameUpdatedAt`, så äldre klienter inte kan återanvända gamla skrivningar genom att kopiera okända fält. Äldre färdiga resultat är fortsatt läsbara. Befintlig klientbaserad tillitsmodell för hela poängsystemet byggs inte om.

Verifiering av commit `ce8e2f4`:

- `npm test`: 207/207 godkända.
- `npm run build`: godkänt; befintlig varning om stor Firebase-bundle kvarstår.
- `npm run test:rules` mot lokala Auth/Firestore-emulatorer: 31/31 godkända. Täcker oföränderliga svar, fel ägare/version/runda, tid före start och efter deadline, dubbletter, exakt deadline, ett framtvingat riktigt transaktionsomförsök efter mottagning, två samtidiga slutregistreringar för tio spelare, avhopp med osammanställda svar och äldre resultat.
- `npx playwright test tests/e2e/multiplayer.spec.js --workers=1`: 35 godkända och ett avsiktligt överhoppat prov (tioklientlasten körs endast i Chromium). Övriga flöden kördes i Chromium på datorbredd och iPhone 13/WebKit. Fem nya tiopersonsmatcher gav 50 riktiga godtagna svar och noll falska timeoutstraff; poängen kontrollerades mot mottagningstiderna.
- UI-flöden verifierar mus, tangentbord och touch, skickarstatus utan förtida rätt/fel, låst första val, omleverans vid fel, sena callbacks, tio rundor och slutresultat. Konsolkontrollen validerar förväntade Firestore-omförsök genom exakt endpoint och felorsak (`FAILED_PRECONDITION` eller att en tidigare saknad svarspost nu finns), och underkänner andra fel.
- Publicering beställdes uttryckligen av användaren efter implementationen. Eftersom ticket 05 samtidigt bearbetas i arbetsmappen byggs och deployas den verifierade committen från en separat katalog.
