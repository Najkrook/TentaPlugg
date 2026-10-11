# Ärende 03: Enhetstester och verifiering

Status: ready-for-agent
Workflow: done
Blocked by: 02 Definiera frågedata och poäng

## Beskrivning
Verifiera med `npm test` att samtliga tester passerar, särskilt `engine.test.js` (som kräver 100p och existerande sidbilder för varje tenta).
Lägg vid behov till specifika tester för `goto-mock` för att validera acceptans av svarsvarianter (Hepburn-romaji, mora-format, etc.).

## Acceptanskriterier
- `npm test` passerar med 0 fel.
- Inga regressioner i befintlig funktionalitet.
