import './style.css';
import { html, render as renderTemplate } from 'lit-html';
import { keyed } from 'lit-html/directives/keyed.js';
import { questions, exams, examQuestions } from './data.js';
import {
  fresh,
  correct,
  selectPractice,
  mergeProgress,
  ensurePlan,
  dayKey,
  recordReview,
  latestAttempt,
  examErrors,
  importGuest as mergeGuest,
} from './engine.js';
import { createSession, submitSession, updateResult } from './session.js';
import { createFollowUp } from './follow-up.js';
import {
  questionForSession,
  initialParticleState,
  reduceParticle,
  particleSentence,
} from './particles.js';
import { createLocalSaver, readLocal } from './storage.js';
import { createSyncQueue } from './sync.js';
import { login, logout, finishRedirect, watchUser, pull, push } from './cloud.js';
import { ttsSupported, speak, stopSpeech } from './speech.js';
import { homeView } from './views/home.js';
import { examsView } from './views/exams.js';
import { progressView } from './views/progress.js';
import { guideView, guideModalTemplate, resolveGuideId } from './views/guide.js';
import { sessionView } from './views/session.js';
import { multiplayerView, resetMultiplayerView } from './views/multiplayer.js';
import { vocabularyView } from './views/vocabulary.js';
import { particlesView } from './views/particles.js';
import { icon, dateText } from './views/shared.js';
import {
  playAnimeSound,
  isSoundMuted,
  setSoundMuted,
  toggleSoundMuted,
  getSoundVolume,
  setSoundVolume,
} from './audio.js';
import {
  getStudyMascotQuote,
  getSidebarMascotQuote,
  pokeStudyMascot,
  pokeSidebarMascot,
} from './mascot-dialogue.js';
import { initClickParticles, purgeParticles } from './particles-fx.js';
import { getCalendarDayIds } from './calendar-days.js';
const app = document.querySelector('#app');
const KNOWN_VIEWS = [
  'home',
  'vocabulary',
  'particles',
  'exams',
  'multiplayer',
  'progress',
  'guide',
];
let user = null,
  state = fresh(),
  session = null,
  view = 'home',
  status = 'Sparas på den här enheten';
if (typeof window !== 'undefined' && window.location?.pathname) {
  const initPath = window.location.pathname.replace(/^\/+/, '').split('/')[0];
  if (KNOWN_VIEWS.includes(initPath)) {
    view = initPath;
  }
}
let saver,
  sync,
  accountEpoch = 0,
  blocked = false,
  composing = false,
  authBusy = false,
  screenKey = '',
  message = '',
  messageTimer;
