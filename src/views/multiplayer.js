import { html } from 'lit-html';
import { icon, languageText } from './shared.js';
import { playAnimeSound } from '../audio.js';
import {
  createLobby,
  joinLobby,
  leaveLobby,
  startMatch,
  submitAnswer,
  advanceRoundIfDue,
  sendHeartbeat,
  subscribeToLobby,
  subscribeToOpenLobbies,
  subscribeToLeaderboard,
  DEFAULT_ELO,
  ROUND_TIME_MS,
  HEARTBEAT_TTL_MS,
} from '../multiplayer.js';

let activeLobbyId = null;
let currentLobbyData = null;
let openLobbiesList = [];
let leaderboardList = [];
let lobbyUnsub = null;
let openLobbiesUnsub = null;
let leaderboardUnsub = null;
let timerInterval = null;
let heartbeatInterval = null;
let selectedCategory = 'particles';
let joinCodeInput = '';
let activeTab = 'lobbies'; // 'lobbies' | 'leaderboard'
let hasCelebrated = false;
let feedbackMessage = '';
let activeUserUid = null;
let unloadRegistered = false;
let lobbyBusy = false;
let viewEpoch = 0;

export function resetMultiplayerView(uid = null) {
  const leaving = activeLobbyId && uid ? leaveLobby(activeLobbyId, uid) : Promise.resolve();
  viewEpoch++;
  if (lobbyUnsub) {
    lobbyUnsub();
    lobbyUnsub = null;
  }
  if (openLobbiesUnsub) {
    openLobbiesUnsub();
    openLobbiesUnsub = null;
  }
  if (leaderboardUnsub) {
    leaderboardUnsub();
    leaderboardUnsub = null;
  }
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  activeLobbyId = null;
  currentLobbyData = null;
  activeUserUid = null;
  lobbyBusy = false;
  hasCelebrated = false;
  feedbackMessage = '';
  return leaving;
}

function watchLobby(ctx, code) {
  lobbyUnsub?.();
  lobbyUnsub = subscribeToLobby(
    code,
    (data) => {
      if (!data) {
        resetMultiplayerView();
        feedbackMessage = 'Lobbyn har stängts.';
      } else {
        currentLobbyData = data;
      }
      ctx.render();
    },
    (error) => {
      feedbackMessage = error.message || 'Kunde inte hämta matchen';
      ctx.render();
    },
  );
}

