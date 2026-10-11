# Specifikation: Goto-sensei Mocktenta (JAPC11/JAPD02)

Status: ready-for-agent
Workflow: done

## Bakgrund
Användaren har tillhandahållit en 6-sidig övningstenta ("JAPC11/JAPD02 Grammatik 1 Mock tentan 模試") från grammatikläraren Natsumi Goto, samt ett inscannat facit med lärarens kommentarer och förklaringar. Tentan innehåller fler övningsfrågor än den ordinarie tentan och ska finnas tillgänglig bland övriga tentor under tentavyn.

## Mål och omfattning
1. **Tentamensidentitet**:
   - `id`: `goto-mock`
   - `title`: `Goto-sensei Mocktenta`
   - `subtitle`: `JAPC11/JAPD02 · Grammatik 1 模試`
   - `description`: `Skriftsystem, ordklasser, partiklar, ordföljd och ljudsystem. Extratenta från Goto-sensei.`
   - `pages`: 6
   - `points`: 100
2. **Originalmaterial**:
   - PDF placeras som `Material/goto-mock.pdf` och `public/material/goto-mock.pdf`.
   - Högupplösta sidbilder genereras och sparas som `public/material/goto-mock-1.jpg` t.o.m. `public/material/goto-mock-6.jpg`.
3. **Frågor och poängfördelning (exakt 100p)**:
   - **Del 1.1** (Sida 1): Tre skriftsystem (phonographic, ideographic, pictographic), essäfråga med modellsvar och checklista: **10p**.
   - **Del 1.2** (Sida 2): Kanji-läsningar (on/kun, Genki-exempel), essäfråga med modellsvar och checklista: **9p**.
   - **Del 1.3** (Sida 2): Romanisering av understrukna orden (3 uppgifter à 2p): **6p**.
   - **Del 2** (Sida 3): Ordklasser (18 understrukna ord à 1p, flerval): **18p**.
   - **Del 3** (Sida 4): Partikelfunktioner (23 understrukna partiklar à 1p, flerval A–O): **23p**.
   - **Del 4** (Sida 5): Ordföljd (11 meningar à 2p, analys av S, O, V): **22p**.
   - **Del 5** (Sida 6): Sound system (stavelser & moror för 3 ord à 2p): **6p**.
   - **Del 6** (Sida 6): Sant eller falskt (6 påståenden à 1p): **6p**.
   - **Totalt**: 10 + 9 + 6 + 18 + 23 + 22 + 6 + 6 = 100p.
4. **Pedagogisk återkoppling**:
   - Modellsvar och tips från det handskrivna facitet (t.ex. att partikeln は uttalas wa, へ uttalas e, små tsu inte bildar stavelse, です/あります som copula-verb, topikmarkörers räckvidd, osv.) inkluderas i förklaringar och checklistor.
5. **Verifiering**:
   - Befintliga och nya enhetstester körs och ska passera med 100% framgång.
