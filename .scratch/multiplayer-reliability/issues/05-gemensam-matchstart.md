# 05 — Förbered alla deltagare före gemensam matchstart

**What to build:** Värd och gäster förbereder samma matchversion innan nedräkningen börjar. En fördröjd värd ska inte stå kvar i lobbyn medan gästerna redan samlar poäng.

**Blocked by:** 04 — Visa verklig närvaro och hantera frånkopplade deltagare.

**Status:** ready-for-agent

**Workflow:** done

**Prioritet:** P1

**Fynd:** F1

**Parent:** [Specifikation](../spec.md)

- [x] Startflödet omfattar synlig förberedelse, versionsbundna redo-bekräftelser från varje avsedd deltagare, gemensam framtida start och nedräkning.
- [x] Värden måste bekräfta samma villkor som gästerna: rätt matchinnehåll, rätt startversion, giltig anslutning och godtagbar klockkvalitet.
- [x] Endast bekräftelser för aktuell startversion och giltig anslutningssession räknas. Dubbla startklick och konkurrerande startförsök skapar inte flera matcher eller versioner som kan poängsättas samtidigt.
- [x] En bekräftad startoperation kan uppdatera värdens egen vy utan att en senare leverans på samma prenumeration måste inväntas. Sena uppdateringar får inte föra vyn bakåt.
- [x] Två och tio friska klienter i kontrollerat lokalt nät får aktiva svarsalternativ inom 500 ms från varandra och visar samma runda och deadline.
- [x] När leveransen av värdens startuppdatering fördröjs 13 sekunder fortsätter gästen inte ensam i en giltig poängsatt start medan värden står kvar i lobby. Flödet använder bekräftad lokal start eller omförbereder säkert.
- [x] En gäst som inte kan bekräfta rätt startläge eller vars närvaro förfaller gör att försöket väntar eller avbryts. En större fast nedräkning ersätter inte bekräftelseprotokollet.
- [x] Förberedelsen kan avbrytas av värden och pågår högst 30 sekunder innan den återgår till ett begripligt försök-igen-läge utan resultat eller ELO.
- [x] En för sent mottagen eller ogiltig startversion får inte tillåta svar i en gammal start. Om ett allvarligt leveransfel gör första rundan orättvis innan samtliga kunnat börja ogiltigförklaras starten och dess preliminära poäng, utan ELO; denna återgång är versionsskyddad.
- [x] Nya startfält och bekräftelser behörighetskontrolleras, och inkompatibla klienter får ett uppdateringsbesked i stället för att starta med gamla antaganden.
- [x] Webbläsarprov med verkliga klienter och emulatorer täcker fördröjd värd/gäst, dubbel start, bortfall under förberedelse, avbryt/nytt försök och gamla leveranser. Störningar injiceras vid transport- eller prenumerationsgränsen, inte genom att förfalska slutresultatet.
- [x] Ingen omplanering ger dubbla poäng eller ELO och befintliga normala match- och avhoppsflöden förblir fungerande.

**Varför blockerat:** Giltig tid från 01 och aktuell deltagarnärvaro från 04 är de faktiska villkoren för att en redo-bekräftelse ska kunna accepteras. Svarsmottagningens interna ombyggnad är inte ett krav för att leverera detta startbeteende.

**Verifierbar leverans:** Fördröj värdens startleverans och visa att ingen längre får den reproducerade skillnaden med gästen i poängsatt spel och värden kvar i lobby.

## Comments

### Implementerat och verifierat 2026-10-09

