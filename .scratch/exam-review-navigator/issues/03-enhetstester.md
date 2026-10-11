# 03. Enhetstester och regressionstester

**Status:** ready-for-agent

**Workflow:** done

**Blocked by:** 02. CSS färgkodning och tema-stöd för granskningsknappar

## Beskrivning

Skapa automatiserade tester som validerar:
1. Under aktiv tentaskrivning visas endast neutrala `.answered` och `.current`, inte `correct`/`incorrect`/`pending`.
2. Efter inlämning (`review: true` eller `submittedAt`):
   - Rätt svar får klassen `correct` och `aria-label="Fråga N (Rätt)"`.
   - Fel svar får klassen `incorrect` och `aria-label="Fråga N (Fel)"`.
   - Självbedömda frågor som ej bedömts får klassen `pending` och `aria-label="Fråga N (Behöver kontrolleras)"`.
   - När ett självbedömt svar poängsätts uppdateras klassen till `correct` eller `incorrect`.
3. Verifiera att färgpaletterna för knapparna i båda temana uppfyller WCAG AA kontrastkrav (>= 4.5:1).
