import { html } from 'lit-html';
import { keyed } from 'lit-html/directives/keyed.js';
import {
  initialParticleState,
  isPunctuation,
  particleCharacters,
  particleChoices,
} from '../particles.js';
import { icon, languageText, speechButton } from './shared.js';

export function particleSessionView(ctx, q, ratings) {
  const s = ctx.session;
  const state = s.particles?.[q.id] || initialParticleState(q);
  const done = state.stage === 'done';
  const marking = ['mark', 'marked'].includes(state.stage);
  const act = (type, props = {}) => ctx.particleAction({ type, ...props });
  const editor = state.editor;
  const placing = editor?.mode.endsWith('-position');
  const choosing = editor?.mode.endsWith('-choice');
  const selectedToken = state.tokens.find((t) => t.id === editor?.id);
  return html`
    <div class="session-top">
      <button class="text-button" @click=${ctx.exit}>${icon('ArrowLeft')} Spara & lämna</button>
      <span>Träningspass · ${s.index + 1} / ${s.ids.length}</span>
    </div>
    <div class="session-track">
      <span style="width:${((s.index + 1) / s.ids.length) * 100}%"></span>
    </div>
    ${keyed(
      q.id,
      html`<section class="question-panel particle-panel" data-question-id=${q.id}>
        <div class="question-meta">
          <span>Partiklar</span
          ><span
            >${q.exercise.adapted ? 'Bearbetad träning · Lesson5' : 'Extra träning · Lesson5'}</span
          >
        </div>
        <ol class="particle-steps" aria-label="Övningens steg">
          <li aria-current=${marking ? 'step' : 'false'}>1. Hitta partiklarna</li>
          <li aria-current=${!marking ? 'step' : 'false'}>2. Rätta meningen</li>
        </ol>
        <h1 class="question-title" tabindex="-1">
          ${marking ? 'Markera de tecken som du tror är partiklar' : 'Ändra partiklarna om det behövs'}
        </h1>
        ${q.exercise.context ? html`<p class="particle-context">${q.exercise.context}</p>` : ''}
        <p class="muted">
          ${marking ? 'Tryck på ett tecken för att markera eller avmarkera det. Rätta när du är klar.' : 'Låt meningen vara om den redan är korrekt. Tryck på en partikel för att ändra den.'}
        </p>
        ${
          marking
            ? html`
                <div
                  class="particle-sentence particle-marking"
                  lang="ja"
                  role="group"
                  aria-label="Markera partiklar i meningen"
                >
                  ${particleCharacters(q.exercise).map((c, i) => {
                    const selected = state.selected.includes(c.id);
                    const result =
                      state.stage === 'marked'
                        ? state.marking.right.includes(c.id)
                          ? 'right'
                          : state.marking.wrong.includes(c.id)
                            ? 'wrong'
                            : state.marking.missed.includes(c.id)
                              ? 'missed'
                              : ''
                        : '';
                    const label = {
                      right: 'Rätt markerad',
                      wrong: 'Fel markerad',
                      missed: 'Missad partikel',
                    }[result];
                    return isPunctuation(c.text)
                      ? html`<span>${c.text}</span>`
                      : html` <button
                          type="button"
                          class="particle-char ${selected ? 'selected' : ''} ${result}"
                          data-char-id=${c.id}
                          aria-label="${c.text}, tecken ${i + 1}${label ? `, ${label}` : ''}"
                          aria-pressed=${selected}
                          aria-disabled=${state.stage !== 'mark'}
                          @click=${() => act('toggle', { id: c.id })}
                        >
                          ${c.text}${result ? html`<span class="particle-symbol" aria-hidden="true">${result === 'right' ? '✓' : result === 'wrong' ? '×' : '!'}</span>` : ''}
                        </button>`;
                  })}
                </div>
                ${
                  state.stage === 'marked'
                    ? html`<div class="particle-mark-result" role="status">
                        <strong
                          >${state.marking.ok ? 'Du hittade alla partiklar!' : 'Jämför dina markeringar'}</strong
                        >
                        <p>
                          ✓ ${state.marking.right.length} rätt markerade · ×
                          ${state.marking.wrong.length} fel markerade · !
                          ${state.marking.missed.length} missade
                        </p>
                        <p>
                          En partikel är en partikel även när den används fel. I steg 2 får du rätta
                          själva meningen.
                        </p>
                      </div>`
                    : ''
                }
              `
            : html`
                <div
                  class="particle-sentence particle-editing"
                  lang="ja"
                  role="group"
                  aria-label="Redigera partiklar i meningen"
                >
                  ${state.tokens.map(
                    (token, index) => html`
                      ${placing ? html`<button type="button" class="particle-position" aria-label="Placera före ${token.text}, position ${index + 1}" @click=${() => act('position', { index })}>＋</button>` : ''}
                      ${
                        token.particle && !done
                          ? html`<button
                              type="button"
                              class="particle-token ${editor?.id === token.id ? 'selected' : ''}"
                              data-token-id=${token.id}
                              aria-label="Ändra ${token.text}, del ${index + 1}"
                              aria-pressed=${editor?.id === token.id}
                              @click=${() => act('select', { id: token.id })}
                            >
                              ${token.text}
                            </button>`
                          : html`<span class=${token.particle ? 'particle-final-token' : ''}
                              >${token.text}</span
                            >`
                      }
                    `,
                  )}
                </div>
                ${
                  !done
                    ? html`
                        <div class="particle-tools">
                          <button class="secondary" @click=${() => act('add')}>
                            Lägg till partikel
                          </button>
                          <button class="text-button" @click=${() => act('reset')}>
                            Återställ meningen
                          </button>
                        </div>
                        ${
                          editor
                            ? html`<div
                                class="particle-editor"
                                role="region"
                                aria-label="Partikelverktyg"
                              >
                                <p role="status">
                                  ${placing ? 'Välj ett plustecken i meningen som placering.' : choosing ? 'Välj partikel:' : html`Vald partikel: <strong lang="ja">${selectedToken?.text}</strong>`}
                                </p>
                                <div class="particle-tools">
                                  ${
                                    editor.mode === 'selected'
                                      ? html` <button
                                            class="secondary"
                                            @click=${() => act('replace', { id: editor.id })}
                                          >
                                            Byt
                                          </button>
                                          <button
                                            class="secondary"
                                            @click=${() => act('remove', { id: editor.id })}
                                          >
                                            Ta bort
                                          </button>
                                          <button
                                            class="secondary"
                                            @click=${() => act('move', { id: editor.id })}
                                          >
                                            Flytta
                                          </button>`
                                      : ''
                                  }
                                  ${choosing ? particleChoices.map((text) => html`<button class="particle-option secondary" lang="ja" @click=${() => act('choice', { text })}>${text}</button>`) : ''}
                                  <button class="text-button" @click=${() => act('cancel')}>
                                    Avbryt
                                  </button>
                                </div>
                              </div>`
                            : ''
                        }
                      `
                    : html`
                        <div
                          class="feedback ${state.marking.ok && state.correctionOk ? 'good' : 'again'}"
                          role="status"
                        >
                          <h3>
                            ${state.marking.ok && state.correctionOk ? 'Båda stegen är rätt!' : 'Jämför dina två steg'}
                          </h3>
                          <p>
                            Steg 1: ${state.marking.ok ? 'Rätt' : 'Behöver övas'} —
                            ${state.marking.right.length} rätt markerade,
                            ${state.marking.wrong.length} fel markerade,
                            ${state.marking.missed.length} missade.
                          </p>
                          <p>
                            Steg 2:
                            ${state.correctionOk ? 'Rätt mening' : 'Meningen behöver rättas'}.
                          </p>
                          <p>
                            <strong>Godtaget svar:</strong>
                            <span lang="ja">${q.answers.join(' / ')}</span>
                          </p>
                          <p>${languageText(q.explanation)}</p>
                          ${speechButton(ctx, q.answers[0], 'Lyssna på svaret')}
                        </div>
                        ${ratings()}
                      `
                }
              `
        }
        <div class="question-actions">
          ${s.index > 0 ? html`<button class="secondary" @click=${() => ctx.jump(s.index - 1)}>Föregående</button>` : html`<span></span>`}
          ${
            state.stage === 'mark'
              ? html`<button class="primary" @click=${() => act('check-mark')}>
                  Rätta ${icon('Check')}
                </button>`
              : state.stage === 'marked'
                ? html`<button class="primary" @click=${() => act('continue')}>
                    Till steg 2 ${icon('ChevronRight')}
                  </button>`
                : state.stage === 'edit'
                  ? html`<button class="primary" @click=${() => act('check-edit')}>
                      Rätta meningen ${icon('Check')}
                    </button>`
                  : html`<button class="primary" @click=${ctx.next}>
                      ${s.index === s.ids.length - 1 ? 'Visa resultat' : 'Nästa fråga'}
                      ${icon('ChevronRight')}
                    </button>`
          }
        </div>
      </section>`,
    )}
  `;
}
