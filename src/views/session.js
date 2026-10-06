import { html } from 'lit-html';
import { keyed } from 'lit-html/directives/keyed.js';
import { live } from 'lit-html/directives/live.js';
import { questions } from '../data.js';
import { scoreAttempt, getContrastiveFeedback, getLearningTip, previewReview } from '../engine.js';
import { promptSpeech, answerSpeech, japaneseText } from '../speech.js';
import { icon, languageText, speechButton } from './shared.js';
import { questionForSession } from '../particles.js';
import { particleSessionView } from './particles.js';
import { followUpQuestions } from '../follow-up.js';

export function formatInterval(ms) {
  if (ms <= 0) return 'Nu';
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  if (ms < 86400000) return `${Math.round(ms / 3600000)}h`;
  return `${Math.round(ms / 86400000)}d`;
}

export function previewRatingInterval(state, session, questionId, rating, now) {
  return formatInterval(previewReview(state, session, questionId, rating, now).dueAt - now);
}

export const RATING_KAOMOJI = {
  again: '(｡•́︿•̀｡)',
  hard: '(´-﹏-`；)',
  good: '(o^▽^o)',
  easy: '(★ω★)',
};

export const RATING_LABELS = {
  again: 'Igen',
  hard: 'Svårt',
  good: 'Bra',
  easy: 'Lätt',
};

export function formatRatingLabel(rating, theme) {
  const clean = RATING_LABELS[rating] || rating;
  if (theme === 'sakura' && RATING_KAOMOJI[rating]) {
    return `${clean} ${RATING_KAOMOJI[rating]}`;
  }
  return clean;
}