const imageErrors = new Set();
const navs = [
  ['home', 'BookOpen', 'Plugga'],
  ['exams', 'GraduationCap', 'Gamla tentor'],
  ['multiplayer', 'Swords', '1v1 Duell'],
  ['progress', 'ChartNoAxesCombined', 'Mina framsteg'],
  ['guide', 'Library', 'Snabbguide'],
];
const studyNavs = [
  ['vocabulary', 'BookOpen', 'Ordförråd (Genki)'],
  ['particles', 'CircleHelp', 'Partikelguide'],
];
const mobileNavs = navs.filter(([id]) => id !== 'multiplayer');
function announce(text) {
  message = text;
  render();
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => {
    message = '';
    render();
  }, 6000);
}
function applyTheme(t) {
  const effective = t === 'sakura' ? 'sakura' : 'classic';
  state.theme = effective;
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = effective;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', effective === 'sakura' ? '#a82e66' : '#183f37');
    }
    const favicon = document.getElementById('favicon-svg');
    if (favicon) {
      favicon.setAttribute('href', effective === 'sakura' ? '/favicon-sakura.svg' : '/favicon.svg');
    }
    if (effective !== 'sakura') {
      purgeParticles();
    }
  }
}
function toggleTheme() {
  const next = state.theme === 'sakura' ? 'classic' : 'sakura';
  setTheme(next);
  if (next === 'sakura') {
    playAnimeSound('tuturu', 'sakura');
  }
}
function toggleMute() {
  const next = toggleSoundMuted();
  if (!next && getSoundVolume() === 0) {
    setSoundVolume(0.5);
  }
  render();
}
function handleVolumeChange(e) {
  const newVol = Number(e.target.value) / 100;
  setSoundVolume(newVol);
  if (newVol > 0 && isSoundMuted()) {
    setSoundMuted(false);
  } else if (newVol === 0 && !isSoundMuted()) {
    setSoundMuted(true);
  }
  render();
}
function setTheme(next) {
  applyTheme(next);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('tentaplugg-theme', state.theme);
    } catch {}
  }
  persist(false);
  render();
}
try {
  const storedTheme =
    typeof localStorage !== 'undefined' ? localStorage.getItem('tentaplugg-theme') : null;
  applyTheme(storedTheme || state.theme || 'classic');
} catch {}
function setupLocal(uid) {
  blocked = false;
  try {
    state = readLocal(localStorage, uid);
  } catch (error) {
    state = fresh();
    blocked = true;
    message = error.message;
  }
  try {
    const savedTheme = localStorage.getItem('tentaplugg-theme');
    if (savedTheme === 'sakura' || savedTheme === 'classic') {
      state.theme = savedTheme;
    } else if (!state.theme) {
      state.theme = 'classic';
    }
  } catch {}
  applyTheme(state.theme);
  const epoch = accountEpoch;
  saver = createLocalSaver({
    storage: localStorage,
    uid,
    getState: () => state,
    onSaved: (payload) => {
      if (epoch === accountEpoch && user && sync) sync.queue(JSON.parse(payload));
    },
    onError: () => {
      status = 'Kunde inte spara lokalt';
      announce('Lagringen är full eller blockerad. Dina ändringar finns kvar i den öppna appen.');
    },
  });
}
function captureSession() {
  if (session) {
    const id = session.mode === 'exam' ? session.exam : 'practice';
    const previous = state.drafts[id];
    if (previous?.session?.attemptId && previous.session.attemptId !== session.attemptId)
      state.drafts[`attempt-${previous.session.attemptId}`] = previous;
    delete state.drafts[`attempt-${session.attemptId}`];
    state.drafts[id] = { at: Date.now(), session };
  }
}
function persist(immediate = false) {
  if (blocked) return;
  captureSession();
  if (immediate) {
    saver.mark();
    saver.flush();
  } else saver.schedule();
}
function flush() {
  if (blocked) return;
  captureSession();
  saver.mark();
  saver.flush();
}
function currentQ() {
  return questionForSession(
    questions.find((q) => q.id === session?.ids[session.index]),
    session,
  );
}
function progress() {
  const stats = Object.values(state.stats);
  return {
    done: stats.length,
    ok: stats.filter((s) => s.ok).length,
    wrong: stats.filter((s) => !s.ok).length,
    due: stats.filter((s) => s.dueAt <= Date.now()).length,
  };
}
function plan() {
  const today = dayKey(Date.now()),
    existing = state.plans[today];
  const result = ensurePlan(state, questions, Date.now());
  if (!existing) persist();
  return result;
}
function setPreferredCount(count) {
  const valid = [5, 10, 20, 'all'];
  if (!valid.includes(count)) return;
  state.preferredCount = count;
  state.preferredCountAt = Date.now();
  persist(true);
  render();
}
function getCtx() {
  return {
    state,
    session,
    user,
    theme: state.theme,
    toggleTheme,
    setTheme,
    now: Date.now(),
    plan: plan(),
    imageErrors,
    progress,
    tts: ttsSupported(),
    setPreferredCount,
    daysMode: state.daysMode || 'first10',
    setDaysMode,
    startDaysPractice,
    start,
    startTask,
    startExam,
    startErrors,
    startFollowUp,
    openAttempt,
    resumeDraft,
    navigate,
    exit,
    jump,
    next,
    check,
    grade,
    answer,
    particleAction,
    review,
    reviewPending,
    changeDate,
    importGuest,
    openGuideModal,
    imageError: (path) => {
      imageErrors.add(path);
      render();
    },
    setComposing: (value) => {
      composing = value;
    },
    speak: speakText,
    account,
    getStudyMascotQuote,
    getSidebarMascotQuote,
    pokeStudyMascot: () => {
      const q = pokeStudyMascot(state.theme);
      render();
      return q;
    },
    pokeSidebarMascot: () => {
      const q = pokeSidebarMascot(state.theme);
      render();
      return q;
    },
    view,
    render: () => render(),
  };
}
function render(focus = false) {
  if (composing) return;
  const key = session ? `${session.attemptId}:${session.done ? 'result' : session.index}` : view;
  if (key !== screenKey) {
    stopSpeech();
    screenKey = key;
  }
  const ctx = getCtx();
  const body = session
    ? sessionView(ctx)
    : view === 'home'
      ? homeView(ctx)
      : view === 'exams'
        ? examsView(ctx)
        : view === 'multiplayer'
          ? multiplayerView(ctx)
          : view === 'progress'
            ? progressView(ctx)
            : view === 'vocabulary'
              ? vocabularyView(ctx)
              : view === 'particles'
                ? particlesView(ctx)
                : guideView(ctx);
  renderTemplate(
    html`<aside class="sidebar">
        <a
          href="#"
          class="brand"
          @click=${(e) => {
            e.preventDefault();
            navigate('home');
          }}
          ><span class="brand-symbol" lang="ja">学</span
          ><span>TentaPlugg<small>JAPANSKA</small></span></a
        >
        <nav>
          ${navs.map(([id, i, label]) => html`<button class="nav-item ${view === id ? 'active' : ''}" @click=${() => navigate(id)}>${icon(i)}<span>${label}</span></button>`)}
        </nav>
        <div class="sidebar-study-links" role="group" aria-label="Referensmaterial">
          ${studyNavs.map(([id, i, label]) => html`<button class="nav-item sub-nav-item ${view === id ? 'active' : ''}" @click=${() => navigate(id)}>${icon(i)}<span>${label}</span></button>`)}
        </div>
        ${
          state.theme === 'sakura'
            ? html`<div
                class="anime-figure sidebar-chibi-card"
                role="button"
                tabindex="0"
                aria-label="Klicka på maskoten för att prata"
                title="Klicka på mig! ✨"
                @click=${() => {
                  pokeSidebarMascot(state.theme);
                  render();
                }}
                @keydown=${(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    pokeSidebarMascot(state.theme);
                    render();
                  }
                }}
              >
                <div class="sidebar-chibi-img-wrap">
                  <img src="/anime/mascot_peek.jpg" alt="Peeking chibi maskot" loading="lazy" />
                </div>
                <div class="sidebar-chibi-bubble" aria-live="polite">
                  <strong>${getSidebarMascotQuote().jp}</strong>
                  <p>${getSidebarMascotQuote().kaomoji} ${getSidebarMascotQuote().sv}</p>
                </div>
              </div>`
            : ''
        }
        <div class="side-bottom">
          <button
            type="button"
            class="theme-toggle sidebar-theme-toggle"
            @click=${toggleTheme}
            title=${state.theme === 'sakura' ? 'Växla till klassiskt tema' : 'Kawaii-ify'}
            aria-label=${state.theme === 'sakura' ? 'Växla till klassiskt tema' : 'Kawaii-ify'}
          >
            <span class="theme-icon" aria-hidden="true"
              >${state.theme === 'sakura' ? '🎓' : '🌸'}</span
            >
            <span class="theme-label">${state.theme === 'sakura' ? 'Klassisk' : 'Kawaii-ify'}</span>
          </button>
          <div class="exam-note">
            ${icon('CalendarDays')}<span
              >Tentadatum<strong>${dateText(state.examDate)}</strong></span
            >
          </div>
          <p>Lite varje dag.<br />En partikel i taget.</p>
          <span lang="ja" class="side-japanese">がんばって！</span>
        </div>
      </aside>
      <div class="shell">
        <header class="topbar">
          <span class="breadcrumb">Japanska för nybörjare <span>/</span> GEMA70</span
          ><span class="mobile-brand"><span lang="ja">学</span><b>TentaPlugg</b></span>
          <div class="topbar-actions">
            ${
              state.theme === 'sakura'
                ? html`<button
                      type="button"
                      class="theme-toggle sound-toggle"
                      @click=${toggleMute}
                      title=${isSoundMuted() || getSoundVolume() === 0 ? 'Slå på anime-ljud' : 'Stäng av anime-ljud'}
                      aria-label=${isSoundMuted() || getSoundVolume() === 0 ? 'Slå på anime-ljud' : 'Stäng av anime-ljud'}
                    >
                      <span class="theme-icon" aria-hidden="true"
                        >${isSoundMuted() || getSoundVolume() === 0 ? '🔇' : '🔊'}</span
                      >
                      <span class="sound-label"
                        >${isSoundMuted() || getSoundVolume() === 0 ? 'Tyst' : 'Ljud'}</span
                      >
                    </button>
                    <div
                      class="sound-slider-wrapper"
                      title="Anime-ljud: ${Math.round(getSoundVolume() * 100)}%"
                    >
                      <span class="sound-slider-icon" aria-hidden="true">🌸</span>
                      <input
                        type="range"
                        class="sound-slider"
                        min="0"
                        max="100"
                        step="5"
                        .value=${String(Math.round(getSoundVolume() * 100))}
                        @input=${handleVolumeChange}
                        aria-label="Volym anime-ljud"
                        title="Volym: ${Math.round(getSoundVolume() * 100)}%"
                      />
                      <span class="sound-slider-val">${Math.round(getSoundVolume() * 100)}%</span>
                    </div>`
                : ''
            }
            <button
              type="button"
              class="theme-toggle topbar-theme-toggle"
              @click=${() => toggleTheme()}
              title=${state.theme === 'sakura' ? 'Växla till klassiskt tema' : 'Kawaii-ify'}
              aria-label=${state.theme === 'sakura' ? 'Växla till klassiskt tema' : 'Kawaii-ify'}
            >
              <span class="theme-icon" aria-hidden="true"
                >${state.theme === 'sakura' ? '🎓' : '🌸'}</span
              >
              <span class="theme-label"
                >${state.theme === 'sakura' ? 'Klassisk' : 'Kawaii-ify'}</span
              >
            </button>
            <button
              class="account ${user?.photoURL ? 'has-avatar' : ''}"
              id="account"
              ?disabled=${authBusy}
              @click=${account}
              title=${user ? `Inloggad som ${user.displayName || user.email || 'användare'} · Klicka för att logga ut` : 'Logga in med Google'}
              aria-label=${user ? `Logga ut (${user.displayName || 'användare'})` : 'Logga in med Google'}
            >
              ${
                user?.photoURL
                  ? html`<img
                      class="account-avatar"
                      src=${user.photoURL}
                      alt=""
                      referrerpolicy="no-referrer"
                    />`
                  : icon(user ? 'LogOut' : 'LogIn')
              }<span>${authBusy ? 'Vänta…' : user ? 'Logga ut' : 'Logga in med Google'}</span>
            </button>
          </div>
        </header>
        <main id="main">${keyed(session?.attemptId || view, body)}</main>
        <footer>
          <span id="cloud-status" .textContent=${status}></span><span>GEMA70 · JAPC11</span>
        </footer>
      </div>
      <nav class="mobile-nav" aria-label="Huvudmeny">
        ${mobileNavs.map(([id, i, l]) => html`<button class=${view === id ? 'active' : ''} @click=${() => navigate(id)}>${icon(i)}<span>${id === 'progress' ? 'Framsteg' : id === 'exams' ? 'Tentor' : l}</span></button>`)}
        <button
          class=${mobileNavs.some(([id]) => id === view) ? '' : 'active'}
          aria-haspopup="dialog"
          @click=${openMobileMenu}
        >
          ${icon('Menu')}<span>Mer</span>
        </button>
      </nav>
      <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">${message}</div>
      ${message ? html`<div id="toast" aria-hidden="true">${message}</div>` : ''}`,
    app,
  );
  if (focus) {
    document.querySelector('main h1')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}
