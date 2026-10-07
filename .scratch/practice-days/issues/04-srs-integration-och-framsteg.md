# 04 — SRS-integration, framstegsvisning och automattester

**What to build:** Koppla resultat från kalenderpass till appens Leitner-/SRS-motor (`state.stats`), visa framsteg på startsidans övningskort, samt implementera omfattande automatiserade tester som verifierar hela flödet.

**Blocked by:** 01 — Frågedata, svarsalias och pedagogiska undantagsförklaringar, 02 — Lägesväljare och sessionsstart på startsidan, 03 — Kalenderdesign på frågevyn och loopande kortlek

**Status:** ready-for-agent

**Workflow:** done

**Prioritet:** P1

**Parent:** [Specifikation](../spec.md)

- [x] Säkerställ att genomförda kalenderfrågor uppdaterar `state.stats['calendar-day-${day}']` med rätt box och `dueAt`.
- [x] Visa framstegsindikator på övningskortet på startsidan (t.ex. *”X av 31 dagar bemästrade”* eller progressbar).
- [x] Testa och verifiera:
  - Enhetstester för alla 31 frågors struktur, svarsalias (kana, romaji, makron) och förklaringar.
  - Tester för lägesväljarens filtrering (1–10, undantag, 1–31).
  - Tester för den loopande kortleken (missade frågor läggs till sist och rensas vid rätt svar).
  - Regressionstestning så att alla befintliga 188 tester fortsätter att passera.
- [x] Säkerställ tillgänglighet (WCAG AA-kontraster, skärmläsartexter, tangentbordsstyrning).

**Avgränsning:** Påverkar inte befintlig datastruktur för vanliga flervalsfrågor eller glosor.

**Verifierbar leverans:** Samtliga tester passerar, inklusive nya tester för kalenderövningen, och användarens framsteg sparas och visualiseras korrekt.
