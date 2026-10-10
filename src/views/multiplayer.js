import { html } from 'lit-html';
import { icon, languageText } from './shared.js';
import { playAnimeSound } from '../audio.js';
import { db } from '../cloud.js';
import {
  createLobby,
  joinLobby,
  leaveLobby,
  startMatch,
  acknowledgeMatchStart,
  progressMatchStart,
  submitAnswer,
  advanceRoundIfDue,
  sendHeartbeat,
  isPlayerPresent,
  expireDisconnectedPlayers,
  subscribeToLobby,
  subscribeToOpenLobbies,
  subscribeToLeaderboard,
  getActivePlayerUids,
  getPlayerMatchOutcome,
  getMultiplayerNow,
  getMultiplayerClock,
  isMultiplayerClockValid,
  synchronizeMultiplayerClock,
  invalidateMultiplayerClock,
  updatePlayerClockStatus,
  getRoundDeadline,
  isRoundExpired,
  DEFAULT_ELO,
  ROUND_TIME_MS,
  TIMEOUT_PENALTY,
  MAX_PLAYERS,
  MIN_PLAYERS,
  MATCH_PROTOCOL_VERSION,
  MAX_CLOCK_UNCERTAINTY_MS,
  MAX_CLOCK_AGE_MS,
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
let locallyOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
let lobbyBusy = false;
let viewEpoch = 0;
let currentViewContext = null;
let lifecycleRegistered = false;
let lastTimerMonotonic = 0;
let answerAttempt = null;
let startBusy = false;
let preparedVersion = null;
let enteredVersion = null;

export function resetMultiplayerView(uid = null) {
  const leaving = activeLobbyId && uid ? leaveLobby(activeLobbyId, uid) : Promise.resolve();
  viewEpoch++;
  answerAttempt = null;
  preparedVersion = null;
  enteredVersion = null;
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

// Monotonic lobby revisions also cover locally returned transaction results.
function acceptLobbyData(data) {
  if (!data || (currentLobbyData && data.gameRevision < currentLobbyData.gameRevision)) return;
  currentLobbyData = { ...data, presence: data.presence || currentLobbyData?.presence || {} };
}

async function prepareStart(ctx) {
  if (startBusy || !activeLobbyId || !currentLobbyData?.start || locallyOffline) return;
  const observed = currentLobbyData;
  const version = observed.start.version;
  if (!['preparing', 'countdown'].includes(observed.start.phase)) return;
  startBusy = true;
  const epoch = viewEpoch,
    code = activeLobbyId;
  const accept = (data) => {
    if (epoch === viewEpoch && code === activeLobbyId) acceptLobbyData(data);
  };
  try {
    if (observed.start.phase === 'preparing' && preparedVersion !== version) {
      const clock = await synchronizeMultiplayerClock(db, activeUserUid, { force: true });
      if (epoch !== viewEpoch) return;
      if (!clock.valid) {
        accept(await progressMatchStart(code, version));
        return;
      }
      const data = await acknowledgeMatchStart(code, activeUserUid, observed);
      if (
        epoch === viewEpoch &&
        data?.start?.version === version &&
        data.start.prepared?.[activeUserUid]
      )
        preparedVersion = version;
      accept(data);
    } else if (observed.start.phase === 'countdown' && !observed.start.entered[activeUserUid]) {
      const clock = getMultiplayerClock(db);
      if (clock.valid && clock.now + clock.uncertainty < observed.game.roundStartTime) {
        enteredVersion = version;
        ctx.render();
      }
      const data = await acknowledgeMatchStart(code, activeUserUid, observed, 'entered');
      accept(data);
    }
    accept(await progressMatchStart(code, version));
  } catch (error) {
    if (epoch === viewEpoch) feedbackMessage = error.message || 'Kunde inte förbereda starten';
  } finally {
    startBusy = false;
    if (epoch === viewEpoch) ctx.render();
  }
}

function watchLobby(ctx, code) {
  lobbyUnsub?.();
  const epoch = viewEpoch;
  lobbyUnsub = subscribeToLobby(
    code,
    (data) => {
      if (epoch !== viewEpoch || activeLobbyId !== code) return;
      if (!data) {
        resetMultiplayerView();
        feedbackMessage = 'Lobbyn har stängts.';
      } else {
        acceptLobbyData(data);
      }
      ctx.render();
    },
    (error) => {
      if (epoch !== viewEpoch || activeLobbyId !== code) return;
      feedbackMessage = error.message || 'Kunde inte hämta matchen';
      ctx.render();
    },
  );
}

export function multiplayerView(ctx) {
  const { user } = ctx;
  activeUserUid = user?.uid || null;
  currentViewContext = ctx;

  if (!lifecycleRegistered && typeof window !== 'undefined') {
    lifecycleRegistered = true;
    const renewClock = async () => {
      if (!activeUserUid) return;
      const epoch = viewEpoch;
      invalidateMultiplayerClock(db, 'lifecycle-event');
      currentViewContext?.render?.();
      try {
        const clock = await synchronizeMultiplayerClock(db, activeUserUid, { force: true });
        if (epoch === viewEpoch && activeLobbyId) {
          await updatePlayerClockStatus(activeLobbyId, activeUserUid, clock);
        }
      } catch {}
      if (epoch === viewEpoch) currentViewContext?.render?.();
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') renewClock();
    });
    window.addEventListener('pageshow', () => renewClock());
    window.addEventListener('online', async () => {
      locallyOffline = false;
      await renewClock();
      if (activeLobbyId) sendHeartbeat(activeLobbyId, activeUserUid).catch(() => {});
    });
    window.addEventListener('offline', () => {
      locallyOffline = true;
      invalidateMultiplayerClock(db, 'offline');
      currentViewContext?.render?.();
    });
  }

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

  // Timer loop for arena round checks & timeouts (runs every 250ms for smooth progress bar)
  if (activeLobbyId && !timerInterval) {
    let advancing = false;
    let checkingPresence = false;
    let lastPresenceCheck = 0;
    timerInterval = setInterval(async () => {
      const mNow = performance.now();
      if (lastTimerMonotonic && mNow - lastTimerMonotonic > 3000) {
        invalidateMultiplayerClock(db, 'monotonic-gap');
        if (activeUserUid) {
          synchronizeMultiplayerClock(db, activeUserUid, { force: true })
            .then((clock) => {
              if (activeLobbyId) updatePlayerClockStatus(activeLobbyId, activeUserUid, clock);
              ctx.render?.();
            })
            .catch(() => {});
        }
      }
      lastTimerMonotonic = mNow;

      const clockSnapshot = getMultiplayerClock(db);
      if (clockSnapshot.status === 'stale' && activeUserUid && !advancing) {
        synchronizeMultiplayerClock(db, activeUserUid, { force: true })
          .then((clock) => {
            if (activeLobbyId) updatePlayerClockStatus(activeLobbyId, activeUserUid, clock);
            ctx.render?.();
          })
          .catch(() => {});
      }

      prepareStart(ctx);
      const game = currentLobbyData?.game;
      const now = getMultiplayerNow();
      if (
        currentLobbyData?.status === 'waiting' &&
        currentLobbyData.host?.uid !== activeUserUid &&
        clockSnapshot.valid &&
        !isPlayerPresent(
          currentLobbyData,
          currentLobbyData.host.uid,
          now - clockSnapshot.uncertainty,
        )
      ) {
        resetMultiplayerView();
        feedbackMessage = 'Värden är inte längre ansluten. Välj en annan lobby.';
        ctx.render?.();
        return;
      }
      if (
        game &&
        game.status !== 'finished' &&
        currentLobbyData.start?.phase === 'confirmed' &&
        clockSnapshot.valid &&
        getActivePlayerUids(game).some(
          (uid) => !isPlayerPresent(currentLobbyData, uid, now - clockSnapshot.uncertainty),
        ) &&
        !checkingPresence &&
        now - lastPresenceCheck >= 1000
      ) {
        checkingPresence = true;
        lastPresenceCheck = now;
        expireDisconnectedPlayers(activeLobbyId)
          .catch(() => {})
          .finally(() => {
            checkingPresence = false;
          });
      }
      ctx.render?.();
      if (!game || game.status === 'finished') return;

      const isHost = currentLobbyData.host?.uid === activeUserUid;
      const roundExpired = isRoundExpired(game, now);
      const pauseExpired = game.status === 'round_end' && now >= game.nextRoundAt;
      // Host triggers advance immediately; guests only act as a safety fallback (+3s delay)
      const due =
        currentLobbyData.receiptsPending ||
        (roundExpired && (isHost || now >= getRoundDeadline(game) + 3000)) ||
        (pauseExpired && (isHost || now >= game.nextRoundAt + 2000));

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
    }, 250);
  }

  // Every participant renews an independent presence document, including in play.
  // Closing/reloading a tab deliberately does not register a forfeit.
  if (activeLobbyId && currentLobbyData?.status !== 'finished' && !heartbeatInterval) {
    heartbeatInterval = setInterval(() => {
      if (activeLobbyId && !locallyOffline)
        sendHeartbeat(activeLobbyId, activeUserUid).catch(() => {});
    }, 10000);
  } else if ((!activeLobbyId || currentLobbyData?.status === 'finished') && heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  if (!user) {
    return unauthenticatedView(ctx);
  }

  if (!activeLobbyId || !currentLobbyData) {
    return lobbyBrowserView(ctx);
  }

  if (
    currentLobbyData.status !== 'finished' &&
    currentLobbyData.protocolVersion !== MATCH_PROTOCOL_VERSION
  ) {
    return html`<p role="alert">Uppdatera sidan för att använda matchens protokoll.</p>`;
  }

  if (currentLobbyData.status === 'preparing') {
    return html`<div class="waiting-card card">
      <h2>Förbereder matchen…</h2>
      <p role="status">
        ${Object.keys(currentLobbyData.start.prepared).length} /
        ${currentLobbyData.game.playerUids.length} deltagare har förberett matchen. Väntar högst 30
        sekunder.
      </p>
      ${
        currentLobbyData.host.uid === user.uid
          ? html`<button
              class="secondary"
              @click=${async () => {
                const code = activeLobbyId,
                  epoch = viewEpoch;
                const data = await progressMatchStart(code, currentLobbyData.start.version, true);
                if (epoch === viewEpoch && code === activeLobbyId) {
                  acceptLobbyData(data);
                  ctx.render();
                }
              }}
            >
              Avbryt starten
            </button>`
          : ''
      }
      ${feedbackMessage ? html`<p role="alert">${feedbackMessage}</p>` : ''}
    </div>`;
  }

  if (currentLobbyData.status === 'waiting') {
    return waitingRoomView(ctx);
  }

  if (
    currentLobbyData.status === 'in_progress' ||
    currentLobbyData.status === 'playing' ||
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
          <p class="overline">PARTY & ARENA · 2–10 SPELARE</p>
          <h1 tabindex="-1">Utmana kursare i realtid!</h1>
          <p>
            Möt 2 till 10 studenter samtidigt i snabba 10-frågors dueller med officiellt
            All-play-all ELO.
          </p>
        </div>
      </section>

      <div class="card auth-prompt-card">
        <div class="auth-prompt-content">
          <div class="auth-prompt-icon">${icon('Swords')}</div>
          <h2>Logga in för att tävla</h2>
          <p>
            Arenan och ELO-systemet kräver ett Google-konto för att spara din ranking och registrera
            segrar på topplistan.
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
          <p class="overline">PARTY & ARENA · 2–10 SPELARE</p>
          <h1 tabindex="-1">Flerspelararena</h1>
          <p>
            Svara snabbt och rätt för upp till 1 000 poäng! Fel svar ger −250 poäng. 10 frågor per
            match.
          </p>
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
                    <p class="card-desc">Välj gren och bjud in upp till 10 spelare:</p>

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
                        <span class="branch-title">🎯 Partikelarena</span>
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
                        <span class="branch-title">📖 Vokabulärarena</span>
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
                        <span class="branch-title">🧩 Ordföljd & Meningar</span>
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
                              <small>Skapa en lobby och dela koden med kursare!</small>
                            </div>
                          `
                        : html`
                            <ul class="lobbies-list">
                              ${openLobbiesList.map((lobby) => {
                                const isMe = lobby.host?.uid === user?.uid;
                                const branchName =
                                  lobby.category === 'particles'
                                    ? 'Partiklar'
                                    : lobby.category === 'vocab'
                                      ? 'Vokabulär'
                                      : 'Ordföljd';
                                const count =
                                  lobby.readyCount ??
                                  lobby.playerCount ??
                                  Object.keys(lobby.players || {}).length;
                                return html`
                                  <li class="lobby-item">
                                    <div class="lobby-info">
                                      <div class="host-avatar">
                                        ${
                                          lobby.host?.photoURL
                                            ? html`<img src=${lobby.host.photoURL} alt="" />`
                                            : html`<span class="avatar-placeholder"
                                                >${lobby.host?.displayName?.[0] || '?'}</span
                                              >`
                                        }
                                      </div>
                                      <div>
                                        <strong class="host-name"
                                          >${lobby.host?.displayName || 'Värd'}</strong
                                        >
                                        <div class="lobby-tags">
                                          <span class="badge elo-badge"
                                            >${lobby.host?.elo || DEFAULT_ELO} ELO</span
                                          >
                                          <span class="badge cat-badge">${branchName}</span>
                                          <span class="badge count-badge"
                                            >${count}/${MAX_PLAYERS}</span
                                          >
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      class="secondary join-btn"
                                      ?disabled=${isMe || count >= MAX_PLAYERS}
                                      @click=${() => joinSelectedLobby(ctx, lobby.id)}
                                    >
                                      ${isMe ? 'Din lobby' : count >= MAX_PLAYERS ? 'Full' : 'Gå med'}
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
                  <h2>${icon('Trophy')} Topplista · Officiellt ELO</h2>
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
   3. Waiting Room View (Supports 2–10 Players)
   ========================================================================= */
function waitingRoomView(ctx) {
  const { user } = ctx;
  const isHost = currentLobbyData.host?.uid === user?.uid;

  const playersMap = currentLobbyData.players || {
    ...(currentLobbyData.host?.uid ? { [currentLobbyData.host.uid]: currentLobbyData.host } : {}),
    ...(currentLobbyData.guest?.uid
      ? { [currentLobbyData.guest.uid]: currentLobbyData.guest }
      : {}),
  };
  const playersList = Object.values(playersMap);
  const present = (uid) =>
    isPlayerPresent(currentLobbyData, uid) && !(uid === user.uid && locallyOffline);
  const connectedPlayers = playersList.filter((p) => present(p.uid));
  const count = connectedPlayers.filter((p) => p.ready !== false).length;

  const categoryLabel =
    currentLobbyData.category === 'particles'
      ? 'Partiklar'
      : currentLobbyData.category === 'vocab'
        ? 'Vokabulär'
        : 'Ordföljd & Meningar';

  const myClock = getMultiplayerClock(db);
  const allReady = connectedPlayers.every((p) => p.ready !== false);
  const canStart =
    count >= MIN_PLAYERS && allReady && myClock.valid && present(currentLobbyData.host.uid);

  return html`
    <div class="multiplayer-container">
      <div class="waiting-card card">
        <div class="waiting-header">
          <span class="badge cat-badge">${categoryLabel} Arena</span>
          <h2>Rumskod: <span class="room-code-tag">${currentLobbyData.id}</span></h2>
          <p class="waiting-sub">Dela koden med kursare för att starta matchen tillsammans!</p>
          <div class="waiting-counter-badge">
            ${icon('Users')} <strong>${count} / ${MAX_PLAYERS}</strong> redo
            ${
              canStart
                ? html`<span class="badge ready-tag">Redo att starta</span>`
                : !allReady || !myClock.valid
                  ? html`<span class="badge sync-tag">Omsynkroniserar…</span>`
                  : html`<span class="badge waiting-tag">Väntar på fler spelare...</span>`
            }
          </div>
        </div>

        <!-- Dynamic 10-Player Grid -->
        <div class="waiting-players-grid">
          ${playersList.map((player) => {
            const playerIsHost = player.uid === currentLobbyData.host?.uid;
            const isSyncing =
              player.ready === false ||
              player.clockStatus === 'syncing' ||
              player.clockStatus === 'uncertain' ||
              player.clockStatus === 'invalidated' ||
              player.clockStatus === 'stale';
            return html`
              <div class="waiting-player-card ${player.uid === user.uid ? 'card-me' : ''}">
                <div class="waiting-avatar-wrap">
                  ${
                    player.photoURL
                      ? html`<img class="waiting-avatar" src=${player.photoURL} alt="" />`
                      : html`<span class="waiting-avatar-placeholder"
                          >${player.displayName?.[0] || '?'}</span
                        >`
                  }
                  ${playerIsHost ? html`<span class="crown-badge" title="Värd">👑</span>` : ''}
                </div>
                <strong class="waiting-name">${player.displayName}</strong>
                <span class="badge elo-badge">${player.elo || DEFAULT_ELO} ELO</span>
                ${
                  !present(player.uid)
                    ? html`<span class="waiting-role">Frånkopplad</span>`
                    : isSyncing
                      ? html`<span class="waiting-role sync-role">Omsynkroniserar…</span>`
                      : html`<span class="waiting-role">${playerIsHost ? 'Värd' : 'Redo'}</span>`
                }
              </div>
            `;
          })}
          ${Array.from({ length: Math.max(0, MAX_PLAYERS - playersList.length) }).map(
            () => html`
              <div class="waiting-slot-empty">
                <div class="empty-plus-icon">${icon('UserPlus')}</div>
                <span class="empty-slot-label">Plats ledig</span>
              </div>
            `,
          )}
        </div>

        ${
          !myClock.valid
            ? html`
                <div class="clock-sync-card">
                  <div class="clock-sync-info">
                    <strong>${icon('Clock')} Klockan behöver synkroniseras</strong>
                    <p>Matchklockan har för hög osäkerhet eller tappade kontakten med servern.</p>
                  </div>
                  <button
                    class="secondary resync-btn"
                    @click=${async () => {
                      feedbackMessage = 'Synkroniserar matchklocka...';
                      ctx.render();
                      try {
                        const clock = await synchronizeMultiplayerClock(db, user.uid, {
                          force: true,
                        });
                        if (activeLobbyId) {
                          await updatePlayerClockStatus(activeLobbyId, user.uid, clock);
                        }
                        feedbackMessage = '';
                      } catch (err) {
                        feedbackMessage = err.message || 'Kunde inte synkronisera';
                      } finally {
                        ctx.render();
                      }
                    }}
                  >
                    Synkronisera nu
                  </button>
                </div>
              `
            : ''
        }

        <div class="waiting-actions">
          ${currentLobbyData.start?.reason ? html`<p role="status">${currentLobbyData.start.reason}</p>` : ''}
          ${feedbackMessage ? html`<p class="feedback-msg" role="alert">${feedbackMessage}</p>` : ''}
          ${
            isHost
              ? html`
                  <button
                    class="primary start-btn"
                    ?disabled=${!canStart || lobbyBusy}
                    @click=${async () => {
                      try {
                        if (lobbyBusy) return;
                        lobbyBusy = true;
                        const epoch = viewEpoch,
                          code = activeLobbyId;
                        ctx.render();
                        const data = await startMatch(code);
                        if (epoch === viewEpoch && code === activeLobbyId) {
                          acceptLobbyData(data);
                          feedbackMessage = '';
                          prepareStart(ctx);
                        }
                      } catch (err) {
                        feedbackMessage = err.message || 'Kunde inte starta';
                      } finally {
                        lobbyBusy = false;
                        ctx.render();
                      }
                    }}
                  >
                    ${icon('Swords')} Starta matchen!
                  </button>
                  ${
                    !canStart
                      ? html`<small class="waiting-hint"
                          >Väntar på att minst en till spelare ansluter...</small
                        >`
                      : ''
                  }
                `
              : html`
                  <div class="guest-waiting-status">
                    <p>${icon('Clock')} Väntar på att värden ska starta matchen...</p>
                  </div>
                `
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
   4. Live Match Arena View (Kahoot-Style)
   ========================================================================= */
function isCurrentAttempt(attempt) {
  return (
    answerAttempt === attempt &&
    attempt.epoch === viewEpoch &&
    attempt.lobbyId === activeLobbyId &&
    attempt.uid === activeUserUid &&
    currentLobbyData?.game?.startVersion === attempt.startVersion &&
    currentLobbyData?.game?.currentRoundIndex === attempt.roundIndex
  );
}

function confirmAnswer(attempt, answer, ctx) {
  if (attempt.status === 'confirmed') return;
  attempt.status = 'confirmed';
  attempt.answer = answer;
  playAnimeSound(answer.isCorrect ? 'wow' : 'nani', ctx.theme);
}

async function deliverAnswer(attempt, ctx) {
  if (!isCurrentAttempt(attempt)) return;
  if (!isMultiplayerClockValid(db)) {
    attempt.status = 'error';
    attempt.message = 'Matchklockan är inte synkroniserad. Vänta på omsynkronisering.';
    ctx.render();
    return;
  }
  attempt.status = 'sending';
  ctx.render();
  try {
    const receipt = await submitAnswer(
      attempt.lobbyId,
      attempt.uid,
      attempt.roundIndex,
      attempt.choice,
      attempt.id,
      attempt.startVersion,
    );
    if (!isCurrentAttempt(attempt)) return;
    if (
      (receipt?.status === 'accepted' || receipt?.status === 'already-received') &&
      receipt.answer
    ) {
      confirmAnswer(attempt, receipt.answer, ctx);
    } else if (attempt.status !== 'confirmed') {
      attempt.status = 'rejected';
      attempt.message =
        receipt?.status === 'late'
          ? 'Svaret kom för sent. Vänta på nästa fråga.'
          : 'Svaret kunde inte godtas. Vänta på nästa fråga.';
    }
  } catch (error) {
    if (!isCurrentAttempt(attempt) || attempt.status === 'confirmed') return;
    attempt.status = 'error';
    attempt.message = 'Kunde inte bekräfta svaret. Försök skicka samma val igen.';
  }
  if (isCurrentAttempt(attempt)) ctx.render();
}

function arenaView(ctx) {
  const { user } = ctx;
  const game = currentLobbyData.game;
  if (!game) return html`<div>Laddar match...</div>`;

  const now = getMultiplayerNow();
  // Ready countdown ONLY applies to round 0 before the roundStartTime
  const isCountdown =
    game.currentRoundIndex === 0 &&
    Boolean(game.roundStartTime) &&
    (now < game.roundStartTime || enteredVersion !== game.startVersion);
  const countdownSec = Math.max(
    1,
    Math.min(3, Math.ceil(((game.roundStartTime || now) - now) / 1000)),
  );

  const roundIdx = game.currentRoundIndex || 0;
  if (answerAttempt && !isCurrentAttempt(answerAttempt)) answerAttempt = null;
  const attempt = answerAttempt;
  const currentQ = game.questions?.[roundIdx] || { prompt: '', choices: [] };

  const playersMap = currentLobbyData.players || {
    ...(currentLobbyData.host?.uid ? { [currentLobbyData.host.uid]: currentLobbyData.host } : {}),
    ...(currentLobbyData.guest?.uid
      ? { [currentLobbyData.guest.uid]: currentLobbyData.guest }
      : {}),
  };
  const allPlayers = Object.values(playersMap);
  const activeUids = getActivePlayerUids(game);
  const totalPlayers = activeUids.length;
  const hasForfeited = game.forfeitedUids?.includes(user?.uid);

  const roundAnswers = game.answers?.[roundIdx] || {};
  const answeredCount = activeUids.filter((uid) => Boolean(roundAnswers[uid])).length;
  const savedAnswer = user?.uid ? roundAnswers[user.uid] : null;
  if (attempt && savedAnswer && !savedAnswer.timedOut) confirmAnswer(attempt, savedAnswer, ctx);
  const myAnswer = savedAnswer || (attempt?.status === 'confirmed' ? attempt.answer : null);
  const hasAnswered = Boolean(myAnswer);
  const roundWinners = game.roundWinners || {};
  const roundWinnerUid = roundWinners[roundIdx];

  // Scores and sorted leaderboard
  const scores = game.scores || {};
  const sortedStandings = [...allPlayers]
    .map((p) => ({
      uid: p.uid,
      displayName: p.displayName || 'Spelare',
      photoURL: p.photoURL,
      score: scores[p.uid] || 0,
      roundPoints: roundAnswers[p.uid]?.pointsAwarded || 0,
    }))
    .sort((a, b) => b.score - a.score);

  const myRank = sortedStandings.findIndex((p) => p.uid === user?.uid) + 1 || 1;
  const myScore = (user?.uid && scores[user.uid]) || 0;
  const leader = sortedStandings[0] || { displayName: 'Ingen', score: 0 };

  // Timer calculation: 8-second countdown begins ONLY when the first player answers
  const hasFirstAnswer = Boolean(game.firstAnswerAt);
  let timePercent = 100;
  let remainingSec = 8;
  if (hasFirstAnswer) {
    const elapsed = Math.max(0, now - game.firstAnswerAt);
    timePercent = Math.max(0, Math.min(100, 100 - (elapsed / ROUND_TIME_MS) * 100));
    remainingSec = Math.max(0, Math.ceil((ROUND_TIME_MS - elapsed) / 1000));
  }

  const myClock = getMultiplayerClock(db);

  return html`
    <div class="multiplayer-container arena-container">
      ${locallyOffline ? html`<p role="status">Frånkopplad. Återanslut inom 45 sekunder; rundans tid fortsätter.</p>` : ''}
      ${getActivePlayerUids(currentLobbyData.game)
        .filter((uid) => !isPlayerPresent(currentLobbyData, uid))
        .map(
          (uid) =>
            html`<p role="status">
              ${currentLobbyData.players?.[uid]?.displayName || 'Spelare'} är frånkopplad.
            </p>`,
        )}
      ${feedbackMessage ? html`<p class="feedback-msg" role="alert">${feedbackMessage}</p>` : ''}
      ${hasForfeited ? html`<p role="status">Du har lämnat matchen. Övriga spelare fortsätter.</p>` : ''}
      ${
        !myClock.valid
          ? html`
              <div class="arena-sync-banner">
                ${icon('Clock')} Omsynkroniserar matchklockan… Svar är pausade.
              </div>
            `
          : ''
      }

      <!-- Arena Top Scoreboard -->
      <header class="arena-header card">
        <div class="arena-player arena-me">
          <span class="arena-player-label">#${myRank} Du</span>
          <div class="arena-score ${myAnswer?.isCorrect ? 'score-gain' : ''}">
            ${(myScore || 0).toLocaleString('sv-SE')}p
          </div>
        </div>

        <div class="arena-round-indicator">
          <div class="round-status-row">
            <span class="round-badge">Fråga ${roundIdx + 1} / 10</span>
            <span
              class="timer-countdown-badge ${hasFirstAnswer ? 'active-countdown' : 'waiting-answer'}"
            >
              ${icon('Clock')} ${hasFirstAnswer ? `${remainingSec}s kvar` : 'Väntar på svar...'}
            </span>
            <span class="answered-badge ${answeredCount === totalPlayers ? 'all-answered' : ''}">
              ${icon('Users')} ${answeredCount}/${totalPlayers} svarat
            </span>
          </div>
          <div class="timer-track" aria-hidden="true">
            <div
              class="timer-fill ${hasFirstAnswer ? 'timer-running' : 'timer-idle'}"
              style="width: ${game.status === 'playing' ? (hasFirstAnswer ? timePercent : 100) : 0}%;"
            ></div>
          </div>
        </div>

        <div class="arena-player arena-leader">
          <span class="arena-player-label"
            >#1 ${leader.uid === user?.uid ? 'Du leder!' : leader.displayName}</span
          >
          <div class="arena-score">${(leader.score || 0).toLocaleString('sv-SE')}p</div>
        </div>
      </header>

      ${
        isCountdown
          ? html`
              <div class="arena-countdown-overlay card">
                <span class="countdown-label">Gör dig redo!</span>
                <div class="countdown-number">${countdownSec}</div>
                <p>Snabbaste korrekta svaren ger upp till 1 000 poäng. Fel svar ger −250p!</p>
              </div>
            `
          : html`
              <!-- Question Card -->
              <div class="card question-card">
                <div class="question-prompt">${languageText(currentQ.prompt)}</div>
              </div>

              <!-- 4 Multiple Choice Buttons -->
              ${
                attempt
                  ? html`<p role="status" class="answer-delivery-status">
                      ${
                        attempt.status === 'confirmed'
                          ? 'Svar mottaget.'
                          : game.status !== 'playing' || isRoundExpired(game, now)
                            ? 'Rundan är avslutad. Vänta på nästa fråga.'
                            : attempt.status === 'sending'
                              ? 'Skickar svar…'
                              : attempt.message
                      }
                      ${
                        attempt.status === 'error' &&
                        game.status === 'playing' &&
                        !isRoundExpired(game, now)
                          ? html`<button
                              class="secondary"
                              @click=${() => {
                                if (attempt.status === 'error') deliverAnswer(attempt, ctx);
                              }}
                            >
                              Skicka samma svar igen
                            </button>`
                          : ''
                      }
                    </p>`
                  : ''
              }
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
                      ?disabled=${Boolean(attempt) || hasAnswered || hasForfeited || game.status !== 'playing' || isRoundExpired(game, now) || !myClock.valid}
                      @click=${() => {
                        if (
                          answerAttempt ||
                          hasAnswered ||
                          hasForfeited ||
                          game.status !== 'playing' ||
                          isRoundExpired(game, getMultiplayerNow()) ||
                          currentLobbyData?.game !== game ||
                          !isMultiplayerClockValid(db)
                        )
                          return;
                        answerAttempt = {
                          id: crypto.randomUUID(),
                          choice,
                          roundIndex: roundIdx,
                          startVersion: game.startVersion,
                          lobbyId: activeLobbyId,
                          uid: user.uid,
                          epoch: viewEpoch,
                          status: 'sending',
                        };
                        deliverAnswer(answerAttempt, ctx);
                      }}
                    >
                      <span class="choice-text">${languageText(choice)}</span>
                      ${
                        wasChosen && myAnswer.isCorrect
                          ? html`<span class="choice-badge">+${myAnswer.pointsAwarded}p!</span>`
                          : ''
                      }
                      ${
                        wasChosen && !myAnswer.isCorrect
                          ? html`<span class="choice-badge badge-wrong"
                              >${myAnswer.pointsAwarded}p!</span
                            >`
                          : ''
                      }
                    </button>
                  `;
                })}
              </div>
            `
      }

      <!-- Round Result Banner during 2.0s Facitpaus -->
      ${
        game.status === 'round_end'
          ? html`
              <div class="round-end-banner">
                <div class="round-feedback-header">
                  ${
                    myAnswer?.isCorrect
                      ? roundWinnerUid === user?.uid
                        ? html`<strong class="winner-self"
                            >${icon('Check')} Du var snabbast! (+${myAnswer.pointsAwarded}p)</strong
                          >`
                        : html`<strong class="winner-self"
                            >${icon('Check')} Rätt svar! (+${myAnswer.pointsAwarded}p)</strong
                          >`
                      : myAnswer?.timedOut || !myAnswer?.answer
                        ? html`<strong class="winner-opp"
                            >${icon('Clock')} Tiden ute! (${TIMEOUT_PENALTY}p)</strong
                          >`
                        : myAnswer
                          ? html`<strong class="winner-opp"
                              >${icon('X')} Fel svar! (${myAnswer.pointsAwarded}p)</strong
                            >`
                          : html`<strong class="winner-opp"
                              >${icon('Clock')} Tiden ute! (${TIMEOUT_PENALTY}p)</strong
                            >`
                  }
                </div>
                ${
                  currentQ.explanation
                    ? html`<p class="round-expl">${currentQ.explanation}</p>`
                    : ''
                }

                <!-- Mini Kahoot-Style Leaderboard during pause -->
                <div class="mini-leaderboard">
                  <span class="mini-lb-title">Ställning efter fråga ${roundIdx + 1}</span>
                  <div class="mini-lb-list">
                    ${sortedStandings.slice(0, 5).map((p, idx) => {
                      const isMe = p.uid === user?.uid;
                      return html`
                        <div class="mini-lb-row ${isMe ? 'row-me' : ''}">
                          <span class="mini-lb-rank">#${idx + 1}</span>
                          <span class="mini-lb-name">${p.displayName}</span>
                          ${
                            p.roundPoints > 0
                              ? html`<span class="mini-lb-gain">+${p.roundPoints}p</span>`
                              : p.roundPoints < 0
                                ? html`<span class="mini-lb-loss">${p.roundPoints}p</span>`
                                : ''
                          }
                          <span class="mini-lb-score"
                            >${(p.score || 0).toLocaleString('sv-SE')}p</span
                          >
                        </div>
                      `;
                    })}
                  </div>
                </div>
              </div>
            `
          : ''
      }
    </div>
  `;
}

/* =========================================================================
   5. Match Result View (Podium & All-Play-All Table)
   ========================================================================= */
function matchResultView(ctx) {
  const { user } = ctx;
  const game = currentLobbyData.game;
  if (!game) return html`<div>Resultat saknas</div>`;

  const playersMap = currentLobbyData.players || {
    ...(currentLobbyData.host?.uid ? { [currentLobbyData.host.uid]: currentLobbyData.host } : {}),
    ...(currentLobbyData.guest?.uid
      ? { [currentLobbyData.guest.uid]: currentLobbyData.guest }
      : {}),
  };
  const allPlayers = Object.values(playersMap);

  const scores = game.scores || {};
  const sortedFinal = [...allPlayers]
    .map((p) => ({
      uid: p.uid,
      displayName: p.displayName || 'Spelare',
      photoURL: p.photoURL,
      elo: p.elo || DEFAULT_ELO,
      score: scores[p.uid] || 0,
      eloDiff: game.eloChanges?.[p.uid] || 0,
    }))
    .sort((a, b) => b.score - a.score);

  const myRank = sortedFinal.findIndex((p) => p.uid === user?.uid) + 1 || 1;
  const outcome = getPlayerMatchOutcome(game, user?.uid);
  const isWinner = outcome === 'win';
  const isDraw = outcome === 'draw';
  const myEloDiff = (user?.uid && game.eloChanges?.[user.uid]) || 0;
  const myFinalScore = (user?.uid && scores[user.uid]) || 0;

  if (isWinner && !hasCelebrated) {
    hasCelebrated = true;
    playAnimeSound('arigato', ctx.theme);
  }

  // Top 3 for podium
  const first = sortedFinal[0];
  const second = sortedFinal[1];
  const third = sortedFinal[2];

  return html`
    <div class="multiplayer-container">
      <div
        class="card result-card ${isWinner ? 'result-win' : isDraw ? 'result-draw' : 'result-loss'}"
      >
        <div class="result-banner">
          <div class="result-icon">
            ${isWinner ? icon('Trophy') : isDraw ? icon('Users') : icon('Swords')}
          </div>
          <h1>
            ${
              isWinner
                ? 'Seger! 🏆'
                : isDraw
                  ? 'Oavgjort! 🤝'
                  : `Förlust! (Plats #${myRank} av ${allPlayers.length})`
            }
          </h1>
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

        <!-- 3-Player Visual Podium -->
        <div class="podium-section">
          <div class="podium-container">
            ${
              second
                ? html`
                    <div class="podium-step podium-silver">
                      <div class="podium-player">
                        <span class="podium-medal">🥈</span>
                        <strong class="podium-name">${second.displayName}</strong>
                        <span class="podium-score"
                          >${(second.score || 0).toLocaleString('sv-SE')}p</span
                        >
                      </div>
                      <div class="podium-bar bar-silver">#2</div>
                    </div>
                  `
                : ''
            }
            ${
              first
                ? html`
                    <div class="podium-step podium-gold">
                      <div class="podium-player">
                        <span class="podium-medal">🥇</span>
                        <strong class="podium-name">${first.displayName}</strong>
                        <span class="podium-score"
                          >${(first.score || 0).toLocaleString('sv-SE')}p</span
                        >
                      </div>
                      <div class="podium-bar bar-gold">#1</div>
                    </div>
                  `
                : ''
            }
            ${
              third
                ? html`
                    <div class="podium-step podium-bronze">
                      <div class="podium-player">
                        <span class="podium-medal">🥉</span>
                        <strong class="podium-name">${third.displayName}</strong>
                        <span class="podium-score"
                          >${(third.score || 0).toLocaleString('sv-SE')}p</span
                        >
                      </div>
                      <div class="podium-bar bar-bronze">#3</div>
                    </div>
                  `
                : ''
            }
          </div>
        </div>

        <!-- My ELO change -->
        <div class="elo-change-box">
          <span class="elo-change-label">Din ELO-justering:</span>
          <strong
            class="elo-change-val ${myEloDiff > 0 ? 'elo-pos' : myEloDiff < 0 ? 'elo-neg' : ''}"
          >
            ${myEloDiff > 0 ? `+${myEloDiff}` : myEloDiff} ELO
          </strong>
        </div>

        <!-- Full Results Table for all participants (2–10) -->
        <div class="match-summary-table-section">
          <h3>${icon('Trophy')} Slutställning (${allPlayers.length} spelare)</h3>
          <div class="leaderboard-table-wrapper">
            <table class="leaderboard-table results-table">
              <thead>
                <tr>
                  <th class="col-rank">#</th>
                  <th class="col-player">Spelare</th>
                  <th class="col-score">Matchpoäng</th>
                  <th class="col-elo">ELO-ändring</th>
                </tr>
              </thead>
              <tbody>
                ${sortedFinal.map((p, idx) => {
                  const isMe = p.uid === user?.uid;
                  const rankIcon =
                    idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
                  return html`
                    <tr class="${isMe ? 'row-me' : ''}">
                      <td class="col-rank">${rankIcon}</td>
                      <td class="col-player">
                        <div class="player-cell">
                          ${
                            p.photoURL
                              ? html`<img class="cell-avatar" src=${p.photoURL} alt="" />`
                              : html`<span class="cell-avatar placeholder"
                                  >${p.displayName?.[0] || '?'}</span
                                >`
                          }
                          <strong>${p.displayName}</strong>
                          ${game.forfeitedUids?.includes(p.uid) ? html`<span>Lämnat</span>` : ''}
                          ${isMe ? html`<span class="tag-you">Du</span>` : ''}
                        </div>
                      </td>
                      <td class="col-score">
                        <strong>${(p.score || 0).toLocaleString('sv-SE')}p</strong>
                      </td>
                      <td class="col-elo">
                        <span
                          class="elo-diff-tag ${p.eloDiff > 0 ? 'elo-pos' : p.eloDiff < 0 ? 'elo-neg' : ''}"
                        >
                          ${p.eloDiff > 0 ? `+${p.eloDiff}` : p.eloDiff} ELO
                        </span>
                      </td>
                    </tr>
                  `;
                })}
              </tbody>
            </table>
          </div>
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
