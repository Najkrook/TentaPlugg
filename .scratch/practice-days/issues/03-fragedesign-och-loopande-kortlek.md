# 03 — Kalenderdesign på frågevyn och loopande kortlek

**What to build:** Skapa specialanpassad rendering för kalenderfrågor i frågevyn (kalenderbricka med dagssiffra, dolda kanji i frågan) och implementera ”loopande kortlek” så att felbesvarade frågor re-queueas och passet körs tills alla frågor klarats av eller användaren manuellt lämnar.

**Blocked by:** 01 — Frågedata, svarsalias och pedagogiska undantagsförklaringar, 02 — Lägesväljare och sessionsstart på startsidan

**Status:** ready-for-agent

**Workflow:** done

**Prioritet:** P1

**Parent:** [Specifikation](../spec.md)

- [x] Anpassa frågepanelen i `src/views/session.js` för kalenderfrågor:
  - Rendera en snygg kalenderbricka med dagens siffra.
  - Visa tydlig rubrik med det svenska datumet (t.ex. *”Den 4:e”*).
  - Säkerställ att kanji inte visas i frågeställningen utan först efter att svar lämnats.
- [x] Inmatningsfältet är optimerat för snabb textinmatning med auto-fokus, och enter-tangenten skickar in / går vidare.
- [x] Återkoppling & facit:
  - Visa kanji (`四日`), kana (`よっか`), och romaji (`yokka`).
  - TTS-ljudknapp för att lyssna på uttalet.
  - Pedagogisk ruta för undantag med förklaring av mönstret.
- [x] Loopande kortlek i `src/main.js`:
  - När en fråga i en session med `loopErrors: true` besvaras fel (`isOk === false`), läggs frågans ID till i `session.failedLoopIds`.
  - När frågan dyker upp igen i kön nollställs tidigare inlämnat svar och betyg så att användaren får göra ett nytt försök.
  - Passet avslutas först när alla frågor i kön har besvarats korrekt minst en gång (eller när användaren trycker *”Spara & lämna”*).
  - Framstegsindikatorn (`x / y`) och knappar reflekterar återstående frågor och repetition.

**Avgränsning:** Ändringen ska inte påverka ordinarie tentamensläge eller andra övningstyper som inte har `loopErrors: true`.

**Verifierbar leverans:** En användare som svarar fel på en kalenderfråga får direkt facit och ser frågan återkomma i slutet av passet. Passet avslutas när alla fel rättats till.
