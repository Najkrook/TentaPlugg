# 02 — Lås första svaret och visa dess leveransstatus

**What to build:** Spelarens första klick låser valet direkt. Ett snabbt andra klick kan inte byta svaret, och spelet visar skillnaden mellan ett väntande, godtaget och misslyckat försök.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

**Workflow:** open

**Prioritet:** P2

**Fynd:** F4

**Parent:** [Specifikation](../spec.md)

- [ ] Första klicket fångar val och stabil försöksidentitet och låser samtliga alternativ synkront, före nätanropets första väntan.
- [ ] Musdubbelklick, två olika snabba val, tangentbord och pekinmatning kan inte skicka konkurrerande val för samma runda från samma vy.
- [ ] Ett synligt ”Skickar svar…” skiljs från serverbekräftat svar. Rätt-/felmarkering, poäng och motsvarande ljud presenteras först efter att svaret faktiskt godtagits.
- [ ] Svarsoperationens resultat skiljer godtaget eller redan mottaget svar från sen runda, redan stängd runda och leveransfel; ett tomt eller avvisat resultat visas inte som framgång.
- [ ] Vid förlorat kvitto stäms det första försöket av, eller samma val omlevereras med samma identitet. Ett oklart utfall låser inte upp ett nytt val som kan konkurrera med ett redan sparat svar.
- [ ] Ett definitivt fel ger en begriplig åtgärd. Om rundan är avslutad kan användaren inte skicka ett nytt svar på den gamla rundan.
- [ ] Sena resultat från en tidigare runda, match eller återställd vy ändrar inte aktuell knappstatus eller feedback.
- [ ] När den första nätbegäran fördröjs 2,5 s och ett annat alternativ aktiveras omedelbart efteråt är det endast det första valet som kan sparas. Testa även rätt första svar följt av fel andra svar.
- [ ] Testet går via den verkliga matchvyn, svarsoperationen och emulatorerna och verifierar både synligt lås och slutligt lagrat svar. Det passerar i Chromium och mobil WebKit.

**Avgränsning:** Leverera mot nuvarande svarshantering med en kompatibel kvittomodell. Ärendet behöver inte vänta på att alla spelares gemensamma skrivkonflikt tas bort; den senare implementationen ska behålla samma val- och kvittokontrakt.

**Verifierbar leverans:** Ett rätt första klick följt av ett felaktigt andra klick under långsam kommunikation behåller rätt svar och ger ingen missvisande bekräftelse före serverns besked.
