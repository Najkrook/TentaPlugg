# TentaPlugg · Japanska

Mobilanpassad studieapp för GEMA70/JAPC11, publicerad på https://tentaplugg-japanska-2026.web.app.

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
- Originalbilder/PDF:er finns i `public/material`. Modellsvar finns i `src/data.js`.
- Automatisk rättning av entydiga svar; självrättning för resonemang, fria meningar och terminologiskt tvetydiga frågor.
- Varje tenta summerar till 100 övningspoäng. Läsprovets II.1 har tilldelats 10 poäng för att summera till 100; poäng står inte utsatta där i originalet. Självbedömning ger allt eller inget per delfråga och reproducerar inte en lärares partiella poängsättning.
- Tentans modellösningar är inte officiella facit. Exempel på klassificeringen av kopulan och demonstrativer anges med förbehåll. Originalets formuleringar/romaniseringskonventioner kan skilja sig från andra läroböcker.

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
