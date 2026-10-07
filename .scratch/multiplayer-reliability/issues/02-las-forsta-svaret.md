# 02 — Lås första svaret och visa dess leveransstatus

**What to build:** Spelarens första klick låser valet direkt. Ett snabbt andra klick kan inte byta svaret, och spelet visar skillnaden mellan ett väntande, godtaget och misslyckat försök.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

**Workflow:** done

**Prioritet:** P2

**Fynd:** F4

**Parent:** [Specifikation](../spec.md)

- [x] Första klicket fångar val och stabil försöksidentitet och låser samtliga alternativ synkront, före nätanropets första väntan.
- [x] Musdubbelklick, två olika snabba val, tangentbord och pekinmatning kan inte skicka konkurrerande val för samma runda från samma vy.
- [x] Ett synligt ”Skickar svar…” skiljs från serverbekräftat svar. Rätt-/felmarkering, poäng och motsvarande ljud presenteras först efter att svaret faktiskt godtagits.
- [x] Svarsoperationens resultat skiljer godtaget eller redan mottaget svar från sen runda, redan stängd runda och leveransfel; ett tomt eller avvisat resultat visas inte som framgång.
- [x] Vid förlorat kvitto stäms det första försöket av, eller samma val omlevereras med samma identitet. Ett oklart utfall låser inte upp ett nytt val som kan konkurrera med ett redan sparat svar.
- [x] Ett definitivt fel ger en begriplig åtgärd. Om rundan är avslutad kan användaren inte skicka ett nytt svar på den gamla rundan.
- [x] Sena resultat från en tidigare runda, match eller återställd vy ändrar inte aktuell knappstatus eller feedback.
- [x] När den första nätbegäran fördröjs 2,5 s och ett annat alternativ aktiveras omedelbart efteråt är det endast det första valet som kan sparas. Testa även rätt första svar följt av fel andra svar.
- [x] Testet går via den verkliga matchvyn, svarsoperationen och emulatorerna och verifierar både synligt lås och slutligt lagrat svar. Det passerar i Chromium och mobil WebKit.

**Avgränsning:** Leverera mot nuvarande svarshantering med en kompatibel kvittomodell. Ärendet behöver inte vänta på att alla spelares gemensamma skrivkonflikt tas bort; den senare implementationen ska behålla samma val- och kvittokontrakt.

**Verifierbar leverans:** Ett rätt första klick följt av ett felaktigt andra klick under långsam kommunikation behåller rätt svar och ger ingen missvisande bekräftelse före serverns besked.

## Comments

### Genomfört 2026-10-07

Första valet låses synkront i matchvyn med ett stabilt försöks-ID. Vyn visar skickarstatus och ett säkert omförsök av samma val vid leveransfel. Färger och ljud kräver ett godtaget kvitto eller ett sparat svar från prenumerationen. Lokala Firestore-uppdateringar med väntande skrivningar används inte som serverbekräftelse. Rund-, lobby-, konto- och vyidentitet skyddar mot gamla callbacks.

Svarsoperationen returnerar `accepted`, `already-received`, `late`, `stale-round`, `closed` eller `rejected`; transportfel avvisar promisen. Godtagna kvitton innehåller det faktiskt sparade svaret. Ett befintligt svar stäms av även efter rundbyte utan att val eller poäng skrivs om. `attemptId` är ett additivt fält; nuvarande gemensamma transaktion behålls enligt avgränsningen. Ticket 03 ansvarar fortsatt för oberoende svarsmottagning och dess nya protokoll/regler.

Verifiering mot det isolerade demoprojektet och riktiga regler:

- `npm test`: 196/196 passerade.
- `npm run test:rules` inuti Firebase-emulatorerna: 17/17 passerade, inklusive kvittoavstämning, ändrat andra val, oförändrade poäng och avvisningsorsaker.
- `npx playwright test tests/e2e/multiplayer.spec.js --workers 2` inuti emulatorerna: 24/24 passerade i Chromium (1280×720) och mobil WebKit (iPhone 13, 390×664 viewport).
- UI-proven går via skapa/anslut/starta/svara med isolerade klienter. Firestores verkliga HTTP-gräns fördröjs 2,5 s; korrekt första val följt av annat val, musdubbelklick, tangentbord och mobil pekinmatning behåller första svaret. Skickarstatus, låsta knappar, avsaknad av förtida poängmarkering och slutligt lagrat svar kontrolleras.
- Injicerat leveransfel kan följas av omförsök av låst val. Fördröjda resultat efter rundbyte och återställd vy påverkar inte aktuella kontroller. De nya fördröjningsproven kontrollerar titel, URL, felöverlägg, konsolfel och sidfel. Skärmbilder av skickarstatus granskade på dator och mobil.
- `npm run build`, Prettier och `git diff --check` passerade. Bygget har befintlig varning om Firebase-bundlens storlek.

En mellanliggande UI-körning stördes av Vites omladdning vid källkodsändring. Den slutliga ostörda körningen ovan passerade alla 24 testfall. Ingen produktionsdeploy ingår.