function openMobileMenu(event) {
  const previousFocus = event.currentTarget;
  const dialog = document.createElement('dialog');
  dialog.className = 'mobile-menu';
  dialog.setAttribute('aria-labelledby', 'mobile-menu-title');
  const close = () => {
    dialog.close();
    dialog.remove();
    previousFocus?.focus();
  };
  renderTemplate(
    html` <div class="mobile-menu-heading">
        <h2 id="mobile-menu-title">Alla sidor</h2>
        <button class="secondary" @click=${close} aria-label="Stäng menyn">Stäng</button>
      </div>
      <nav aria-label="Alla sidor">
        ${[...navs, ...studyNavs].map(
          ([id, i, label]) =>
            html` <button
              class="nav-item ${view === id ? 'active' : ''}"
              aria-current=${view === id ? 'page' : 'false'}
              @click=${() => {
                close();
                navigate(id);
              }}
            >
              ${icon(i)}<span>${label}</span>
            </button>`,
        )}
      </nav>`,
    dialog,
  );
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    if (
      event.target === dialog &&
      (event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom)
    )
      close();
  });
  document.body.append(dialog);
  dialog.showModal();
}
function openGuideModal(guideId = null, previousActiveElement = document.activeElement) {
  let dialog = document.querySelector('dialog.guide-modal');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.className = 'guide-modal';
    dialog.setAttribute('aria-labelledby', 'guide-modal-title');
    document.body.append(dialog);
  }

  const closeDialog = () => {
    stopSpeech();
    dialog.close();
    dialog.remove();
    if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
      previousActiveElement.focus();
    }
  };

  renderTemplate(
    guideModalTemplate(getCtx(), {
      guideId,
      onClose: closeDialog,
    }),
    dialog,
  );

  dialog.addEventListener(
    'cancel',
    (e) => {
      e.preventDefault();
      closeDialog();
    },
    { once: true },
  );

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      const isBackdrop =
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom;
      if (isBackdrop) {
        closeDialog();
      }
    }
  });

  dialog.showModal();

  const targetId = resolveGuideId(guideId);
  if (targetId) {
    requestAnimationFrame(() => {
      const el = dialog.querySelector(
        `#${targetId}, [data-guide-id="${targetId}"], #guide-${targetId}`,
      );
      const card = el ? (el.classList.contains('guide') ? el : el.closest('.guide') || el) : null;
      if (card) {
        card.classList.add('guide-highlight');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.setAttribute('tabindex', '-1');
        card.focus({ preventScroll: true });
      }
    });
  }
}
function ask(text, confirmLabel = 'Fortsätt') {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'confirm-dialog';
    const done = (value) => {
      dialog.close();
      dialog.remove();
      resolve(value);
    };
    renderTemplate(
      html`<h2>Innan du fortsätter</h2>
        <p>${text}</p>
        <div>
          <button class="secondary" @click=${() => done(false)}>Gå tillbaka</button
          ><button class="primary" @click=${() => done(true)}>${confirmLabel}</button>
        </div>`,
      dialog,
    );
    document.body.append(dialog);
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      done(false);
    });
    dialog.showModal();
  });
}
function navigate(id, pushState = true) {
  flush();
  if (view === 'multiplayer' && id !== 'multiplayer') {
    resetMultiplayerView(user?.uid);
  }
  session = null;
  view = id;
  if (pushState && typeof window !== 'undefined' && window.history?.pushState) {
    const nextPath = id === 'home' ? '/' : `/${id}`;
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ view: id }, '', nextPath);
    }
  }
  render(true);
}
function setDaysMode(mode) {
  state.daysMode = mode;
  persist(true);
  render();
}
function startDaysPractice(mode = state.daysMode || 'first10') {
  flush();
  state.daysMode = mode;
  const ids = getCalendarDayIds(mode);
  const titles = {
    first10: 'Månadens dagar: Dag 1–10',
    exceptions: 'Månadens dagar: Alla undantag',
    all: 'Månadens dagar: Hela månaden (1–31)',
  };
  session = createSession(ids, titles[mode] || 'Månadens dagar', {
    loopErrors: true,
    daysMode: mode,
    topic: 'Dagar',
    failedLoopIds: [],
  });
  persist(true);
  render(true);
}
async function start(topic, options = {}) {
  if (topic === 'Dagar') {
    startDaysPractice(options.daysMode || state.daysMode || 'first10');
    return;
  }
  const pref = state.preferredCount || 10;
  const chosenCount = options.count !== undefined ? options.count : pref;
  const isAllDue = chosenCount === 'all';
  const dueOnly =
    options.dueOnly !== undefined ? options.dueOnly : options.extra ? false : isAllDue;
  const count = isAllDue ? Infinity : typeof chosenCount === 'number' ? chosenCount : 10;

  let candidateBank = questions;
  if (topic === 'L1-L5') {
    candidateBank = candidateBank.filter((q) => q.set === 'l1l5');
  }
  if (options.wrong)
    candidateBank = candidateBank.filter((q) => state.stats[q.id] && !state.stats[q.id].ok);
  let bank = dueOnly
    ? candidateBank.filter((q) => state.stats[q.id]?.dueAt <= Date.now())
    : candidateBank;
  let ids = selectPractice(bank, state.stats, topic, count, Date.now(), options);
  if (!ids.length) {
    if (
      !options.extra &&
      !options.wrong &&
      (await ask(
        'Dagens repetition är klar för det här urvalet. Vill du träna extra?',
        'Träna extra',
      ))
    )
      ids = selectPractice(
        candidateBank,
        state.stats,
        topic,
        typeof chosenCount === 'number' ? chosenCount : 10,
        Date.now(),
        { extra: true },
      );
    else {
      announce('Inga frågor väntar på repetition i det här urvalet.');
      return;
    }
  }
  if (!ids.length) {
    announce('Inga frågor att öva ännu.');
    return;
  }
  flush();
  session = createSession(
    ids,
    options.wrong
      ? 'Repetition av misstag'
      : topic === 'Alla'
        ? 'Blandad träning'
        : topic === 'L1-L5'
          ? 'L1–L5 Repetition (Hayashi)'
          : topic,
  );
  persist(true);
  render(true);
}
function startTask(task) {
  flush();
  const p = plan(),
    draft = state.drafts.practice?.session;
  session =
    draft?.taskId === task.id && !draft.done
      ? structuredClone(draft)
      : createSession(task.ids, task.name, { taskId: task.id, planDay: p.day });
  persist(true);
  render(true);
}
function startExam(id) {
  flush();
  const e = exams.find((e) => e.id === id),
    draft = state.drafts[id]?.session;
  session =
    draft && !draft.done
      ? structuredClone(draft)
      : createSession(
          examQuestions.filter((q) => q.exam === id).map((q) => q.id),
          `${e.title} · ${e.subtitle}`,
          { mode: 'exam', exam: id },
        );
  session.attemptId ||= crypto.randomUUID();
  session.revealed ||= {};
  view = 'exams';
  persist(true);
  render(true);
}
function startErrors(exam) {
  const last = latestAttempt(state, exam),
    ids = examErrors(last);
  if (!ids.length) {
    announce('Inga fel att repetera från senaste inlämningen.');
    return;
  }
  flush();
  session = createSession(ids, `Felträning · ${exams.find((e) => e.id === exam).title}`, {
    sourceAttemptId: last.attemptId,
  });
  persist(true);
  render(true);
}
function startFollowUp() {
  if (!session?.done) return;
  const followUp = createFollowUp(session, questions);
  if (!followUp) return;
  flush();
  session = followUp;
  persist(true);
  render(true);
}
function openAttempt(attempt) {
  flush();
  session = structuredClone(attempt);
  session.done = true;
  render(true);
}
function resumeDraft(draft) {
  flush();
  session = structuredClone(draft.session);
  session.revealed ||= {};
  persist(true);
  render(true);
}
function exit() {
  flush();
  resetMultiplayerView(user?.uid);
  session = null;
  view = 'home';
  render(true);
}
function answer(value, draw = true) {
  if (!session) return;
  session.answers[currentQ().id] = value;
  persist();
  if (draw) render();
}
function check() {
  if (composing) return;
  const q = currentQ();
  if (q.type === 'particle-edit') return;
  if (!session.answers[q.id]?.trim()) {
    announce('Skriv eller välj ett svar först.');
    return;
  }
  if (q.self) {
    session.revealed ||= {};
    session.revealed[q.id] = true;
    persist(true);
    announce('Modellösningen visas. Jämför och bedöm ditt svar.');
  } else grade(correct(q, session.answers[q.id]));
}
function grade(okOrRating, advance = false) {
  const q = currentQ();
  if (q.type === 'particle-edit' && session.particles?.[q.id]?.stage !== 'done') return;
  recordReview(state, session, q.id, okOrRating, Date.now());
  updateResult(state, session, questions, Date.now());
  persist(true);
  const isOk = typeof okOrRating === 'boolean' ? okOrRating : okOrRating !== 'again';
  if (session.loopErrors) {
    session.failedLoopIds ||= [];
    if (!isOk) {
      if (!session.failedLoopIds.includes(q.id)) {
        session.failedLoopIds.push(q.id);
      }
    } else {
      session.failedLoopIds = session.failedLoopIds.filter((id) => id !== q.id);
    }
  }
  if (advance) next();
  else {
    if (isOk) {
      playAnimeSound('wow', state.theme);
    } else {
      playAnimeSound('nani', state.theme);
    }
    announce(
      q.type === 'particle-edit'
        ? 'Båda stegen är rättade. Resultatet visas.'
        : isOk
          ? 'Rätt svar.'
          : session.loopErrors
            ? 'Inte helt rätt. Dagen återkommer i slutet av passet!'
            : q.choices
              ? 'Inte riktigt. Förklaringen visas.'
              : 'Ditt svar matchar inte de sparade svaren. Jämför med förklaringen.',
    );
  }
}
function particleAction(action) {
  const q = currentQ();
  if (q?.type !== 'particle-edit') return;
  const previous = session.particles?.[q.id] || initialParticleState(q);
  const updated = reduceParticle(q, previous, action);
  if (updated === previous) return;
  stopSpeech();
  session.particles ||= {};
  session.particles[q.id] = updated;
  if (updated.stage === 'done') {
    session.answers[q.id] = particleSentence(updated);
    grade(updated.marking.ok && updated.correctionOk);
  } else {
    persist(true);
    render();
  }
  if (updated.stage !== previous.stage) {
    document.querySelector('.particle-panel h1')?.focus();
  } else if (updated.editor?.mode.endsWith('-position')) {
    document.querySelector('.particle-position')?.focus();
  } else if (updated.editor) {
    document.querySelector('.particle-editor button')?.focus();
  } else if (previous.editor) {
    document.querySelector('.particle-tools button')?.focus();
  }
}
function jump(index) {
  flush();
  session.index = index;
  persist(true);
  render(true);
}
async function next() {
  if (session.reviewSelf) {
    const index = session.ids.findIndex(
      (id) =>
        questionForSession(
          questions.find((q) => q.id === id),
          session,
        )?.self && typeof session.grades[id] !== 'boolean',
    );
    if (index >= 0) {
      jump(index);
      return;
    }
  } else if (session.index < session.ids.length - 1) {
    jump(session.index + 1);
    return;
  }
  if (session.loopErrors && session.failedLoopIds?.length > 0) {
    const toRepeat = [...session.failedLoopIds];
    session.failedLoopIds = [];
    for (const id of toRepeat) {
      delete session.answers[id];
      delete session.grades[id];
      if (session.revealed) delete session.revealed[id];
      session.ids.push(id);
    }
    announce(
      `Repetition: ${toRepeat.length} dag${toRepeat.length > 1 ? 'ar' : ''} att prova igen!`,
    );
    jump(session.index + 1);
    return;
  }
  if (session.mode === 'exam' && !session.submittedAt) {
    const missing = session.ids.filter((id) => !session.answers[id]?.trim()).length;
    if (
      missing &&
      !(await ask(`${missing} frågor saknar svar. Vill du ändå lämna in?`, 'Lämna in'))
    )
      return;
  }
  submitSession(state, session, questions, Date.now());
  persist(true);
  playAnimeSound('tuturu', state.theme);
  render(true);
}
function review(index, selfOnly = false) {
  session.done = false;
  session.review = true;
  session.reviewSelf = selfOnly;
  jump(index);
}
function reviewPending() {
  const index = session.ids.findIndex(
    (id) =>
      questionForSession(
        questions.find((q) => q.id === id),
        session,
      )?.self && typeof session.grades[id] !== 'boolean',
  );
  if (index >= 0) review(index, true);
}
function changeDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  state.examDate = date;
  state.settingsAt = Date.now();
  persist(true);
  render();
}
function speakText(text, button) {
  if (button.classList.contains('speaking')) {
    stopSpeech();
    button.classList.remove('speaking');
    return;
  }
  document.querySelectorAll('.speaking').forEach((el) => el.classList.remove('speaking'));
  button.classList.add('speaking');
  if (speak(text, { onend: () => button.classList.remove('speaking') }) === 'no-voice')
    announce('Ingen japansk röst hittades. Lägg till japanska i enhetens talinställningar.');
}
async function account() {
  if (authBusy) return;
  flush();
  authBusy = true;
  render();
  try {
    if (user) {
      await resetMultiplayerView(user.uid);
      await sync?.flush();
      await logout();
    } else await login(flush);
  } catch (error) {
    announce(
      error.code === 'auth/popup-closed-by-user'
        ? 'Inloggningen avbröts. Du kan fortsätta som gäst.'
        : 'Inloggningen gick inte att slutföra. Försök igen.',
    );
  } finally {
    authBusy = false;
    render();
  }
}
async function importGuest() {
  if (!user) return;
  const uid = user.uid;
  let guest;
  try {
    guest = readLocal(localStorage, null);
  } catch (error) {
    announce(error.message);
    return;
  }
  const count = Object.keys(guest.stats).length,
    drafts = Object.values(guest.drafts).filter((d) => d.session && !d.session.done).length;
  if (!count && !drafts && !guest.history.length) {
    announce('Det finns inga gästresultat att importera.');
    return;
  }
  if (
    !(await ask(
      `Importera ${count} övade frågor, ${guest.history.length} pass och ${drafts} utkast till ${user.email || user.displayName}? Kontots tentadatum behålls och gästoriginalet ligger kvar.`,
      'Importera',
    ))
  )
    return;
  if (user?.uid !== uid) return;
  state = mergeGuest(state, guest);
  persist(true);
  render();
  announce('Gästdata har importerats utan dubbletter.');
}
setupLocal(null);
render();
watchUser(async (nextUser) => {
  if ((user?.uid || null) === (nextUser?.uid || null)) return;
  resetMultiplayerView();
  flush();
  saver.dispose();
  sync?.dispose();
  accountEpoch++;
  const epoch = accountEpoch;
  user = nextUser;
  session = null;
  setupLocal(user?.uid);
  view = 'home';
  if (!user) {
    sync = null;
    status = 'Sparas på den här enheten';
    render(true);
    return;
  }
  const uid = user.uid;
  sync = createSyncQueue({
    uid,
    push,
    onStatus: (value) => {
      if (epoch === accountEpoch) {
        status = value;
        const el = document.querySelector('#cloud-status');
        if (el) el.textContent = value;
      }
    },
    onMerged: (remote) => {
      if (epoch === accountEpoch) {
        state = mergeProgress(state, remote);
        try {
          localStorage.setItem(`tentaplugg-v1-${uid}`, JSON.stringify(state));
        } catch {
          status = 'Kunde inte spara lokalt';
        }
      }
    },
  });
  status = 'Hämtar dina framsteg…';
  render(true);
  try {
    const remote = await pull(uid);
    if (epoch !== accountEpoch) return;
    if (remote) state = mergeProgress(state, remote);
    status = 'Sparat i ditt konto';
  } catch {
    if (epoch !== accountEpoch) return;
    status = 'Lokalt sparat · väntar på synkning';
  }
  if (epoch !== accountEpoch) return;
  persist(true);
  render();
});
finishRedirect().catch(() =>
  announce('Inloggningen kunde inte slutföras efter återkomsten. Dina lokala svar finns kvar.'),
);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flush();
  else if (!session) render();
});
window.addEventListener('pagehide', flush);
window.addEventListener('online', () => {
  if (user) {
    flush();
    sync?.flush();
  }
});
if (typeof window !== 'undefined') {
  initClickParticles(() => state.theme);
  window.openGuideModal = openGuideModal;
  window.addEventListener('open-guide-modal', (e) => {
    openGuideModal(e.detail?.guideId);
  });
  window.addEventListener('popstate', () => {
    const path = window.location.pathname.replace(/^\/+/, '').split('/')[0] || 'home';
    const targetView = KNOWN_VIEWS.includes(path) ? path : 'home';
    navigate(targetView, false);
  });
  window.addEventListener('keydown', (e) => {
    if (!session || session.done || session.mode === 'exam') return;
    if (composing || e.isComposing) return;

    const active = document.activeElement;
    const tag = active?.tagName;
    const isEditable = (tag === 'INPUT' || tag === 'TEXTAREA') && !active.readOnly;
    if (isEditable) return;

    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.querySelector('dialog[open]')) return;

    const q = currentQ();
    if (!q) return;

    const graded = typeof session.grades[q.id] === 'boolean';
    const feedback =
      (session.mode !== 'exam' && (graded || session.revealed?.[q.id])) || session.review;
    if (!feedback) return;

    const keyMap = {
      1: 'again',
      2: 'hard',
      3: 'good',
      4: 'easy',
    };

    if (keyMap[e.key]) {
      e.preventDefault();
      grade(keyMap[e.key], true);
    }
  });
}
