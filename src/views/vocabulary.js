import { html } from 'lit-html';
import { vocabularyList, kanjiList } from '../vocabulary-data.js';
import { heading, icon, speechButton } from './shared.js';

let activeLesson = 'all';
let activeCategory = 'all';
let searchQuery = '';

function typeCategory(wordType) {
  if (!wordType) return 'other';
  if (wordType.includes('verb')) return 'verbs';
  if (wordType === 'noun') return 'nouns';
  if (wordType.includes('adj')) return 'adjectives';
  return 'other';
}

function typeLabel(wordType) {
  const map = {
    'u-verb': 'u-verb',
    'ru-verb': 'ru-verb',
    'irregular-verb': 'oregelbundet verb',
    noun: 'substantiv',
    'i-adj': 'い-adjektiv',
    'na-adj': 'な-adjektiv',
    adverb: 'adverb',
    time: 'tidsord',
    expression: 'uttryck',
    pronoun: 'pronomen',
    particle: 'partikel',
    counter: 'räkneord',
  };
  return map[wordType] || wordType || 'ord';
}

function typeChipClass(wordType) {
  if (!wordType) return 'chip-other';
  if (wordType.includes('verb')) return 'chip-verb';
  if (wordType === 'noun') return 'chip-noun';
  if (wordType.includes('adj')) return 'chip-adj';
  if (wordType === 'time') return 'chip-time';
  return 'chip-other';
}

