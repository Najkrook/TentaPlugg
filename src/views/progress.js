import { html } from 'lit-html';
import { questions, topics } from '../data.js';
import { daysUntil } from '../engine.js';
import { heading } from './shared.js';
export function progressView(ctx) {
  const p = ctx.progress(),
    days = daysUntil(ctx.state.examDate, ctx.now);
  return html` ${heading('EN FRÅGA I TAGET', 'Mina framsteg', ctx.user ? 'Dina resultat är privata och sparas i ditt konto.' : 'Dina resultat sparas på den här enheten. Logga in för att synka.')}
    ${
      ctx.user
        ? html`<section class="import-panel">
            <h2>Har du tränat som gäst?</h2>
            <p>Importera bara om gästresultaten på den här enheten är dina.</p>
            <button class="secondary" @click=${ctx.importGuest}>
              Importera gästdata från den här enheten
            </button>
          </section>`
        : ''
    }
    <section class="progress-top">
      <div class="score-circle">
        <strong>${p.done ? Math.round((p.ok / p.done) * 100) : 0}%</strong><span>rätt senast</span>
      </div>
      <div>
        <h2>${p.done} frågor övade</h2>
        <p>${p.due} frågor är redo för repetition.</p>
        <button class="primary" @click=${() => ctx.start('Alla', { dueOnly: true })}>
          Repetera nu
        </button>
      </div>
    </section>
    <div class="section-title"><h2>Ämne för ämne</h2></div>
    ${topics.map((t) => {
      const qs = questions.filter((q) => q.topic === t),
        n = qs.filter((q) => ctx.state.stats[q.id]?.ok).length;
      return html`<div class="progress-row">
        <span>${t}</span>
        <div class="mini-track"><span style="width:${(100 * n) / qs.length}%"></span></div>
        <strong>${n} / ${qs.length}</strong>
      </div>`;
    })}
    <section class="section-block">
      <div class="section-title">
        <h2>Min studieplan</h2>
        <label class="date-label"
          >Tentadatum
          <input
            type="date"
            .value=${ctx.state.examDate}
            @change=${(e) => ctx.changeDate(e.target.value)}
        /></label>
      </div>
      <p>
        ${days >= 0 ? `${days} dagar kvar. Dagens tre uppgifter finns i studierummet.` : 'Tentadatumet har passerat. Repetitionen fortsätter; välj ett nytt datum när du vill.'}
      </p>
      <button class="secondary" @click=${() => ctx.navigate('home')}>Visa dagens plan</button>
    </section>
    <section class="section-block">
      <h2>Sparade utkast</h2>
      ${Object.values(ctx.state.drafts)
        .filter((d) => d.session && !d.session.done && !d.session.submittedAt)
        .map(
          (d) =>
            html`<div class="history-row">
              <span>${d.session.name}</span
              ><button class="secondary" @click=${() => ctx.resumeDraft(d)}>Fortsätt</button>
            </div>`,
        )}
    </section>
    <section class="section-block">
      <h2>Senaste passen</h2>
      ${
        ctx.state.history.length
          ? ctx.state.history.slice(0, 20).map(
              (h) =>
                html`<div class="history-row">
                  <span
                    >${h.name}<small
                      >${new Date(h.at).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })}</small
                    ></span
                  ><strong>${h.ok} / ${h.total} rätt</strong>
                </div>`,
            )
          : html`<p class="muted">Ditt första avslutade pass dyker upp här.</p>`
      }
    </section>`;
}