export function multiplayerView(ctx) {
  const { user } = ctx;
  activeUserUid = user?.uid || null;

  // Initialize listeners if not yet active
  if (user && !openLobbiesUnsub) {
    openLobbiesUnsub = subscribeToOpenLobbies(
      (lobbies) => {
        openLobbiesList = lobbies;
        ctx.render?.();
      },
      (error) => {
        feedbackMessage = error.message || 'Kunde inte hämta lobbys';
        ctx.render?.();
      },
    );
  }
  if (!leaderboardUnsub) {
    leaderboardUnsub = subscribeToLeaderboard((list) => {
      leaderboardList = list;
      ctx.render?.();
    });
  }

  // Timer loop for arena round checks & timeouts
  if (activeLobbyId && !timerInterval) {
    let advancing = false;
    timerInterval = setInterval(async () => {
      const game = currentLobbyData?.game;
      const now = Date.now();
      if (
        currentLobbyData?.status === 'waiting' &&
        currentLobbyData.host.uid !== activeUserUid &&
        now - (currentLobbyData.heartbeat || currentLobbyData.createdAt || 0) >= HEARTBEAT_TTL_MS
      ) {
        resetMultiplayerView(activeUserUid);
        feedbackMessage = 'Värden är inte längre ansluten. Välj en annan lobby.';
        ctx.render?.();
        return;
      }
      if (!game || game.status === 'finished') return;
      const due =
        (game.status === 'playing' && now > game.roundStartTime + ROUND_TIME_MS) ||
        (game.status === 'round_end' && now >= game.nextRoundAt);
      if (activeLobbyId && due && !advancing) {
        advancing = true;
        const epoch = viewEpoch;
        try {
          await advanceRoundIfDue(activeLobbyId);
        } catch (error) {
          if (epoch === viewEpoch)
            feedbackMessage = error.message || 'Kunde inte uppdatera matchen';
        } finally {
          advancing = false;
        }
      }
      ctx.render?.();
    }, 500);
  }

  // Heartbeat loop for keeping waiting lobby alive
  if (
    activeLobbyId &&
    currentLobbyData?.status === 'waiting' &&
    currentLobbyData.host.uid === activeUserUid &&
    !heartbeatInterval
  ) {
    heartbeatInterval = setInterval(() => {
      if (activeLobbyId && currentLobbyData?.status === 'waiting') {
        sendHeartbeat(activeLobbyId, activeUserUid);
      }
    }, 10000);
  } else if ((!activeLobbyId || currentLobbyData?.status !== 'waiting') && heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  // Register page unload cleanup
  if (typeof window !== 'undefined' && !unloadRegistered) {
    unloadRegistered = true;
    window.addEventListener('beforeunload', () => {
      if (activeLobbyId && activeUserUid) {
        leaveLobby(activeLobbyId, activeUserUid);
      }
    });
  }

  if (!user) {
    return unauthenticatedView(ctx);
  }

  if (!activeLobbyId || !currentLobbyData) {
    return lobbyBrowserView(ctx);
  }

  if (currentLobbyData.status === 'waiting') {
    return waitingRoomView(ctx);
  }

  if (
    currentLobbyData.status === 'in_progress' ||
    currentLobbyData.game?.status === 'playing' ||
    currentLobbyData.game?.status === 'round_end'
  ) {
    return arenaView(ctx);
  }

  if (currentLobbyData.status === 'finished' || currentLobbyData.game?.status === 'finished') {
    return matchResultView(ctx);
  }

  return lobbyBrowserView(ctx);
}

/* =========================================================================
   1. Unauthenticated Guest View
   ========================================================================= */
function unauthenticatedView(ctx) {
  return html`
    <div class="multiplayer-container">
      <section class="page-heading">
        <div>
          <p class="overline">MULTILÄGE · 1V1 RANKING</p>
          <h1 tabindex="-1">Utmana kursare i realtid.</h1>
          <p>Möt andra studenter i snabba 10-frågors dueller med officiellt ELO-betyg.</p>
        </div>
      </section>

      <div class="card auth-prompt-card">
        <div class="auth-prompt-content">
          <div class="auth-prompt-icon">${icon('Swords')}</div>
          <h2>Logga in för att tävla</h2>
          <p>
            1v1-läget och ELO-systemet kräver ett Google-konto för att spara din ranking och
            registrera vinster på topplistan.
          </p>
          <button class="primary auth-login-btn" @click=${ctx.account}>
            ${icon('LogIn')} Logga in med Google
          </button>
        </div>
      </div>

      <section class="leaderboard-preview-section">
        <div class="section-header">
          <h2>${icon('Trophy')} Topplista (Top 10)</h2>
          <p>Se hur de bästa studenterna rankar i studierummet.</p>
        </div>
        ${renderLeaderboardTable(leaderboardList.slice(0, 10), null)}
      </section>
    </div>
  `;
}

/* =========================================================================
   2. Lobby Browser & Leaderboard View
   ========================================================================= */
function lobbyBrowserView(ctx) {
  const { user } = ctx;
  const myProfile = leaderboardList.find((p) => p.uid === user.uid);
  const myElo = myProfile?.elo || DEFAULT_ELO;

  return html`
    <div class="multiplayer-container">
      <section class="page-heading">
        <div>
          <p class="overline">DUEL ARENA · 1V1</p>
          <h1 tabindex="-1">1v1 Duell</h1>
          <p>Snabbaste korrekta svar ger +1 poäng. Fel svar ger -1 poäng. 10 frågor per match.</p>
        </div>
        <div class="user-elo-badge">
          <span class="user-elo-label">Ditt ELO:</span>
          <strong>${myElo}</strong>
          <small>${myProfile?.wins || 0}V · ${myProfile?.losses || 0}F</small>
        </div>
      </section>

      <div class="multiplayer-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected=${activeTab === 'lobbies'}
          class="tab-btn ${activeTab === 'lobbies' ? 'active' : ''}"
          @click=${() => {
            activeTab = 'lobbies';
            ctx.render();
          }}
        >
          ${icon('Swords')} Hitta match
        </button>
        <button
          type="button"
          role="tab"
          aria-selected=${activeTab === 'leaderboard'}
          class="tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}"
          @click=${() => {
            activeTab = 'leaderboard';
            ctx.render();
          }}
        >
          ${icon('Trophy')} Topplista
        </button>
      </div>

      ${
        activeTab === 'lobbies'
          ? html`
              <div class="mp-grid">
                <!-- Vänster: Skapa lobby & Rumskod -->
                <div class="mp-actions-panel">
                  <div class="card create-lobby-card">
                    <h3>Skapa en ny lobby</h3>
                    <p class="card-desc">Välj gren och starta ett väntrum för utmanare:</p>

                    <div class="branch-selector" role="radiogroup" aria-label="Välj gren">
                      <button
                        type="button"
                        role="radio"
                        aria-checked=${selectedCategory === 'particles'}
                        class="branch-btn ${selectedCategory === 'particles' ? 'active' : ''}"
                        @click=${() => {
                          selectedCategory = 'particles';
                          ctx.render();
                        }}
                      >
                        <span class="branch-title">🎯 Partikel 1v1</span>
                        <small>Snabba luckor med vanliga partiklar</small>
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked=${selectedCategory === 'vocab'}
                        class="branch-btn ${selectedCategory === 'vocab' ? 'active' : ''}"
                        @click=${() => {
                          selectedCategory = 'vocab';
                          ctx.render();
                        }}
                      >
                        <span class="branch-title">📖 Vokabulär 1v1</span>
                        <small>Ord & kanji från Genki Lektion 3–5</small>
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked=${selectedCategory === 'word_order'}
                        class="branch-btn ${selectedCategory === 'word_order' ? 'active' : ''}"
                        @click=${() => {
                          selectedCategory = 'word_order';
                          ctx.render();
                        }}
                      >
                        <span class="branch-title">🧩 Ordföljd & Meningar 1v1</span>
                        <small>Satsdelar (S/O/V) och meningsbyggnad</small>
                      </button>
                    </div>

                    <button
                      class="primary create-btn"
                      ?disabled=${lobbyBusy}
                      @click=${async () => {
                        if (lobbyBusy) return;
                        lobbyBusy = true;
                        const epoch = viewEpoch;
                        feedbackMessage = 'Skapar lobby...';
                        ctx.render();
                        try {
                          const code = await createLobby(user, selectedCategory);
                          if (epoch !== viewEpoch) {
                            await leaveLobby(code, user.uid);
                            return;
                          }
                          activeLobbyId = code;
                          hasCelebrated = false;
                          feedbackMessage = '';
                          watchLobby(ctx, code);
                        } catch (err) {
                          if (epoch === viewEpoch)
                            feedbackMessage = err.message || 'Kunde inte skapa lobby';
                        } finally {
                          if (epoch === viewEpoch) {
                            lobbyBusy = false;
                            ctx.render();
                          }
                        }
                      }}
                    >
                      ${icon('Swords')} Skapa Lobby
                    </button>
                  </div>

                  <div class="card join-code-card">
                    <h3>Gå med med rumskod</h3>
                    <div class="join-code-row">
                      <input
                        type="text"
                        class="code-input"
                        placeholder="T.ex. JP42"
                        maxlength="4"
                        .value=${joinCodeInput}
                        @input=${(e) => {
                          joinCodeInput = e.target.value.toUpperCase();
                        }}
                        @keydown=${(e) => {
                          if (e.key === 'Enter') handleJoinWithCode(ctx);
                        }}
                      />
                      <button class="secondary" @click=${() => handleJoinWithCode(ctx)}>
                        Gå med
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Höger: Öppna lobbys i realtid -->
                <div class="mp-lobbies-panel">
                  <div class="card lobbies-card">
                    <div class="card-header-row">
                      <h3>${icon('Users')} Öppna lobbys (${openLobbiesList.length})</h3>
                    </div>

                    ${
                      openLobbiesList.length === 0
                        ? html`
                            <div class="empty-lobbies">
                              <p>Inga öppna matcher just nu.</p>
                              <small>Skapa en lobby och dela koden med en kursare!</small>
                            </div>
                          `
                        : html`
                            <ul class="lobbies-list">
                              ${openLobbiesList.map((lobby) => {
                                const isMe = lobby.host.uid === user.uid;
                                const branchName =
                                  lobby.category === 'particles'
                                    ? 'Partiklar'
                                    : lobby.category === 'vocab'
                                      ? 'Vokabulär'
                                      : 'Ordföljd';
                                return html`
                                  <li class="lobby-item">
                                    <div class="lobby-info">
                                      <div class="host-avatar">
                                        ${
                                          lobby.host.photoURL
                                            ? html`<img src=${lobby.host.photoURL} alt="" />`
                                            : html`<span class="avatar-placeholder"
                                                >${lobby.host.displayName[0]}</span
                                              >`
                                        }
                                      </div>
                                      <div>
                                        <strong class="host-name">${lobby.host.displayName}</strong>
                                        <div class="lobby-tags">
                                          <span class="badge elo-badge"
                                            >${lobby.host.elo || DEFAULT_ELO} ELO</span
                                          >
                                          <span class="badge cat-badge">${branchName}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      class="secondary join-btn"
                                      ?disabled=${isMe}
                                      @click=${() => joinSelectedLobby(ctx, lobby.id)}
                                    >
                                      ${isMe ? 'Din lobby' : 'Utmana'}
                                    </button>
                                  </li>
                                `;
                              })}
                            </ul>
                          `
                    }
                  </div>
                </div>
              </div>
            `
          : html`
              <div class="card leaderboard-card">
                <div class="card-header-row">
                  <h2>${icon('Trophy')} Topplista · 1v1 Elo</h2>
                  <small>Uppdateras i realtid efter varje match</small>
                </div>
                ${renderLeaderboardTable(leaderboardList, user.uid)}
              </div>
            `
      }
      ${feedbackMessage ? html`<p class="feedback-msg" role="alert">${feedbackMessage}</p>` : ''}
    </div>
  `;
}

async function handleJoinWithCode(ctx) {
  const code = joinCodeInput.trim().toUpperCase();
  if (!code || code.length !== 4) {
    feedbackMessage = 'Ange en giltig 4-teckens kod';
    ctx.render();
    return;
  }
  await joinSelectedLobby(ctx, code);
}

async function joinSelectedLobby(ctx, lobbyId) {
  if (lobbyBusy) return;
  lobbyBusy = true;
  const epoch = viewEpoch;
  feedbackMessage = 'Ansluter till match...';
  ctx.render();
  try {
    const joined = await joinLobby(lobbyId, ctx.user);
    if (epoch !== viewEpoch) {
      await leaveLobby(lobbyId, ctx.user.uid);
      return;
    }
    activeLobbyId = lobbyId;
    currentLobbyData = joined;
    hasCelebrated = false;
    feedbackMessage = '';
    watchLobby(ctx, lobbyId);
  } catch (err) {
    if (epoch === viewEpoch) feedbackMessage = err.message || 'Kunde inte ansluta till lobby';
  } finally {
    if (epoch === viewEpoch) {
      lobbyBusy = false;
      ctx.render();
    }
  }
}

/* =========================================================================
   3. Waiting Room View
   ========================================================================= */
function waitingRoomView(ctx) {
  const { user } = ctx;
  const isHost = currentLobbyData.host.uid === user.uid;
  const guest = currentLobbyData.guest;
  const categoryLabel =
    currentLobbyData.category === 'particles'
      ? 'Partikel 1v1'
      : currentLobbyData.category === 'vocab'
        ? 'Vokabulär 1v1'
        : 'Ordföljd & Meningar 1v1';

  return html`
    <div class="multiplayer-container">
      <div class="waiting-card card">
        <div class="waiting-header">
          <span class="badge cat-badge">${categoryLabel}</span>
          <h2>Rumskod: <span class="room-code-tag">${currentLobbyData.id}</span></h2>
          <p class="waiting-sub">Dela koden med den du vill möta eller vänta på en utmanare.</p>
        </div>

        <div class="players-vs-grid">
          <div class="player-slot player-host">
            <div class="player-avatar-large">
              ${
                currentLobbyData.host.photoURL
                  ? html`<img src=${currentLobbyData.host.photoURL} alt="" />`
                  : html`<span class="avatar-placeholder-large"
                      >${currentLobbyData.host.displayName[0]}</span
                    >`
              }
            </div>
            <strong class="player-slot-name">${currentLobbyData.host.displayName}</strong>
            <span class="badge elo-badge">${currentLobbyData.host.elo || DEFAULT_ELO} ELO</span>
            <span class="slot-role">Värd</span>
          </div>

          <div class="vs-divider">
            <span>VS</span>
          </div>

          <div class="player-slot player-guest">
            ${
              guest
                ? html`
                    <div class="player-avatar-large">
                      ${
                        guest.photoURL
                          ? html`<img src=${guest.photoURL} alt="" />`
                          : html`<span class="avatar-placeholder-large"
                              >${guest.displayName[0]}</span
                            >`
                      }
                    </div>
                    <strong class="player-slot-name">${guest.displayName}</strong>
                    <span class="badge elo-badge">${guest.elo || DEFAULT_ELO} ELO</span>
                    <span class="slot-role slot-ready">Redo</span>
                  `
                : html`
                    <div class="player-avatar-large waiting-pulse">${icon('Users')}</div>
                    <span class="waiting-text">Väntar på utmanare...</span>
                  `
            }
          </div>
        </div>

        <div class="waiting-actions">
          ${feedbackMessage ? html`<p role="alert">${feedbackMessage}</p>` : ''}
          ${
            isHost && guest
              ? html`
                  <button
                    class="primary start-btn"
                    @click=${async () => {
                      try {
                        await startMatch(activeLobbyId);
                      } catch (err) {
                        feedbackMessage = err.message || 'Kunde inte starta';
                        ctx.render();
                      }
                    }}
                  >
                    ${icon('Swords')} Starta matchen!
                  </button>
                `
              : ''
          }

          <button
            class="secondary leave-btn"
            @click=${async () => {
              await leaveLobby(activeLobbyId, user.uid);
              resetMultiplayerView();
              ctx.render();
            }}
          >
            Lämna lobby
          </button>
        </div>
      </div>
    </div>
  `;
}

/* =========================================================================
   4. Live Match Arena View
   ========================================================================= */
function arenaView(ctx) {
  const { user } = ctx;
  const game = currentLobbyData.game;
  if (!game) return html`<div>Laddar match...</div>`;

  const now = Date.now();
  const isCountdown = game.roundStartTime && now < game.roundStartTime;
  const countdownSec = Math.max(1, Math.ceil((game.roundStartTime - now) / 1000));

  const roundIdx = game.currentRoundIndex || 0;
  const currentQ = game.questions[roundIdx];
  const hostUid = game.hostUid;
  const guestUid = game.guestUid;
  const isHost = user.uid === hostUid;

  const myScore = game.scores[user.uid] || 0;
  const oppUid = isHost ? guestUid : hostUid;
  const oppScore = game.scores[oppUid] || 0;
  const oppName = isHost
    ? currentLobbyData.guest?.displayName || 'Motståndare'
    : currentLobbyData.host?.displayName || 'Värd';

  const roundAnswers = game.answers?.[roundIdx] || {};
  const myAnswer = roundAnswers[user.uid];
  const hasAnswered = Boolean(myAnswer);
  const roundWinnerUid = game.roundWinners?.[roundIdx];

  // Timer bar calculation
  const elapsed = Math.max(0, now - (game.roundStartTime || now));
  const timePercent = Math.max(0, Math.min(100, 100 - (elapsed / ROUND_TIME_MS) * 100));

  return html`
    <div class="multiplayer-container arena-container">
      ${feedbackMessage ? html`<p role="alert">${feedbackMessage}</p>` : ''}
      <!-- Arena Top Scoreboard -->
      <header class="arena-header card">
        <div class="arena-player arena-me">
          <span class="arena-player-label">Du</span>
          <div class="arena-score ${myAnswer?.isCorrect ? 'score-gain' : ''}">${myScore}</div>
        </div>

        <div class="arena-round-indicator">
          <span class="round-badge">Fråga ${roundIdx + 1} / 10</span>
          <div class="timer-track" aria-hidden="true">
            <div
              class="timer-fill"
              style="width: ${game.status === 'playing' ? timePercent : 100}%;"
            ></div>
          </div>
        </div>

        <div class="arena-player arena-opp">
          <span class="arena-player-label">${oppName}</span>
          <div class="arena-score">${oppScore}</div>
        </div>
      </header>

      ${
        isCountdown
          ? html`
              <div class="arena-countdown-overlay card">
                <span class="countdown-label">Gör dig redo!</span>
                <div class="countdown-number">${countdownSec}</div>
                <p>Snabbaste korrekta svaret vinner poängen!</p>
              </div>
            `
          : html`
              <!-- Question Card -->
              <div class="card question-card">
                <div class="question-prompt">${languageText(currentQ.prompt)}</div>
              </div>

              <!-- 4 Multiple Choice Buttons -->
              <div class="choices-grid">
                ${currentQ.choices.map((choice) => {
                  const wasChosen = myAnswer?.answer === choice;
                  let btnState = '';
                  if (hasAnswered) {
                    if (wasChosen && myAnswer.isCorrect) btnState = 'btn-correct';
                    else if (wasChosen && !myAnswer.isCorrect) btnState = 'btn-wrong';
                    else if (choice === currentQ.correctAnswer && game.status === 'round_end')
                      btnState = 'btn-reveal-correct';
                  }

                  return html`
                    <button
                      type="button"
                      class="choice-btn ${btnState}"
                      ?disabled=${hasAnswered || game.status !== 'playing'}
                      @click=${async () => {
                        if (hasAnswered || game.status !== 'playing') return;
                        const isCorrect = choice === currentQ.correctAnswer;
                        if (isCorrect) {
                          playAnimeSound('wow', ctx.theme);
                        } else {
                          playAnimeSound('nani', ctx.theme);
                        }
                        const epoch = viewEpoch;
                        try {
                          await submitAnswer(activeLobbyId, user.uid, roundIdx, choice);
                        } catch (error) {
                          if (epoch === viewEpoch) {
                            feedbackMessage = error.message || 'Kunde inte skicka svaret';
                            ctx.render();
                          }
                        }
                      }}
                    >
                      <span class="choice-text">${languageText(choice)}</span>
                      ${wasChosen && myAnswer.isCorrect ? html`<span class="choice-badge">+1p!</span>` : ''}
                      ${wasChosen && !myAnswer.isCorrect ? html`<span class="choice-badge badge-wrong">-1p!</span>` : ''}
                    </button>
                  `;
                })}
              </div>

              <!-- Round Result Banner during 1.5s pause -->
              ${
                game.status === 'round_end'
                  ? html`
                      <div class="round-end-banner">
                        ${
                          roundWinnerUid === user.uid
                            ? html`<strong class="winner-self"
                                >${icon('Check')} Du var snabbast! (+1p)</strong
                              >`
                            : roundWinnerUid === oppUid
                              ? html`<strong class="winner-opp">${oppName} tog poängen!</strong>`
                              : html`<strong>Ingen svarade rätt!</strong>`
                        }
                        ${currentQ.explanation ? html`<p class="round-expl">${currentQ.explanation}</p>` : ''}
                      </div>
                    `
                  : ''
              }
            `
      }
    </div>
  `;
}

/* =========================================================================
   5. Match Result View
   ========================================================================= */
function matchResultView(ctx) {
  const { user } = ctx;
  const game = currentLobbyData.game;
  if (!game) return html`<div>Resultat saknas</div>`;

  const hostUid = game.hostUid;
  const isHost = user.uid === hostUid;
  const oppUid = isHost ? game.guestUid : hostUid;
  const oppName = isHost
    ? currentLobbyData.guest?.displayName || 'Motståndare'
    : currentLobbyData.host?.displayName || 'Värd';

  const myScore = game.scores[user.uid] || 0;
  const oppScore = game.scores[oppUid] || 0;
  const isWinner = game.winnerUid === user.uid;
  const isDraw = game.isDraw;
  const myEloDiff = game.eloChanges?.[user.uid] || 0;

  if (isWinner && !hasCelebrated) {
    hasCelebrated = true;
    playAnimeSound('arigato', ctx.theme);
  }

  return html`
    <div class="multiplayer-container">
      <div
        class="card result-card ${isWinner ? 'result-win' : isDraw ? 'result-draw' : 'result-loss'}"
      >
        <div class="result-banner">
          <div class="result-icon">
            ${isWinner ? icon('Trophy') : isDraw ? icon('Users') : icon('Swords')}
          </div>
          <h1>${isWinner ? 'Seger! 🏆' : isDraw ? 'Oavgjort! 🤝' : 'Förlust!'}</h1>
          <p class="result-tagline">
            ${
              isWinner
                ? 'Grymt spelat! Du dominerade arenan.'
                : isDraw
                  ? 'En extremt jämn match in i det sista!'
                  : 'Bra kämpat! Ta revansch i nästa match.'
            }
          </p>
        </div>

        <div class="result-scores-box">
          <div class="result-player">
            <span>Du</span>
            <strong>${myScore}p</strong>
          </div>
          <span class="score-dash">–</span>
          <div class="result-player">
            <span>${oppName}</span>
            <strong>${oppScore}p</strong>
          </div>
        </div>

        <div class="elo-change-box">
          <span class="elo-change-label">ELO-justering:</span>
          <strong
            class="elo-change-val ${myEloDiff > 0 ? 'elo-pos' : myEloDiff < 0 ? 'elo-neg' : ''}"
          >
            ${myEloDiff > 0 ? `+${myEloDiff}` : myEloDiff} ELO
          </strong>
        </div>

        <div class="result-actions">
          <button
            class="primary"
            @click=${async () => {
              await leaveLobby(activeLobbyId, user.uid);
              resetMultiplayerView();
              ctx.render();
            }}
          >
            ${icon('RotateCcw')} Ny match
          </button>
          <button
            class="secondary"
            @click=${() => {
              activeTab = 'leaderboard';
              resetMultiplayerView();
              ctx.render();
            }}
          >
            ${icon('Trophy')} Visa topplistan
          </button>
        </div>
      </div>
    </div>
  `;
}

/* =========================================================================
   Helper: Leaderboard Table Component
   ========================================================================= */
function renderLeaderboardTable(list, currentUid) {
  if (!list || list.length === 0) {
    return html`<p class="empty-table">Inga rankade matcher har spelats än. Bli den första!</p>`;
  }

  return html`
    <div class="leaderboard-table-wrapper">
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th class="col-rank">#</th>
            <th class="col-player">Spelare</th>
            <th class="col-elo">ELO</th>
            <th class="col-record">Matcher (V/F)</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((player, index) => {
            const isMe = currentUid && player.uid === currentUid;
            const rankIcon =
              index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;
            return html`
              <tr class="${isMe ? 'row-me' : ''}">
                <td class="col-rank">${rankIcon}</td>
                <td class="col-player">
                  <div class="player-cell">
                    ${
                      player.photoURL
                        ? html`<img class="cell-avatar" src=${player.photoURL} alt="" />`
                        : html`<span class="cell-avatar placeholder"
                            >${player.displayName?.[0] || '?'}</span
                          >`
                    }
                    <strong>${player.displayName}</strong>
                    ${isMe ? html`<span class="tag-you">Du</span>` : ''}
                  </div>
                </td>
                <td class="col-elo">
                  <span class="elo-val">${player.elo || DEFAULT_ELO}</span>
                </td>
                <td class="col-record">${player.wins || 0}V · ${player.losses || 0}F</td>
              </tr>
            `;
          })}
        </tbody>
      </table>
    </div>
  `;
}
