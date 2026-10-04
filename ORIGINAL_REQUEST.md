# Original User Request

## 2026-10-04T16:41:55Z

Implementera tre pedagogiska och visuella förbättringar i studieappen TentaPlugg (GEMA70/JAPC11): kontrastiv felåterkoppling med direktkoppling till Snabbguiden, flexibel Spaced Repetition med anpassad sessionsstorlek och självskattad svårighet, samt ett fullständigt valbart Sakura Anime Vibes-tema som integrerar de genererade anime-figurerna i `public/anime/`.

Working directory: c:\Users\Najk\Documents\ChatGPT\TentaPlugg
Integrity mode: development

## Requirements

### R1. Kontrastiv felåterkoppling & Snabbguide-integration

- Ge studenten specifik återkoppling vid vanliga felval som förklarar varför det valda alternativet inte passar (t.ex. skillnaden mellan plats för existens `に` och handling `で`).
- Gör det möjligt att öppna och läsa relevanta grammatikregler från Snabbguiden direkt under en pågående session utan att passets tillstånd går förlorat.

### R2. Flexibel Spaced Repetition & anpassad sessionsstorlek

- Tillåt studenten att välja sessionslängd (5, 10, 20 frågor eller alla förfallna frågor) från studierummet.
- Stöd självskattad svårighetsgrad (t.ex. Igen / Svårt / Bra / Lätt) vid repetition som uppdaterar Leitner-intervallen proportionerligt, med full bakåtkompatibilitet för sparad historik och synkning.

### R3. Sakura Anime Vibes-tema & figurer

- Skapa ett valbart Sakura Anime Vibes-tema (pastellrosa, lavendel, sakura-blomblad, manga-accenter) med en smidig temaväxlare (🌸 Sakura Anime vs 🎓 Klassisk) som bevarar användarens val i lokal lagring.
- Integrera anime-figurerna från `public/anime/` (`study.jpg`, `cheer.jpg`, `encourage.jpg`) på strategiska platser i appen (t.ex. studierummet/hemskärmen, vid lyckade svar/Yatta-ögonblick, och i resultatpanelen).
- Säkerställ att appen behåller hög läsbarhet, responsivitet och god kontrast i båda temana.

## Acceptance Criteria

### Pedagogik & Repetition

- [ ] Vid felaktigt svar på partikelfrågor med kända distraktorer visas en kontrastiv förklaring för det valda alternativet.
- [ ] Relevant avsnitt i Snabbguiden kan öppnas och läsas direkt från sessionsvyn utan att sessionen nollställs.
- [ ] Användaren kan välja mellan 5, 10, 20 eller alla förfallna frågor vid start av övningspass.
- [ ] Svårighetsgradering (Igen, Svårt, Bra, Lätt) uppdaterar nästa repetitionstidpunkt enligt definierade intervall utan att orsaka schemafel.

### Sakura Anime-tema

- [ ] En temaväxlare i gränssnittet växlar direkt mellan klassiskt tema och Sakura Anime-tema.
- [ ] Temavalet sparas och bevaras vid sidomladdning.
- [ ] Figurerna från `public/anime/` visas smakfullt i Anime-läget och döljs i det klassiska läget.
- [ ] Textkontraster och fokusindikatorer uppfyller WCAG AA i båda temana.

### Verifiering & Bygge

- [ ] Samtliga befintliga 24 enhetstester fortsätter att passera (`npm test`).
- [ ] Nya enhetstester verifierar den utökade repetitionslogiken och kontrastiva förklaringarna.
- [ ] Projektet bygger utan fel (`npm run build`).