export function sessionView(ctx) {
  const s = ctx.session;
  if (s.done) return resultView(ctx);
  const q = questionForSession(
    questions.find((q) => q.id === s.ids[s.index]),
    s,
  );
  if (!q)
    return html`<h1 tabindex="-1">Frågan finns inte längre.</h1>
      <button @click=${ctx.exit}>Tillbaka</button>`;

  s.startBox ||= {};
  if (s.startBox[q.id] === undefined && typeof s.grades[q.id] !== 'boolean') {
    s.startBox[q.id] = ctx.state.stats[q.id]?.box ?? 0;
  }
  const currentBox = s.startBox[q.id] ?? ctx.state.stats[q.id]?.box ?? 0;
  if (q.type === 'particle-edit')
    return particleSessionView(ctx, q, () => ratingButtonsTemplate(ctx, q, currentBox));
  const value = s.answers[q.id] || '',
    graded = typeof s.grades[q.id] === 'boolean';
  const feedback = (s.mode !== 'exam' && (graded || s.revealed?.[q.id])) || s.review;
  const isIncorrect = feedback && !q.self && s.grades[q.id] === false;
  const contrastive = isIncorrect ? getContrastiveFeedback(q, value) : null;
  const ask = promptSpeech(q),
    answer = feedback ? answerSpeech(q) : '';
  const showSpeech =
    (feedback || (!q.hidePromptSpeech && q.topic !== 'Ord & kanji')) && ask !== answer;
  const path = q.exam
    ? `/material/${q.exam}-${q.exam === 'reading' ? String(q.page).padStart(2, '0') : q.page}.jpg`
    : '';
  return html`<div class="session-top">
      <button class="text-button" @click=${ctx.exit}>${icon('ArrowLeft')} Spara & lämna</button
      ><span
        >${s.mode === 'exam' ? 'Tentaläge' : 'Träningspass'} · ${s.index + 1} /
        ${s.ids.length}</span
      >
    </div>
    <div class="session-track">
      <span style="width:${((s.index + 1) / s.ids.length) * 100}%"></span>
    </div>
    ${keyed(
      q.id,
      html`<section class="question-panel">
        <div class="question-meta">
          <span>${q.topic}</span
          ><span
            >${q.official ? 'Originalfacit · Lesson5' : q.exam ? 'Originalfråga · modellösning' : 'Extra träning'}</span
          >
        </div>
        <h1 class="question-title" tabindex="-1" lang=${q.promptLang || 'sv'}>
          ${languageText(q.prompt)}
        </h1>
        ${showSpeech ? speechButton(ctx, ask, 'Lyssna på frågan') : ''}
        ${
          q.context
            ? html`<details class="context" open>
                <summary>Läs brevet</summary>
                ${speechButton(ctx, japaneseText(q.context), 'Lyssna på brevet')}
                <p lang="ja">${q.context}</p>
              </details>`
            : ''
        }
        ${
          q.exam
            ? html`<details class="original" ?open=${q.image}>
                <summary>Visa originaluppgiften · sida ${q.page}</summary>
                ${ctx.imageErrors.has(path) ? html`<p role="alert">Bilden kunde inte laddas. <a href="/material/${q.exam}.pdf" target="_blank" rel="noopener">Öppna original-PDF:en</a>.</p>` : html`<a href=${path} target="_blank" rel="noopener"><img loading="lazy" src=${path} alt="Originalsida ${q.page}. Öppna bilden för att förstora." @error=${() => ctx.imageError(path)} /></a><small>Tryck på bilden för att förstora.</small>`}
              </details>`
            : ''
        }
        ${
          q.choices && !q.self
            ? html`<div class="choices">
                ${q.choices.map((c) => html`<button class="choice ${value === c ? 'selected' : ''} ${feedback && q.answers?.includes(c) ? 'right' : ''}" lang=${q.choiceLang || 'sv'} aria-pressed=${value === c} aria-disabled=${feedback ? 'true' : 'false'} @click=${() => !feedback && ctx.answer(c)}>${c}</button>`)}
              </div>`
            : html`<label class="answer-label" for="answer">Ditt svar</label
                ><textarea
                  id="answer"
                  rows=${q.self ? 5 : 2}
                  lang=${q.answerLang || 'sv'}
                  .value=${live(value)}
                  ?readonly=${feedback}
                  maxlength="3000"
                  placeholder=${q.answerLang === 'ja' ? 'Skriv med ditt japanska tangentbord…' : 'Skriv ditt svar här…'}
                  autocapitalize="off"
                  spellcheck="false"
                  @input=${(e) => ctx.answer(e.target.value, false)}
                  @compositionstart=${() => ctx.setComposing(true)}
                  @compositionend=${(e) => {
                    ctx.setComposing(false);
                    ctx.answer(e.target.value, false);
                  }}
                ></textarea>`
        }
        ${
          feedback
            ? html`<div class="feedback ${q.self ? 'neutral' : s.grades[q.id] ? 'good' : 'again'}">
                ${
                  ctx.theme === 'sakura' && (!q.self || typeof s.grades[q.id] === 'boolean')
                    ? html`<div
                        class="anime-figure anime-feedback-mascot ${s.grades[q.id] ? 'good' : 'again'}"
                        aria-hidden="true"
                      >
                        <div class="anime-feedback-bubble">
                          ${
                            s.grades[q.id]
                              ? html`<span class="bubble-jp">すごい！完璧〜！💮</span
                                  ><small>Senpai, du är bäst! ✨</small>`
                              : html`<span class="bubble-jp">うわあああ〜！(╥﹏╥)</span
                                  ><small>Kämpa på, senpai! 💕</small>`
                          }
                        </div>
                        <img
                          src="${s.grades[q.id] ? '/anime/cheer.jpg' : '/anime/mascot_cry.jpg'}"
                          alt="${s.grades[q.id] ? 'やった！ Bra jobbat!' : 'うわあああ〜！ Kämpa vidare!'}"
                          loading="lazy"
                        />
                      </div>`
                    : ''
                }
                <h3>
                  ${q.self ? 'Jämför med modellösningen' : s.grades[q.id] ? 'Rätt svar!' : !value.trim() ? 'Inget svar lämnat' : q.choices ? 'Inte riktigt – jämför svaren' : 'Ditt svar matchar inte de sparade svaren'}
                </h3>
                ${!q.self && !contrastive ? html`<p class="correct-answer" lang=${q.answerLang || 'sv'}><strong>Godtagna svar:</strong> ${languageText(q.answers?.join(' / '))}</p>` : ''}
                ${isIncorrect && !q.choices && value.trim() ? html`<p class="feedback-note">Appen jämför med sparade svar och kan missa andra korrekta formuleringar. Jämför innehållet innan du bedömer ditt svar.</p>` : ''}
                ${
                  contrastive
                    ? contrastiveCallout(contrastive, value, q, ctx)
                    : html`<p>${languageText(q.explanation || q.model)}</p>`
                }
                ${speechButton(ctx, answer, q.self ? 'Lyssna på modellsvaret' : 'Lyssna på svaret')}
                ${
                  q.self
                    ? html`<div class="self-checklist">
                        <h4>Kontrollera ditt svar</h4>
                        <p>
                          Det här svaret bedömer du själv. Modellösningen visar ett möjligt svar.
                        </p>
                        <ul>
                          ${q.checklist?.map((item) => html`<li>${languageText(item)}</li>`)}
                        </ul>
                        ${q.guideId ? html`<button type="button" class="text-button" @click=${(e) => ctx.openGuideModal(q.guideId, e.currentTarget)}>${icon('BookOpen')} Öppna snabbguide</button>` : ''}
                      </div>`
                    : isIncorrect
                      ? html`<p class="learning-tip">
                          <strong>Prova själv:</strong> ${languageText(getLearningTip(q))}
                        </p>`
                      : ''
                }
                ${
                  s.mode === 'exam'
                    ? q.self
                      ? html`<p>Stämmer ditt svar med de viktiga punkterna?</p>
                          <div class="self-actions">
                            <button class="secondary" @click=${() => ctx.grade(false, true)}>
                              Behöver öva mer</button
                            ><button class="primary" @click=${() => ctx.grade(true, true)}>
                              Jag kunde detta
                            </button>
                          </div>`
                      : !s.grades[q.id]
                        ? html`<button class="text-button" @click=${() => ctx.grade(true)}>
                            Mitt svar är också korrekt
                          </button>`
                        : ''
                    : html`
                        ${
                          q.self
                            ? html`<p>Stämmer ditt svar med de viktiga punkterna?</p>
                                <div class="self-actions">
                                  <button
                                    class="secondary"
                                    @click=${() => ctx.grade('again', true)}
                                  >
                                    Behöver öva mer</button
                                  ><button class="primary" @click=${() => ctx.grade('good', true)}>
                                    Jag kunde detta
                                  </button>
                                </div>`
                            : !s.grades[q.id]
                              ? html`<button class="text-button" @click=${() => ctx.grade(true)}>
                                  Mitt svar är också korrekt
                                </button>`
                              : ''
                        }
                        ${ratingButtonsTemplate(ctx, q, currentBox)}
                      `
                }
              </div>`
            : ''
        }
        <div class="question-actions">
          ${s.index > 0 ? html`<button class="secondary" @click=${() => ctx.jump(s.index - 1)}>Föregående</button>` : html`<span></span>`}${s.mode === 'exam' && !s.review ? html`<button class="primary" @click=${ctx.next}>${s.index === s.ids.length - 1 ? 'Lämna in tentan' : 'Nästa fråga'} ${icon('ChevronRight')}</button>` : !feedback ? html`<button class="primary" @click=${ctx.check}>${q.self ? 'Visa modellösning' : 'Kontrollera svar'}${ctx.theme === 'sakura' ? html` <span class="kaomoji" aria-hidden="true">✨</span>` : ''} ${icon('Check')}</button>` : !q.self ? html`<button class="primary" @click=${ctx.next}>${s.index === s.ids.length - 1 ? 'Visa resultat' : 'Nästa fråga'}${ctx.theme === 'sakura' ? html` <span class="kaomoji" aria-hidden="true">🌸</span>` : ''} ${icon('ChevronRight')}</button>` : ''}
        </div>
        ${s.mode === 'exam' ? html`<div class="question-jump">${s.ids.map((id, i) => html`<button class="${i === s.index ? 'current' : ''} ${s.answers[id] ? 'answered' : ''}" aria-label="Fråga ${i + 1}" aria-current=${i === s.index ? 'step' : 'false'} @click=${() => ctx.jump(i)}>${i + 1}</button>`)}</div>` : ''}
      </section>`,
    )}`;
}
function ratingButtonsTemplate(ctx, q, currentBox) {
  const isSakura = ctx.theme === 'sakura';
  const ratings = [
    { key: '1', rating: 'again', label: 'Igen', cls: 'rating-again' },
    { key: '2', rating: 'hard', label: 'Svårt', cls: 'rating-hard' },
    { key: '3', rating: 'good', label: 'Bra', cls: 'rating-good' },
    { key: '4', rating: 'easy', label: 'Lätt', cls: 'rating-easy' },
  ];

  return html`<div class="rating-group" role="group" aria-label="Självskattad svårighetsgrad">
    <p class="rating-help">
      Bedöm vad du kunde innan du såg facit: Igen = behöver öva om, Svårt = kunde med möda, Bra =
      kunde, Lätt = kunde direkt. Valet uppdaterar resultatet och nästa repetition.
    </p>
    <div class="rating-header">
      <span class="rating-box-info"
        >Nivå: <strong>Låda ${Math.min(4, currentBox) + 1}</strong> av 5</span
      >
      <span class="rating-shortcuts-hint">Snabbtangenter: 1–4</span>
    </div>
    <div class="rating-buttons">
      ${ratings.map(({ key, rating, label, cls }) => {
        const interval = previewRatingInterval(ctx.state, ctx.session, q.id, rating, ctx.now);
        const kaomoji = RATING_KAOMOJI[rating];
        return html`<button
          type="button"
          class="rating-btn ${cls}"
          data-rating=${rating}
          aria-keyshortcuts=${key}
          aria-label="${label} (${interval}, tangent ${key})"
          @click=${() => ctx.grade(rating, true)}
        >
          <kbd class="rating-key">${key}</kbd>
          <span class="rating-label"
            >${label}${isSakura && kaomoji ? html` <span class="kaomoji" aria-hidden="true">${kaomoji}</span>` : ''}</span
          >
          <span class="rating-interval">${interval}</span>
        </button>`;
      })}
    </div>
  </div>`;
}
function contrastiveCallout(contrastive, userVal, q, ctx) {
  if (!contrastive) return '';
  const cleanUser = (userVal || '').trim();
  const correctText = q.answers?.join(' / ') || '';
  return html`<div
    class="contrastive-box contrastive-callout"
    role="region"
    aria-label="Förstå svaret"
  >
    <div class="contrastive-header">
      <div class="contrastive-comparison">
        <span class="contrastive-chip wrong" title="Ditt svar">
          <small>Ditt val:</small>
          <strong lang=${q.answerLang || 'sv'}>${languageText(cleanUser)}</strong>
        </span>
        <span class="contrastive-vs" aria-hidden="true">vs</span>
        <span class="contrastive-chip correct" title="Rätt svar">
          <small>Godtagna svar:</small>
          <strong lang=${q.answerLang || 'sv'}>${languageText(correctText)}</strong>
        </span>
      </div>
    </div>
    <h4>Så hänger det ihop</h4>
    <p class="contrastive-text">${languageText(contrastive.text)}</p>
    ${
      contrastive.guideId
        ? html`<div class="contrastive-actions">
            <button
              type="button"
              class="contrastive-guide-btn guide-link-btn text-button"
              @click=${(e) => {
                e.preventDefault();
                if (typeof ctx.openGuideModal === 'function') {
                  // Safari does not focus buttons on pointer clicks; retain the actual opener.
                  ctx.openGuideModal(contrastive.guideId, e.currentTarget);
                } else {
                  window.dispatchEvent(
                    new CustomEvent('open-guide-modal', {
                      detail: { guideId: contrastive.guideId },
                      bubbles: true,
                    }),
                  );
                }
              }}
            >
              ${icon('BookOpen')} Öppna snabbguide
            </button>
          </div>`
        : ''
    }
  </div>`;
}
function resultView(ctx) {
  const s = ctx.session,
    result = scoreAttempt(s, questions),
    followUpIds = followUpQuestions(s, questions),
    followUpTopics = [
      ...new Set(followUpIds.map((id) => questions.find((q) => q.id === id).topic)),
    ];
  return html`<section class="result-panel">
    ${
      ctx.theme === 'sakura'
        ? html`<div class="anime-figure anime-result-mascot" aria-hidden="true">
            <div class="anime-result-wrapper">
              <img
                class="result-mascot-img"
                src="/anime/cheer.jpg"
                alt="やった！ Bra jobbat!"
                loading="lazy"
              />
              <img
                class="result-stamp-img"
                src="/anime/stamp_sakura.jpg"
                alt="たいへんよくできました"
                loading="lazy"
              />
              <div class="kawaii-speech-bubble result-bubble">
                <span>先輩、本当にお疲れ様でした〜！💮✨</span>
                <small>Helt fantastiskt kämpat! 💕 ( ๑>ᴗ<๑ )</small>
              </div>
            </div>
          </div>`
        : html`<span class="result-icon">${icon('CircleCheck')}</span>`
    }
    <p class="overline">${s.mode === 'exam' ? 'TENTAN ÄR INLÄMNAD' : 'BRA JOBBAT'}</p>
    <h1 tabindex="-1">${result.pending ? 'Dags att rätta fritexten.' : 'Ett steg framåt.'}</h1>
    <div class="result-number">${result.ok}<span> / ${result.total}</span></div>
    <p>rätt eller självbedömda som rätt</p>
    ${
      s.mode === 'exam' && !s.scoreUnavailable
        ? html`<p>
              ${result.earned} uppskattade poäng av ${result.max}. ${result.pending} svar väntar på
              självbedömning. ${result.unanswered} obesvarade.
            </p>
            <p class="muted">Övningsresultat, inte ett officiellt tentabetyg.</p>`
        : ''
    }
    <div class="result-buttons">
      ${result.pending ? html`<button class="primary" @click=${ctx.reviewPending}>Rätta längre svar</button>` : ''}<button
        class="secondary"
        @click=${() => ctx.review(0)}
      >
        Gå igenom svaren</button
      ><button class="primary" @click=${ctx.exit}>Till studierummet</button>
    </div>
    ${
      followUpIds.length
        ? html`<section class="follow-up" aria-labelledby="follow-up-heading">
            <h2 id="follow-up-heading">Ditt nästa steg</h2>
            <p>
              Öva igen på ${followUpIds.length} ${followUpIds.length === 1 ? 'fråga' : 'frågor'} som
              du behövde hjälp med i det här passet.
            </p>
            <p class="muted">${followUpTopics.join(' · ')}</p>
            ${result.pending ? html`<p>Fler svar väntar på självbedömning. De ingår först om du markerar att du behöver öva mer.</p>` : ''}
            <button class="primary" @click=${ctx.startFollowUp}>
              Starta kort övningspass ${icon('ChevronRight')}
            </button>
            <p class="input-hint">
              Ett nytt pass med tomma svar. Det tidigare resultatet finns kvar.
            </p>
          </section>`
        : ''
    }
    <div class="result-summary">
      ${s.ids.map((id, i) => {
        const q = questionForSession(
          questions.find((q) => q.id === id),
          s,
        );
        return html`<button @click=${() => ctx.review(i)}>
          <span class="result-marker ${s.grades[id] ? 'ok' : ''}"
            >${typeof s.grades[id] !== 'boolean' ? '?' : s.grades[id] ? '✓' : '↻'}</span
          ><span>${languageText(q?.prompt.slice(0, 100))}</span>${icon('ChevronRight')}
        </button>`;
      })}
    </div>
  </section>`;
}
