import { html } from 'lit-html';
import { guides } from '../data.js';
import { japaneseText } from '../speech.js';
import { heading, languageText, speechButton } from './shared.js';
export const guideView = (ctx) =>
  html`${heading('NÄR DU BEHÖVER EN LEDTRÅD', 'Snabbguide', 'Reglerna du oftast behöver på tentorna.')}
    <div class="guide-grid">
      ${guides.map(
        (g, i) =>
          html`<article class="guide">
            <span class="guide-index">0${i + 1}</span>
            <h2>${g.title}</h2>
            <p>${languageText(g.text)}</p>
            ${speechButton(ctx, japaneseText(g.text), 'Lyssna på exemplen')}
          </article>`,
      )}
    </div>
    <section class="section-block">
      <h2>Repetition med mellanrum</h2>
      <p>
        Fem lådor: 10 minuter, 1 dag, 3 dagar, 7 dagar och 14 dagar. Rätt flyttar dig upp när frågan
        är redo. Fel börjar om i första lådan. Extraträning samma dag ger ingen extra uppflyttning.
      </p>
      <h2>Material & rättning</h2>
      <p>
        27 partikelluckor har originalfacit i Lesson5. Övriga svar är modellösningar. Kana-drillen
        använder Hepburn och godtar vanliga Kunrei-varianter som si/shi och ti/chi.
      </p>
      <a href="/material/lesson5.pdf" target="_blank" rel="noopener">Öppna Lesson5</a>
      <p class="muted">
        Mobiltangentbordet hjälper med kanji. Öva även för hand inför en papperstenta.
      </p>
    </section>`;
