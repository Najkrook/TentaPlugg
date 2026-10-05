# TentaPlugg · Japanska

Mobilanpassad studieapp för GEMA70/JAPC11, publicerad på https://japc11-tentaplugg.web.app.

## Kör lokalt

```powershell
npm install
npm run dev
npm test
npm run build
```

Om Windows-sandlådan blockerar testprocesser: `node --test --test-isolation=none tests/engine.test.js`.

## Innehåll

- Tre tentor med samtliga uppgifter, uppdelade i 138 delfrågor.
- 27 partikelluckor med originalfacit från Lesson5, dess sex bedömningsövningar och kompletterande övningar.
- I nya träningspass har de sex meningsövningarna två steg: markera partiklar och rätta markeringarna, sedan byta, flytta, lägga till eller ta bort partiklar direkt i meningen. Klockslagsövningen är bearbetad till ett tydligt partikelfel. Originalmaterialet är kvar.
- Båda stegen sparas och visas separat. Det automatiska resultatet kräver rätt i båda stegen; självskattningen kan därefter justera repetitionsbedömningen. Luckövningar och tentaläge behåller sina tidigare flöden.
- Nya sessioner använder `exerciseVersion: 1` och sparar interaktionen i `particles`, medan `answers` fortsatt innehåller text. Äldre sessioner utan denna version behåller originalfrågorna och fritextflödet. Frågevarianter och partikelpositioner finns i `src/particles.js`.
- Originalbilder/PDF:er finns i `public/material`. Modellsvar finns i `src/data.js`.
- Automatisk rättning av entydiga svar; självrättning för resonemang, fria meningar och terminologiskt tvetydiga frågor.
- Varje tenta summerar till 100 övningspoäng. Läsprovets II.1 har tilldelats 10 poäng för att summera till 100; poäng står inte utsatta där i originalet. Självbedömning ger allt eller inget per delfråga och reproducerar inte en lärares partiella poängsättning.
- Tentans modellösningar är inte officiella facit. Exempel på klassificeringen av kopulan och demonstrativer anges med förbehåll. Originalets formuleringar/romaniseringskonventioner kan skilja sig från andra läroböcker.

## Självrättning och nästa steg

Fritextfrågorna visar frågespecifika bedömningspunkter efter att modellösningen öppnats, samt en relevant snabbguide i en dialog som bevarar svaret. Punkterna bygger på befintliga modellösningar och ger inte automatiskt poäng.

Efter ett avslutat pass eller en inlämnad tenta föreslår resultatsidan ett nytt pass med högst fem frågor som bedömts som fel eller ”Behöver öva mer”. Svar som väntar på självbedömning ingår inte. Uppföljningen börjar med tomma svar och ett eget försöks-ID; ursprungsresultatet bevaras. Kriterier och guidemappning finns i `src/self-assessment.js`, urvalet i `src/follow-up.js`.

## Firebase och kostnader

Projekt: `tentaplugg-japanska-2026`. Google-inloggning, Firestore Standard i EU (`eur3`) och statisk Firebase Hosting. Fakturering verifierades avstängd vid publicering. Inga AI-anrop, Cloud Functions eller betalda API:er används. Gratisgränser kan begränsa tillgängligheten.

Gäster sparar lokalt. Konton har separata lokala data och privata Firestore-dokument (`users/{uid}/progress/state`). Gästdata överförs inte automatiskt till Google-kontot, så att en delad enhets tidigare användares svar inte hamnar i fel konto. Tentautkast, resultat och tentadatum synkas med transaktioner och tidsstämplar. Fortsatt arbete utan nät sparas lokalt och synkas när anslutningen återkommer.

Reglerna i `firestore.rules` tillåter endast ägaren att läsa/skriva sin data. Webbens Firebase-konfiguration innehåller endast publika projektidentifierare. Inga administrativa nycklar ingår i appen. Google-inloggning fungerar på de två Firebase-domänerna; localhost är avsiktligt inte auktoriserad.

```powershell
npm run build
npx firebase deploy --only hosting,firestore:rules --project tentaplugg-japanska-2026
```

## Verifiering

Automatiska kontroller täcker normalisering, repetition, unika fråge-ID:n, bildreferenser, poängsummor och sammanslagning av sparade data. Webbläsartest omfattar dator/mobil, partikelrättning, sparning efter omladdning, inlämning och självrättning. Google-provider och avstängd fakturering verifieras separat; full Google-inloggning kräver en användares konto.

## Repetition och dagsplan

400 frågor, inklusive 142 frivilliga kanafrågor samt 24 kompletterande frågor vardera om moror/stavelser och ordföljd. Kana accepterar Hepburn/Kunrei-varianter enligt varje frågas facit (exempelvis shi/si, chi/ti, tsu/tu, fu/hu, ji/zi, ji/di och zu/du där de är relevanta).

Fem Leitner-lådor använder 10 minuter, 1, 3, 7 och 14 dagar. Förfallna frågor kommer först. Extra träning höjer inte samma fråga flera gånger samma Stockholmsdag. Ändrad självrättning ersätter samma försöks bedömning. Dagsplanens tre uppgifter sparas per dag och synkas med kontot. Efter tentadatum fortsätter repetitionen utan nedräkning.

Sparmodell v2 migrerar tidigare lokala och molnsparade data; den befintliga lagringsnyckeln behålls. Historik utan bedömningsunderlag får inga påhittade poäng. Importera gästdata via Framsteg efter inloggning: importen visar konto och omfattning, kan upprepas utan dubbletter och lämnar gästoriginalet kvar. Kontots tentadatum behålls. Standarddatum och datumövningens fasta referens finns i `src/config.js`.

## Testa och förbered CI

Node 22+ och Java 21 krävs för hela testsuiten:

```powershell
npm ci
npm run format:check
npm test
npm run build
npx playwright install chromium webkit
npm run test:ci
```

`test:ci` startar Auth/Firestore-emulatorer mot det isolerade projektet `demo-tentaplugg`, testar konton och regler och kör Chromium/WebKit med mobilbredd. IME-testet simulerar composition-händelser; ett fysiskt japanskt tangentbord måste kontrolleras separat. `npm run test:e2e` kan också köra gästflöden utan emulatorer. Lokal sparning testas med kontrollerad klocka; verklig Google-inloggning ingår inte i emulatortesterna.

`.github/workflows/checks.yml` är endast förberedd lokalt. Inget GitHub-repo, anslutning eller autentiseringsresurs har skapats. Framtida CI kör formatkontroll, enhetstester, bygge och emulatortester/webbläsartester på PR och main. Deploy kräver godkända tester, push till main och repo-variabeln `ENABLE_FIREBASE_DEPLOY=true`. Konfigurera då separat Workload Identity Federation med `FIREBASE_WIF_PROVIDER` och `FIREBASE_DEPLOY_SERVICE_ACCOUNT`, begränsat till avsett repo/branch och minsta Hosting-behörigheter. Inga servicekontonycklar ska läggas in.

Appen använder sin web.app-domän som authDomain. iOS och fristående visning använder redirect; blockerad popup får redirect som reserv. Avbruten inloggning startar inte om automatiskt. Fullständig Google-inloggning på en fysisk Safari-enhet kräver manuell kontroll efter publicering.
