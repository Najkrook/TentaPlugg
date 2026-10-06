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


## 2026-10-06T08:28:33Z

Implement an "Ultra Kawaii" upgrade for TentaPlugg's Sakura mode: activate the sidebar peeking mascot, add sparkle/heart click particle bursts, enable interactive "poke-and-talk" mascot speech lines, add bouncy jelly button styling with playful kaomoji micro-copy, and add kawaii cards and badges across vocabulary and particle views.

Working directory: c:\Users\Najk\Documents\ChatGPT\TentaPlugg
Integrity mode: development

## Requirements

### R1. Sidebar Peeking Mascot
In Sakura mode, display an interactive peeking chibi mascot card in the sidebar containing an anime avatar and an encouraging speech bubble. All mascot elements must strictly adhere to the project's hard-hiding rules and remain hidden in Classic mode.

### R2. Sparkle & Heart Click Burst Effects
In Sakura mode, mouse clicks and touch taps spawn transient floating sparkle (`✨`), heart (`💖`), or sakura petal (`🌸`) particle animations originating from the click coordinate. Particles must clean themselves up from the DOM upon animation completion, honor `prefers-reduced-motion`, and not appear in Classic mode.

### R3. Interactive Mascot Dialogue ("Poke-and-Talk")
Interacting with mascots (study panel mascot and sidebar mascot) cycles dynamically through a varied set of joyful Japanese study quotes, kaomojis, and Swedish translations in their speech bubbles, while triggering cheerful sound feedback when audio is unmuted.

### R4. Jelly Bouncy Micro-interactions & Kaomoji Micro-copy
Buttons and interactive elements in Sakura mode must feature playful bouncy/jelly hover and tap micro-interactions. Key actions and feedback messages (such as navigation, submit buttons, and review prompts) should incorporate joyful kaomojis and encouraging phrasing in Sakura mode while keeping standard clean text in Classic mode.

### R5. Theming for Vocabulary and Particle Views
Extend the Sakura theme into the Vocabulary view and Particle view with cute pastel banner cards, kawaii tip callouts, and badge styling consistent with the existing study, exam, and guide views.

## Acceptance Criteria

### Visual & Interactive Theme Verification
- [ ] In Sakura mode (`state.theme === 'sakura'`), the sidebar renders a peeking mascot card with avatar and speech bubble.
- [ ] In Classic mode (`data-theme='classic'`), no anime figures, mascot cards, or sound controls are visible in the DOM or viewport.
- [ ] Clicking the study mascot or sidebar mascot in Sakura mode rotates through multiple unique dialogue strings and kaomojis.
- [ ] Clicking in Sakura mode triggers floating sparkle/heart particle effects that automatically despawn and produce no memory leaks or DOM clutter.
- [ ] The Vocabulary view (`/vocabulary`) and Particle view (`/particles`) render dedicated kawaii banner/encouragement cards when Sakura mode is active.
- [ ] Buttons and action controls in Sakura mode exhibit bouncy hover/press effects and playful kaomoji-enhanced labels where appropriate.

### Integrity & Test Verification
- [ ] `npm test` runs and passes all 109+ tests with 0 failures and 0 regressions.
- [ ] `npm run build` exits with code 0.
- [ ] `npm run format:check` passes without prettier formatting violations.
