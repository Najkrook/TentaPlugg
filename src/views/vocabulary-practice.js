import { html } from 'lit-html';
import { keyed } from 'lit-html/directives/keyed.js';
import { vocabularyById, vocabularyProgress, selectVocabulary } from '../vocabulary-practice.js';

export function vocabularyPracticePanel(ctx, lesson = 'all') {
  const p = vocabularyProgress(ctx.state.stats, ctx.now, lesson);
  const ready = selectVocabulary(ctx.state.stats, ctx.now, { lesson }).length > 0;
  const drafts = Object.values(ctx.state.drafts || {}).filter(
    (d) =>
      d.session?.vocabulary &&
      !d.session.done &&
      (lesson === 'all' || d.session.vocabularyLesson === lesson),
  );
  drafts.sort((a, b) => b.at - a.at);
  return html`<section class="vocabulary-practice-panel" aria-label="Glosträning">
    <p class="overline">LEKTION ${lesson === 'all' ? '3–5' : lesson} · BARA KANA</p>
    <h2>Lite i taget. Alla glosor.</h2>
    <p>
      Tio flervalsfrågor med hiragana och katakana. Varva svenska och japanska, och repetera det som
      behöver övas.
    </p>
    <div class="vocabulary-progress">
      <span><strong>${p.started} / ${p.total}</strong> påbörjade glosor</span>
      <span><strong>${p.bothCorrect}</strong> rätt åt båda hållen</span>
      <span><strong>${p.due}</strong> redo för repetition</span>
    </div>
    ${!ready ? html`<p>Dagens repetition är klar för det här urvalet.</p>` : ''}
    <div class="vocabulary-actions">
      <button class="primary" @click=${() => ctx.startVocabulary({ lesson, extra: !ready })}>
        ${ready ? 'Träna glosor' : 'Träna extra'}
      </button>
      ${drafts[0] ? html`<button class="secondary" @click=${() => ctx.resumeDraft(drafts[0])}>Fortsätt glospasset</button>` : ''}
    </div>
  </section>`;
}

export function vocabularySessionView(ctx) {
  const s = ctx.session;
  if (s.done) {
    const missed = s.ids.filter((id) => s.grades[id] === false);
    return html`<section class="result-panel vocabulary-session">
      <p class="overline">BRA JOBBAT</p>
      <h1 tabindex="-1">Glospasset är klart!</h1>
      <div class="result-number">
        ${s.ids.filter((id) => s.grades[id] === true).length}<span> / ${s.ids.length}</span>
      </div>
      <p>rätt på första försöket i det här passet</p>
      <div class="vocabulary-actions">
        ${missed.length ? html`<button class="secondary" @click=${() => ctx.startVocabulary({ lesson: s.vocabularyLesson, ids: missed })}>Öva missarna</button>` : ''}
        <button class="primary" @click=${() => ctx.startVocabulary({ lesson: s.vocabularyLesson })}>
          Nästa pass
        </button>
        <button class="text-button" @click=${() => ctx.navigate('vocabulary')}>
          Till glosorna
        </button>
      </div>
      <p>Missarna övas i ett nytt pass. Ditt resultat här sparas.</p>
      <ul class="vocabulary-result-list">
        ${s.ids.map((id) => {
          const q = vocabularyById.get(id);
          return html`<li>
            <span>${s.grades[id] ? 'Rätt' : 'Öva mer'}</span>
            <strong lang="ja">${q?.kana}</strong> — ${q?.sv}
          </li>`;
        })}
      </ul>
    </section>`;
  }
  const q = vocabularyById.get(s.ids[s.index]);
  if (!q)
    return html`<h1 tabindex="-1">Glosan finns inte längre.</h1>
      <button @click=${ctx.exit}>Tillbaka</button>`;
  const graded = typeof s.grades[q.id] === 'boolean';
  return keyed(
    q.id,
    html`<section class="vocabulary-session question-panel">
      <div class="session-top">
        <button class="text-button" @click=${ctx.exit}>Spara & lämna</button
        ><span>Glosor · ${s.index + 1} / ${s.ids.length}</span>
      </div>
      <p class="overline">
        LEKTION ${q.lesson} ·
        ${q.direction === 'sv' ? 'VÄLJ SVENSK BETYDELSE' : 'VÄLJ ORDET PÅ JAPANSKA'}
      </p>
      <h1 tabindex="-1" lang=${q.promptLang}>${q.prompt}</h1>
      ${q.direction === 'sv' && q.context ? html`<p>${q.context}</p>` : ''}
      <div class="vocabulary-choices" role="group" aria-label="Svarsalternativ">
        ${(s.vocabularyChoices[q.id] || []).map(
          (choice) =>
            html`<button
              class="secondary vocabulary-choice ${graded && choice === q.answers[0] ? 'vocabulary-correct' : ''} ${graded && choice === s.answers[q.id] && !s.grades[q.id] ? 'vocabulary-wrong' : ''}"
              lang=${q.answerLang}
              ?disabled=${graded}
              @click=${() => ctx.chooseVocabulary(q.id, choice)}
            >
              ${choice}
              ${graded && choice === q.answers[0] ? html`<span lang="sv">✓ Rätt svar</span>` : ''}
            </button>`,
        )}
      </div>
      ${
        graded
          ? html`<div class="vocabulary-feedback" role="status">
              <strong>${s.grades[q.id] ? 'Rätt!' : 'Inte riktigt. Rätt svar:'}</strong>
              <p><span lang="ja">${q.kana}</span> — ${q.sv}</p>
              <button class="primary vocabulary-next" @click=${ctx.next}>
                ${s.index === s.ids.length - 1 ? 'Visa resultat' : 'Nästa'}
              </button>
            </div>`
          : html`<p class="muted">
              Välj ett svar. Tabba mellan alternativen och välj med Enter eller mellanslag.
            </p>`
      }
    </section>`,
  );
}
