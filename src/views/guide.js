import { html } from 'lit-html';
import { guides } from '../data.js';
import { japaneseText } from '../speech.js';
import { heading, languageText, speechButton } from './shared.js';

/**
 * Normalizes guide IDs and maps common alias variations.
 * @param {string|null} id
 * @returns {string|null}
 */
export function resolveGuideId(id) {
  if (!id) return null;
  const raw = String(id).trim().toLowerCase();
  const stripped = raw.replace(/^guide-/, '');

  const aliases = {
    'ni-vs-de': 'ni-de',
    'de-vs-ni': 'ni-de',
    'wa-vs-ga': 'wa-ga',
    'ga-vs-wa': 'wa-ga',
    'wo-vs-to': 'wo-to-no-mo',
    'particles': 'ni-de',
    'partiklar': 'ni-de',
    'adjective': 'adjectives',
    'mora': 'moras',
    'stavelser': 'moras',
  };

  if (guides.some((g) => g.id === stripped)) return stripped;
  if (aliases[stripped]) return aliases[stripped];
  if (aliases[raw]) return aliases[raw];

  return stripped;
}

/**
 * Renders individual guide cards grid.
 */
export const guideCards = (ctx, { highlightId } = {}) => html`
  <div class="guide-grid">
    ${guides.map((g, i) => {
      const isTarget = g.id === highlightId;
      return html`
        <article
          class="guide ${isTarget ? 'guide-highlight' : ''}"
          id=${g.id}
          data-guide-id=${g.id}
          tabindex=${isTarget ? '-1' : '0'}
        >
          <a id=${`guide-${g.id}`} class="sr-only"></a>
          <span class="guide-index">0${i + 1}</span>
          ${isTarget ? html`<span class="guide-badge">Relevant för ditt svar</span>` : ''}
          <h2>${g.title}</h2>
          <p>${languageText(g.text)}</p>
          ${speechButton(ctx, japaneseText(g.text), 'Lyssna på exemplen')}
        </article>
      `;
    })}
  </div>
`;

/**
 * Renders the modal inner content.
 */
export const guideModalTemplate = (ctx, { guideId, onClose }) => {
  const activeId = resolveGuideId(guideId);
  return html`
    <div class="guide-modal-wrapper" role="document">
      <header class="guide-modal-header">
        <div>
          <span class="overline">SNABBGUIDE</span>
          <h2 id="guide-modal-title">Grammatik & partiklar</h2>
        </div>
        <button
          type="button"
          class="guide-modal-close"
          aria-label="Stäng snabbguide"
          title="Stäng snabbguide"
          @click=${onClose}
        >
          <span aria-hidden="true" style="font-size: 18px; line-height: 1;">&times;</span>
          <span>Stäng</span>
        </button>
      </header>
      <div class="guide-modal-body">
        ${guideCards(ctx, { highlightId: activeId })}
      </div>
      <footer class="guide-modal-footer">
        <button type="button" class="primary" @click=${onClose}>
          Återgå till övningen
        </button>
      </footer>
    </div>
  `;
};

/**
 * Full page guide view.
 */
export const guideView = (ctx) => html`
  ${heading('NÄR DU BEHÖVER EN LEDTRÅD', 'Snabbguide', 'Reglerna du oftast behöver på tentorna.')}
  ${guideCards(ctx)}
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
  </section>
`;
