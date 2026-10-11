# Ärende 02: Definiera frågedata och poäng

Status: ready-for-agent
Workflow: done
Blocked by: 01 Tillgängliggör PDF och sidbilder

## Beskrivning
Lägg till tentan i `exams` och samtliga frågor i `examQuestions` i `src/data.js` (och pedagogisk berikning vid behov).
Implementera:
- Del 1.1: 10p, essä, self-assessed, checklistor och modellsvar baserat på tentans termer och lärarens kommentarer.
- Del 1.2: 9p, essä, self-assessed, checklistor om on/kun-yomi och Genki-exempel.
- Del 1.3: 3 frågor à 2p (6p) för romanisering av understrukna uttryck (`byōin wa koko`, `daigaku e jitensha`, `watashi wa toshokan`), med stöd för alternativa romaji-skrivsätt.
- Del 2: 18 frågor à 1p (18p) för ordklasser med flervalsalternativ och förklarande återkoppling.
- Del 3: 23 frågor à 1p (23p) för partikelfunktioner med alternativen A–O formaterade som `Bokstav. Namn`.
- Del 4: 11 frågor à 2p (22p) för ordföljd och identifiering av S, O, V med facits förklaringar.
- Del 5: 3 frågor à 2p (6p) för stavelser och moror (`ストックホルム`, `しんじゅく`, `コペンハーゲン`).
- Del 6: 6 frågor à 1p (6p) för sant/falskt med förklaringar.
Totalt poängsumma: exakt 100p.

## Acceptanskriterier
- Tentan `goto-mock` finns i `exams` med `pages: 6` och `points: 100`.
- Summan av alla poäng för `goto-mock` i `examQuestions` är exakt 100.
- Alla frågor har korrekta `page`-referenser (1 till 6).
