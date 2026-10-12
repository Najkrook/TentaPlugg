import { html } from 'lit-html';
import { questions, topics } from '../data.js';
import { daysUntil } from '../engine.js';
import { icon, dateText } from './shared.js';
import { playAnimeSound } from '../audio.js';
import { getStudyMascotQuote, pokeStudyMascot } from '../mascot-dialogue.js';
import { calendarDayQuestions } from '../calendar-days.js';
export function homeView(ctx) {
  const { state, now, plan } = ctx,
    p = ctx.progress(),
    days = daysUntil(state.examDate, now),
    currentPref = state.preferredCount || 10,
    daysMode = ctx.daysMode || state.daysMode || 'first10',
    masteredDays = calendarDayQuestions.filter((q) => state.stats[q.id]?.ok).length,
    studyQuote = ctx.getStudyMascotQuote ? ctx.getStudyMascotQuote() : getStudyMascotQuote(),
    onPokeStudy = () => {
      if (ctx.pokeStudyMascot) {
        ctx.pokeStudyMascot();
      } else {
        pokeStudyMascot(ctx.theme);
        ctx.render?.();
      }
    };
  return html`<section class="page-heading">
      <div>
        <p class="overline">DITT STUDIERUM</p>
        <h1 tabindex="-1">Lite närmare <span lang="ja">日本語.</span></h1>
        <p>Träna på det som kommer på tentan.</p>
      </div>
      ${
        days >= 0
          ? html`<div class="countdown">
              <strong>${days}</strong
              ><span>dagar till tentan<small>${dateText(state.examDate)}</small></span>
            </div>`
          : ''
      }
    </section>
    <section class="vocabulary-practice-panel">
      <p class="overline">170 GLOSOR · LEKTION 3–5</p>
      <h2>Träna glosor med bara kana</h2>
      <p>Tio frågor åt gången. Svenska, hiragana och katakana.</p>
      <div class="vocabulary-actions">
        <button class="primary" @click=${() => ctx.startVocabulary()}>Träna glosor</button>
        <button class="secondary" @click=${() => ctx.navigate('vocabulary')}>
          Välj lektion och se framsteg
        </button>
      </div>
    </section>
    <section class="focus-panel">
      <div class="focus-copy">
        <span class="focus-label">${icon('Target')} Dagens fokus</span>
        <h2>Små tecken.<br />Stor skillnad.</h2>
        <p>
          <span lang="ja">は, が, に</span> eller <span lang="ja">で</span>? Ge partiklarna tio
          frågor.<br class="desktop" />Vi plockar upp det du behöver repetera.
        </p>
        <div class="session-picker">
          <span class="session-picker-label" id="session-size-label">Passets längd:</span>
          <div
            class="pill-group"
            role="radiogroup"
            aria-labelledby="session-size-label"
            @keydown=${(e) => {
              const options = [5, 10, 20];
              if (p.due > 0) options.push('all');
              const idx = options.indexOf(currentPref);
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                const next = options[(idx + 1) % options.length];
                ctx.setPreferredCount?.(next);
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = options[(idx - 1 + options.length) % options.length];
                ctx.setPreferredCount?.(prev);
              }
            }}
          >
            <button
              type="button"
              role="radio"
              aria-checked=${currentPref === 5}
              class="pill-btn ${currentPref === 5 ? 'active' : ''}"
              @click=${() => ctx.setPreferredCount?.(5)}
            >
              5
            </button>
            <button
              type="button"
              role="radio"
              aria-checked=${currentPref === 10}
              class="pill-btn ${currentPref === 10 ? 'active' : ''}"
              @click=${() => ctx.setPreferredCount?.(10)}
            >
              10
            </button>
            <button
              type="button"
              role="radio"
              aria-checked=${currentPref === 20}
              class="pill-btn ${currentPref === 20 ? 'active' : ''}"
              @click=${() => ctx.setPreferredCount?.(20)}
            >
              20
            </button>
            <button
              type="button"
              role="radio"
              aria-checked=${currentPref === 'all'}
              aria-disabled=${p.due === 0 ? 'true' : 'false'}
              ?disabled=${p.due === 0}
              class="pill-btn ${currentPref === 'all' ? 'active' : ''} ${p.due === 0 ? 'disabled' : ''}"
              @click=${() => p.due > 0 && ctx.setPreferredCount?.('all')}
              title=${p.due === 0 ? 'Inga frågor att repetera just nu' : `${p.due} frågor väntar på repetition`}
            >
              Alla förfallna (${p.due})
            </button>
          </div>
        </div>
        <button class="primary" @click=${() => ctx.start('Partiklar')}>
          Träna partiklar ${icon('ChevronRight')}</button
        ><span class="session-hint"
          >${currentPref === 5 ? '5 frågor · cirka 3 minuter' : currentPref === 20 ? '20 frågor · cirka 10 minuter' : currentPref === 'all' ? `${p.due} frågor · repetera allt förfallet` : '10 frågor · cirka 5 minuter'}</span
        >
      </div>
      ${
        ctx.theme === 'sakura'
          ? html`<div class="anime-figure anime-study-panel">
              <div class="anime-mascot-wrapper">
                <div
                  class="kawaii-speech-bubble focus-bubble"
                  aria-live="polite"
                  style="cursor: pointer;"
                  title="Klicka på mig! ✨"
                  @click=${onPokeStudy}
                >
                  <span
                    >${studyQuote.jp}
                    <span class="kaomoji" aria-hidden="true">${studyQuote.kaomoji}</span></span
                  >
                  <small>${studyQuote.sv}</small>
                </div>
                <button
                  type="button"
                  class="anime-study-avatar-btn"
                  title="Klicka på mig! ✨"
                  aria-label="Klicka på anime-maskoten för att prata"
                  @click=${onPokeStudy}
                >
                  <img
                    src="/anime/study.jpg"
                    alt="Sakura-maskot som studerar japanska"
                    loading="lazy"
                  />
                  <span class="anime-badge-stamp">💮 合格祈願</span>
                </button>
              </div>
            </div>`
          : html`<div class="particle-art" aria-hidden="true" lang="ja">
              <div class="glyph small">を</div>
              <div class="glyph mid">に</div>
              <div class="glyph main">は</div>
              <div class="glyph low">で</div>
              <div class="glyph last">が</div>
              <span>ひとつずつ、一歩ずつ。</span>
            </div>`
      }
    </section>
    <div class="stats-strip">
      <div>
        ${icon('CircleCheck')}<span><strong>${p.done}</strong> frågor övade</span>
      </div>
      <div>
        ${icon('Target')}<span><strong>${p.due}</strong> att repetera nu</span>
      </div>
      <div>
        ${icon('RotateCcw')}<span><strong>${p.wrong}</strong> senaste fel</span>
      </div>
    </div>
    <section class="section-block">
      <div class="section-title">
        <h2>Din plan idag</h2>
        <span class="muted">15–20 minuter</span>
      </div>
      <div class="daily-plan">
        ${plan.tasks.map(
          (task, i) =>
            html`<button
              class="plan-task ${plan.completed[task.id] ? 'complete' : ''}"
              @click=${() => ctx.startTask(task)}
            >
              <span class="plan-number">${plan.completed[task.id] ? '✓' : i + 1}</span
              ><span
                ><strong>${task.name}</strong
                ><small
                  >${plan.completed[task.id] ? 'Avklarat · träna igen' : `${task.ids.length} frågor`}</small
                ></span
              >${icon('ChevronRight')}
            </button>`,
        )}
      </div>
      <p class="input-hint">
        ${days >= 0 && days <= 3 ? 'Sista dagarna: extra fokus på svåra områden och tidigare tentafel.' : 'Repetition först, sedan nya frågor och en bit av en gammal tenta.'}
      </p>
    </section>
    <section class="section-block calendar-practice-section">
      <div class="calendar-panel">
        <div class="calendar-panel-header">
          <div class="calendar-panel-title">
            <span class="calendar-mini-badge" aria-hidden="true">📅</span>
            <div>
              <h2>Öva på månadens dagar</h2>
              <p>Månadens datum 1–31 har unika läsningar. Träna in ついたち, ようか och はつか.</p>
            </div>
          </div>
          <div class="calendar-panel-stats">
            <div class="calendar-stat-row">
              <span class="calendar-stat-number">${masteredDays} / 31</span>
              <small>bemästrade</small>
            </div>
            <div class="mini-track"><span style="width:${(masteredDays / 31) * 100}%"></span></div>
          </div>
        </div>
        <div class="calendar-panel-controls">
          <div class="calendar-mode-picker">
            <span class="session-picker-label calendar-mode-label" id="calendar-mode-label"
              >Välj omfång:</span
            >
            <div
              class="pill-group calendar-pill-group"
              role="radiogroup"
              aria-labelledby="calendar-mode-label"
              @keydown=${(e) => {
                const modes = ['first10', 'exceptions', 'all'];
                const idx = modes.indexOf(daysMode);
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  ctx.setDaysMode?.(modes[(idx + 1) % modes.length]);
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  ctx.setDaysMode?.(modes[(idx - 1 + modes.length) % modes.length]);
                }
              }}
            >
              <button
                type="button"
                role="radio"
                aria-checked=${daysMode === 'first10'}
                class="pill-btn ${daysMode === 'first10' ? 'active' : ''}"
                @click=${() => ctx.setDaysMode?.('first10')}
              >
                1–10 (Grunderna)
              </button>
              <button
                type="button"
                role="radio"
                aria-checked=${daysMode === 'exceptions'}
                class="pill-btn ${daysMode === 'exceptions' ? 'active' : ''}"
                @click=${() => ctx.setDaysMode?.('exceptions')}
              >
                Undantag (13 st)
              </button>
              <button
                type="button"
                role="radio"
                aria-checked=${daysMode === 'all'}
                class="pill-btn ${daysMode === 'all' ? 'active' : ''}"
                @click=${() => ctx.setDaysMode?.('all')}
              >
                Hela månaden (1–31)
              </button>
            </div>
          </div>
          <button class="primary start-days-btn" @click=${() => ctx.startDaysPractice?.(daysMode)}>
            Starta övning ${icon('ChevronRight')}
          </button>
        </div>
      </div>
    </section>
    <section class="section-block">
      <div class="section-title">
        <h2>Vad vill du öva på?</h2>
        <button class="text-button" @click=${() => ctx.start('Alla')}>
          Blanda alla ämnen ${icon('ChevronRight')}
        </button>
      </div>
      <div class="topic-grid">
        ${topics.map((t, i) => {
          const qs = questions.filter((q) => q.topic === t),
            n = qs.filter((q) => state.stats[q.id]?.ok).length;
          return html`<button
            class="topic-card ${t === 'Dagar' ? 'calendar-topic-card' : ''}"
            @click=${() => ctx.start(t)}
          >
            <span class="topic-letter t${i % 5}" lang="ja"
              >${['は', 'い', '字', '文', '読', '音', '順', 'あ', '日'][i] || '日'}</span
            >
            <div>
              <h3>${t}</h3>
              <p>${qs.length} frågor · ${t === 'Kana' ? 'frivillig drill' : `${n} rätt senast`}</p>
              <div class="mini-track"><span style="width:${(n / qs.length) * 100}%"></span></div>
            </div>
            ${icon('ChevronRight')}
          </button>`;
        })}<button
          class="topic-card l1l5-card"
          data-topic-card="l1l5"
          @click=${() => ctx.start('L1-L5')}
        >
          <span class="topic-letter special" lang="ja">復</span>
          <div>
            <h3>L1–L5 Repetition</h3>
            <p>
              ${questions.filter((q) => q.set === 'l1l5').length} frågor ·
              ${questions.filter((q) => q.set === 'l1l5' && state.stats[q.id]?.ok).length} rätt
              senast
            </p>
            <div class="mini-track">
              <span
                style="width:${(questions.filter((q) => q.set === 'l1l5' && state.stats[q.id]?.ok).length / Math.max(1, questions.filter((q) => q.set === 'l1l5').length)) * 100}%"
              ></span>
            </div>
          </div>
          ${icon('ChevronRight')}</button
        ><button
          class="topic-card repeat"
          @click=${() => ctx.start('Alla', { wrong: true, extra: true })}
        >
          ${icon('RotateCcw')}
          <div>
            <h3>Öva på dina misstag</h3>
            <p>${p.wrong ? 'Dags för ett nytt försök' : 'Dina svåra frågor samlas här'}</p>
          </div>
          ${icon('ChevronRight')}
        </button>
      </div>
    </section>
    <section class="exam-banner">
      <div class="exam-icon">${icon('GraduationCap')}</div>
      <div>
        <h2>Testa dig på en riktig tenta</h2>
        <p>Tre gamla tentor. Svara i din takt och rätta efteråt.</p>
      </div>
      <button class="secondary" @click=${() => ctx.navigate('exams')}>
        Välj tenta ${icon('ChevronRight')}
      </button>
    </section>`;
}
