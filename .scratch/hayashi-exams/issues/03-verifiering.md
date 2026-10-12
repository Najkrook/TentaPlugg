# 03 – Verifiera innehåll och användarflöden

Status: ready-for-agent
Workflow: done
Blocked by: 01 – Renskriv och modellera Hayashis frågor; 02 – Integrera versioner och facitskydd

Enhetstester: täckning, poäng, varianter, fyra alternativ, källluckor, rättningspolicy och lagring. Webbläsartester: mobilval/låsning, separata utkast, återupptagning, IME/Enter, inlämning, Kyoto-självbedömning och felträning. Visuell granskning i Chromium och iPhone 13/WebKit. Ingen fysisk iPhone eller molninloggning används.

## Verifierat

- `npm test`: 229 godkända.
- `npx playwright test tests/e2e/hayashi.spec.js tests/e2e/app.spec.js --workers=1`: 16 godkända (Chromium 1280×720 och WebKit/iPhone 13 390×664).
- `npm run build`: godkänt; endast varning om befintligt stort Firebase-paket.
- Skärmbilder granskade i systemets temporära katalog. Ingen horisontell överströmning i mobilflödet; frågor, knappar och skrivfält är läsbara.
- Facit-PDF och källsidbilder ingår inte i public/material. Inga ändringar av Firestore-regler eller publicering.