export function vocabularyView(ctx) {
  const isSakura = ctx.theme === 'sakura';

  // Filter kanji if kanji tab is selected
  const showKanji = activeCategory === 'kanji';

  const filteredKanji = kanjiList.filter((k) => {
    if (activeLesson !== 'all' && k.lesson !== Number(activeLesson)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchChar = k.kanji.toLowerCase().includes(q);
      const matchSv = (k.meaning_sv || '').toLowerCase().includes(q);
      const matchEn = (k.meaning_en || '').toLowerCase().includes(q);
      const matchOn = (k.onyomi || []).some((r) => r.toLowerCase().includes(q));
      const matchKun = (k.kunyomi || []).some((r) => r.toLowerCase().includes(q));
      const matchCompound = (k.compounds || []).some(
        (c) =>
          c.kanji.toLowerCase().includes(q) ||
          c.kana.toLowerCase().includes(q) ||
          (c.sv || '').toLowerCase().includes(q),
      );
      if (!matchChar && !matchSv && !matchEn && !matchOn && !matchKun && !matchCompound) {
        return false;
      }
    }
    return true;
  });

  const filteredVocab = vocabularyList.filter((v) => {
    if (activeLesson !== 'all' && v.lesson !== Number(activeLesson)) return false;
    if (activeCategory !== 'all') {
      if (typeCategory(v.wordType) !== activeCategory) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchKanji = (v.kanji || '').toLowerCase().includes(q);
      const matchKana = (v.kana || '').toLowerCase().includes(q);
      const matchRomaji = (v.romaji || '').toLowerCase().includes(q);
      const matchSv = (v.sv || '').toLowerCase().includes(q);
      const matchEn = (v.en || '').toLowerCase().includes(q);
      if (!matchKanji && !matchKana && !matchRomaji && !matchSv && !matchEn) {
        return false;
      }
    }
    return true;
  });

  const totalWords = vocabularyList.length;

  return html`
    <div class="view-breadcrumb">
      <button class="text-button" @click=${() => ctx.navigate('home')}>
        ${icon('ArrowLeft')} Tillbaka till studierummet
      </button>
      <button class="text-button" @click=${() => ctx.navigate('particles')}>
        Partikelguide ${icon('ChevronRight')}
      </button>
    </div>

    ${heading(
      'ORD & KANJI · GENKI I',
      'Genki I Ordförråd (Lektion 3–5)',
      'Bläddra bland 170+ glosor och 43 kanji från kursmaterialet med betydelser, uttal och ordklasser.',
    )}
    ${
      isSakura
        ? html`
            <div class="anime-figure vocab-anime-banner-card" aria-hidden="true">
              <img src="/anime/encourage.jpg" alt="Mascot encourage" loading="lazy" />
              <div class="vocab-anime-copy">
                <span class="vocab-anime-badge">🌸 GENKI I 単語帳 · VOCAB DRILL 🌸</span>
                <span class="vocab-anime-omamori">単語のお守り 🌸</span>
                <h3>先輩、単語をいっぱい覚えよう！(๑•̀ㅂ•́)و✧</h3>
                <p>言葉を覚えると世界が広がるよ！✨ Varje nytt ord öppnar en ny dörr! 💕</p>
              </div>
            </div>
            <div class="kawaii-vocab-tip kawaii-tip-callout" role="note">
              <div class="kawaii-tip-header">
                <span class="kawaii-tip-icon" aria-hidden="true">💡</span>
                <strong>Kawaii Studietips · Verbgrupper 🌸</strong>
              </div>
              <p>
                Dela upp verben i <em>u-verb</em> och <em>ru-verb</em>! Att känna igen verbets
                ändelse gör det superenkelt att bilda <em>te-form</em> och artig <em>masu-form</em>.
                Varje nytt ord du lär dig blommar i dina studier! ( ๑>ᴗ<๑ )و ✨
              </p>
            </div>
          `
        : html`
            <div class="notice">
              ${icon('CircleHelp')}
              <p>
                Referensordlista för Genki I (3:e upplagan) lektion 3, 4 och 5. Filtrera efter
                lektion eller ordklass och sök på svenska, engelska, kana eller kanji.
              </p>
            </div>
          `
    }

    <section class="vocab-controls-section">
      <div class="vocab-search-wrap">
        <input
          type="search"
          class="vocab-search-input"
          placeholder="Sök ord på svenska, kana, kanji eller romaji…"
          .value=${searchQuery}
          @input=${(e) => {
            searchQuery = e.target.value.trim();
            ctx.render?.();
          }}
          aria-label="Sök i ordförrådet"
        />
        ${
          searchQuery
            ? html`<button
                type="button"
                class="vocab-search-clear"
                @click=${() => {
                  searchQuery = '';
                  ctx.render?.();
                }}
                aria-label="Rensa sökning"
              >
                ×
              </button>`
            : ''
        }
      </div>

      <div class="vocab-filters-row">
        <div class="vocab-filter-group" role="group" aria-label="Filtrera efter lektion">
          <span class="filter-label">Lektion:</span>
          ${[
            ['all', 'Alla lektioner'],
            ['3', 'Lektion 3'],
            ['4', 'Lektion 4'],
            ['5', 'Lektion 5'],
          ].map(
            ([l, label]) => html`
              <button
                type="button"
                class="pill-filter-btn ${activeLesson === l ? 'active' : ''}"
                @click=${() => {
                  activeLesson = l;
                  ctx.render?.();
                }}
              >
                ${label}
              </button>
            `,
          )}
        </div>

        <div class="vocab-filter-group" role="group" aria-label="Filtrera efter ordklass">
          <span class="filter-label">Kategori:</span>
          ${[
            ['all', 'Alla ord'],
            ['verbs', 'Verb'],
            ['nouns', 'Substantiv'],
            ['adjectives', 'Adjektiv'],
            ['kanji', 'Kanji (43 st)'],
            ['other', 'Övrigt'],
          ].map(
            ([cat, label]) => html`
              <button
                type="button"
                class="pill-filter-btn ${activeCategory === cat ? 'active' : ''}"
                @click=${() => {
                  activeCategory = cat;
                  ctx.render?.();
                }}
              >
                ${label}
              </button>
            `,
          )}
        </div>
      </div>

      <div class="vocab-count-bar">
        <span>
          ${
            showKanji
              ? `Visar ${filteredKanji.length} av ${kanjiList.length} kanji`
              : `Visar ${filteredVocab.length} av ${totalWords} ord`
          }
        </span>
        <button class="secondary btn-sm" @click=${() => ctx.start('Ord & kanji')}>
          Träna ord i studierummet ${icon('ChevronRight')}
        </button>
      </div>
    </section>

    ${
      showKanji
        ? html`
            <section class="kanji-grid" aria-label="Kanji-kort">
              ${
                filteredKanji.length === 0
                  ? html`<p class="muted vocab-empty-msg">Inga kanji matchade din sökning.</p>`
                  : filteredKanji.map(
                      (k) => html`
                        <article class="kanji-card" data-kanji-id=${k.id}>
                          <div class="kanji-card-top">
                            <span class="kanji-display" lang="ja">${k.kanji}</span>
                            <div class="kanji-meta">
                              <span class="kanji-lesson-badge">Lektion ${k.lesson}</span>
                              <span class="kanji-strokes-badge">${k.strokes} streck</span>
                            </div>
                          </div>
                          <div class="kanji-meanings">
                            <strong>${k.meaning_sv}</strong>
                            ${k.meaning_en ? html`<span class="muted">(${k.meaning_en})</span>` : ''}
                          </div>
                          <div class="kanji-readings">
                            ${
                              k.onyomi?.length
                                ? html`<div class="reading-row">
                                    <span class="reading-label">On:</span>
                                    <span lang="ja">${k.onyomi.join(', ')}</span>
                                  </div>`
                                : ''
                            }
                            ${
                              k.kunyomi?.length
                                ? html`<div class="reading-row">
                                    <span class="reading-label">Kun:</span>
                                    <span lang="ja">${k.kunyomi.join(', ')}</span>
                                  </div>`
                                : ''
                            }
                          </div>
                          ${
                            k.compounds?.length
                              ? html`
                                  <div class="kanji-compounds">
                                    <span class="compounds-label">Sammansättningar:</span>
                                    <ul class="compounds-list">
                                      ${k.compounds.slice(0, 3).map(
                                        (c) => html`
                                          <li>
                                            <span lang="ja"
                                              ><strong>${c.kanji}</strong> (${c.kana})</span
                                            >
                                            <small>— ${c.sv || c.en}</small>
                                          </li>
                                        `,
                                      )}
                                    </ul>
                                  </div>
                                `
                              : ''
                          }
                          <div class="card-footer-actions">
                            ${speechButton(ctx, k.kanji, 'Lyssna')}
                          </div>
                        </article>
                      `,
                    )
              }
            </section>
          `
        : html`
            <section class="vocab-grid" aria-label="Ordförråds-kort">
              ${
                filteredVocab.length === 0
                  ? html`<p class="muted vocab-empty-msg">Inga ord matchade din sökning.</p>`
                  : filteredVocab.map(
                      (w) => html`
                        <article class="vocab-card" data-vocab-id=${w.id}>
                          <div class="vocab-card-header">
                            <span class="vocab-lesson-pill">L${w.lesson}</span>
                            <span class="vocab-type-chip ${typeChipClass(w.wordType)}">
                              ${typeLabel(w.wordType)}
                            </span>
                          </div>
                          <div class="vocab-card-main">
                            <div class="vocab-japanese-wrap" lang="ja">
                              ${
                                w.kanji
                                  ? html`
                                      <span class="vocab-kanji">${w.kanji}</span>
                                      <span class="vocab-kana">${w.kana}</span>
                                    `
                                  : html`<span class="vocab-kanji only-kana">${w.kana}</span>`
                              }
                            </div>
                            <div class="vocab-romaji">${w.romaji}</div>
                            <div class="vocab-swedish">${w.sv}</div>
                            ${w.en ? html`<div class="vocab-english muted">${w.en}</div>` : ''}
                          </div>
                          <div class="vocab-card-actions">
                            ${speechButton(ctx, w.kana || w.kanji, 'Lyssna')}
                          </div>
                        </article>
                      `,
                    )
              }
            </section>
          `
    }
  `;
}