- Protokoll 3 inför versionsbunden förberedelse: `preparing` → `countdown` → `confirmed`. Värden och varje avsedd gäst måste först ha laddat samma frågor och kalibrerat klockan. Bekräftelserna binds till startversion, UID, aktuell närvarosession och serverstämplad tid. Gamla bekräftelser kan inte återanvändas.
- När alla har förberett innehållet bestäms den gemensamma starten tre sekunder framåt. Varje klient bekräftar också att den tagit emot nedräkningen före starttidpunkten. Poängsatta svar tillåts först när alla dessa bekräftelser finns. En för sen gäst gör att försöket avbryts utan matchresultat eller ELO; någon större fast nedräkning används inte som ersättning för bekräftelserna.
- Bekräftade operationsresultat uppdaterar den egna vyn direkt. `gameRevision` hindrar äldre prenumerationsleveranser från att flytta vyn bakåt. Samtidiga start- och fasövergångar stäms av mot den sparade versionen även när Firestore regelvaliderar före konflikthanteringen.
- Förberedelsen visas med antal bekräftade deltagare och kan avbrytas av värden. Efter 30 sekunder, utgången närvaro eller otillräcklig klocka återgår försöket till ett tydligt försök-igen-läge. Avhopp under förberedelsen tar bort deltagaren eller stänger värdens lobby utan ELO.
- Svar och lokala svarsförsök binds även till startversionen. Efter ett avbrutet försök har den nya versionen en egen dokumentidentitet för svar; sena anrop från en tidigare version kan inte svara på den nya frågan. Äldre färdiga resultat förblir läsbara.
- Bekräftelser skriver endast deltagarens egna fält med atomär revisionsökning. De använder kortlivade transaktioner utan gemensam läskonflikt, i stället för långlivade skrivanslutningar som kan uttömma mobil-WebKits anslutningspool. Närvaro och svarsmottagning behåller sina separata skrivvägar.
- Den smala prenumerationsgränsen i `src/multiplayer-transport.js` gör att tester kan fördröja verkliga leveranser. Testerna ersätter inte sparat tillstånd, spelregler eller vycallbacks. Vid fördröjd gäst kompletteras prenumerationsfördröjningen med fördröjda verkliga transaktionssvar.

Verifiering:

- `npm test`: 207/207 godkända.
- `npm run build`: godkänt efter slutlig kodändring; befintlig varning om stor Firebase-bundle kvarstår. Prettier och `git diff --check` godkända.
- Slutlig `npm run test:rules` mot lokala Auth/Firestore-emulatorer: 36/36 godkända. Startproven täcker ägarskap, sessions- och versionsbindning, manipulerad tid/osäkerhet, samtidiga startklick, saknad nedräkningsbekräftelse, timeout, frånkoppling och uttryckligt lämnande utan ELO. Tidigare svarsmottagnings-, närvaro- och slutresultatprov passerar också.
- Sammanlagt 43 olika multiplayer-UI-prov har passerat över den breda körningen och riktade omkörningar. Tioklientlasten är avsiktligt överhoppad i WebKit. Äldre avhopps- och resultatprov väntar nu på aktiva svarsknappar innan de provar en påbörjad match; att rundvyn finns betyder inte längre att förberedelsen är färdig.
- Slutlig riktad körning efter bytet av skrivtransport: `npx playwright test tests/e2e/multiplayer.spec.js --grep "receipt contention|three-player tie|remaining players|startup:" --workers 1`: 13 godkända, 1 avsiktligt överhoppat. Detta täcker samtliga nya startflöden i Chromium och mobil-WebKit samt de tidigare fastlåsta treklientfallen. Övriga matchflöden passerade i föregående bred/riktad körning; hela UI-sviten kördes inte om efter den sista transportjusteringen.
- Fem nya tioklientmatcher i Chromium: högst 500 ms mellan första aktiva svarsknappar, en enda startversion trots dubbla startklick, 50 riktiga godtagna svar och poäng enligt de registrerade mottagningstiderna.
- Fördröjd värdleverans (13 s) behåller gemensam start via lokalt operationsresultat. Fördröjd gäst avbryter utan ELO och kan sedan starta och svara i en ny version. Gamla leveranser flyttar inte tillbaka vyn. Avbryt/nytt försök, 30-sekunderstimeout och gästbortfall har verifierats i båda webbläsarna.
- Miljö: `http://127.0.0.1:5175`, isolerat `demo-tentaplugg`, Chromium 1280×720 och iPhone 13/WebKit 390×664. Browser-pluginen saknas; projektets Playwright används. Sididentitet, meningsfullt innehåll, avsaknad av Vite-overlay, verkliga klickflöden och skärmbilder kontrollerades. Förberedelsevyn är läsbar på mobil.
- Konsol- och nätkontrollen underkänner oväntade fel. För ett konkurrerande startanrops 403 krävs rätt commit-endpoint, optimistiskt versionsvillkor, känt startsteg och en verifierad, färdigbekräftad serverversion med alla deltagare; allmänna behörighetsfel filtreras inte bort.

Implementation och verifiering ovan slutfördes utan deploy. Klient och Firestore-regler för protokoll 3 ska publiceras tillsammans. Ticket 06 (återanslutning) och 07 (synliga tidsgränser) återstår som egna leveranser.
