import { html } from 'lit-html';
import { exams, questions, examQuestions } from '../data.js';
import { latestAttempt, scoreAttempt, examErrors } from '../engine.js';
import { heading, icon } from './shared.js';
export function examsView(ctx) {
  return html`${heading('FRÅN KURSMATERIALET', 'Gamla tentor', 'Alla uppgifter, med originalbilder och sparade svar.')}
    ${ctx.theme === 'sakura'
      ? html`<div class="anime-figure exam-anime-banner-card" aria-hidden="true">
          <img src="/anime/mascot_cheer.jpg" alt="Mascot cheer" loading="lazy" />
          <div class="exam-anime-copy">
            <span class="exam-anime-omamori">🌸 絶対合格祈願 · ZETTAI GOUKAKU 🌸</span>
            <h3>Senpai krossar tentan! (ง •̀_•́)ง✨</h3>
            <p>Alla gamla tentor på ett ställe. Ta en tenta i taget så sitter allt! 💮💕</p>
          </div>
        </div>`
      : ''}
    <div class="notice">
      ${icon('CircleHelp')}
      <p>
        Tentorna saknar officiella facit. Modellsvaren är studiestöd. Poängen är en uppskattning och
        längre svar rättar du själv.
      </p>
    </div>
    <div class="exam-list">
      ${exams.map((e, i) => {
        const last = latestAttempt(ctx.state, e.id),
          score = last && !last.scoreUnavailable ? scoreAttempt(last, questions) : null,
          draft = ctx.state.drafts[e.id]?.session;
        return html`<article class="exam-card" data-exam-card=${e.id}>
          <span class="exam-number">0${i + 1}</span>
          <div>
            <span class="muted">${e.subtitle}</span>
            <h2>${e.title}</h2>
            <p>${e.description}</p>
            <div class="exam-meta">
              <span>${examQuestions.filter((q) => q.exam === e.id).length} delfrågor</span
              ><span>100 poäng</span
              ><a href="/material/${e.id}.pdf" target="_blank" rel="noopener">Visa original-PDF</a>
            </div>
            ${score ? html`<p class="exam-score">Senaste poäng: <strong>${score.earned}/${score.max}</strong>${score.pending ? html`<small>${score.pending} svar väntar på självrättning · preliminärt</small>` : ''}</p>` : html`<p class="muted">Ingen poängsatt inlämning ännu.</p>`}
          </div>
          <div class="exam-controls">
            <button class="primary" @click=${() => ctx.startExam(e.id)}>
              ${draft && !draft.done ? 'Fortsätt tentan' : 'Börja tentan'} ${icon('ChevronRight')}</button
            >${last ? html`<button class="secondary" @click=${() => ctx.openAttempt(last)}>Visa senaste resultat</button><button class="text-button" ?disabled=${!examErrors(last).length} @click=${() => ctx.startErrors(e.id)}>Öva felen (${examErrors(last).length})</button>` : ''}
          </div>
        </article>`;
      })}
    </div>`;
}
