import { test, expect } from '@playwright/test';
import path from 'node:path';

test.skip(!process.env.FIRESTORE_EMULATOR_HOST, 'Requires isolated Firebase emulators');
test.setTimeout(90000);

async function arena(page) {
  await page
    .getByRole('button', { name: /^(1v1 Duell|1v1)$/ })
    .filter({ visible: true })
    .click();
}

async function login(page) {
  await page.goto('/');
  // Also exercise entering multiplayer before authentication.
  await arena(page);
  const uid = await page.evaluate(async () => {
    const { auth } = await import('/src/cloud.js');
    // Reuse Vite's exact optimized module URLs, including their version query.
    const source = await (await fetch('/src/cloud.js')).text();
    const authUrl = source.match(/from ["']([^"']*firebase_auth[^"']*)["']/)[1];
    const firestoreUrl = source.match(/from ["']([^"']*firebase_firestore[^"']*)["']/)[1];
    window.multiplayerTestFirestore = await import(firestoreUrl);
    const { signInAnonymously } = await import(authUrl);
    return (await signInAnonymously(auth)).user.uid;
  });
  await expect(page.locator('#account')).toContainText('Logga ut');
  await arena(page);
  return uid;
}

async function read(page, collection, id) {
  return page.evaluate(
    async ({ collection, id }) => {
      const { db } = await import('/src/cloud.js');
      const { doc, getDoc } = window.multiplayerTestFirestore;
      const snap = await getDoc(doc(db, collection, id));
      return snap.exists() ? snap.data() : null;
    },
    { collection, id },
  );
}

async function create(page) {
  await page.getByRole('button', { name: 'Skapa Lobby', exact: true }).click();
  await expect(page.locator('.room-code-tag')).toBeVisible({ timeout: 20000 });
  return (await page.locator('.room-code-tag').textContent()).trim();
}

async function join(page, code, options = {}) {
  await page.locator('.code-input').fill(code);
  await page
    .locator('.join-code-card')
    .getByRole('button', { name: 'Gå med', exact: true })
    .click();
  await expect(page.locator('.room-code-tag')).toHaveText(code, options);
}

test('skewed device clocks preserve countdown, answer window and automatic round progression', async ({
  page,
  browser,
}, testInfo) => {
  const guest = await browser.newPage();
  const errors = [];
  for (const client of [page, guest]) client.on('pageerror', (error) => errors.push(error.message));
  try {
    const hostUid = await login(page);
    const guestUid = await login(guest);
    await page.clock.setFixedTime(Date.now() + 60000);
    await guest.clock.setFixedTime(Date.now() - 60000);
    const code = await create(page);
    await join(guest, code);
    await page.getByRole('button', { name: 'Starta matchen!' }).click();
    await expect(page.locator('.arena-countdown-overlay')).toBeVisible();
    await expect(guest.locator('.arena-countdown-overlay')).toBeVisible();
    await expect(guest.locator('.choices-grid button').first()).toBeEnabled();
    let lobby = await read(page, 'lobbies', code);
    await guest
      .getByRole('button', { name: lobby.game.questions[0].correctAnswer, exact: true })
      .click();
    await expect(page.locator('.answered-badge')).toContainText('1/2 svarat');
    await page
      .getByRole('button', { name: lobby.game.questions[0].correctAnswer, exact: true })
      .click();
    await expect(page.locator('.round-end-banner')).toBeVisible();
    lobby = await read(page, 'lobbies', code);
    expect(lobby.game.answers[0][hostUid].isCorrect).toBe(true);
    expect(lobby.game.answers[0][guestUid].isCorrect).toBe(true);
    await expect(page.locator('.round-badge')).toHaveText('Fråga 2 / 10');
    await page.evaluate(async (code) => {
      const { db } = await import('/src/cloud.js');
      const { getMultiplayerNow } = await import('/src/multiplayer.js');
      const { doc, updateDoc } = window.multiplayerTestFirestore;
      await updateDoc(doc(db, 'lobbies', code), {
        'game.roundStartTime': getMultiplayerNow() - 59000,
      });
    }, code);
    lobby = await read(page, 'lobbies', code);
    await page
      .getByRole('button', { name: lobby.game.questions[1].correctAnswer, exact: true })
      .click();
    // Wait for the displayed timer to prove the old 60s cutoff has passed.
    await expect(guest.locator('.timer-countdown-badge')).toContainText('5s kvar');
    await expect(guest.locator('.choices-grid button').first()).toBeEnabled();
    await page.screenshot({ path: testInfo.outputPath('synchronized-arena.png') });
    await expect(guest.locator('.round-end-banner')).toContainText('Tiden ute!', {
      timeout: 10000,
    });
    lobby = await read(page, 'lobbies', code);
    expect(lobby.game.answers[1][guestUid]).toMatchObject({ timedOut: true, pointsAwarded: -50 });
    await expect(page.locator('.round-badge')).toHaveText('Fråga 3 / 10');
    expect(errors).toEqual([]);
  } finally {
    await guest.close();
  }
});

test('two new players can complete ten rounds and record both ratings exactly once', async ({
  page,
  browser,
}, testInfo) => {
  const guest = await browser.newPage();
  const errors = [];
  for (const client of [page, guest]) client.on('pageerror', (error) => errors.push(error.message));
  try {
    const hostUid = await login(page);
    const guestUid = await login(guest);
    const code = await create(page);
    await join(guest, code);
    await page.getByRole('button', { name: 'Starta matchen!' }).click();
    for (let round = 0; round < 10; round++) {
      await expect(page.locator('.round-badge')).toHaveText(`Fråga ${round + 1} / 10`);
      const lobby = await read(page, 'lobbies', code);
      const answer = lobby.game.questions[round].correctAnswer;
      await page
        .locator('.choices-grid')
        .getByRole('button', { name: answer, exact: true })
        .click();
      const wrongAnswer = lobby.game.questions[round].choices.find((choice) => choice !== answer);
      await guest
        .locator('.choices-grid')
        .getByRole('button', { name: wrongAnswer, exact: true })
        .click();
      if (round < 9)
        await expect(page.locator('.round-end-banner')).toContainText('Du var snabbast');
    }
    await expect(page.locator('.result-card h1')).toContainText('Seger');
    await expect(guest.locator('.result-card h1')).toContainText('Förlust');
    const host = await read(page, 'leaderboard', hostUid);
    const opponent = await read(page, 'leaderboard', guestUid);
    expect(host).toMatchObject({ elo: 1216, wins: 1, matchesPlayed: 1 });
    expect(opponent).toMatchObject({ elo: 1184, losses: 1, matchesPlayed: 1 });
    const finished = await read(page, 'lobbies', code);
    expect(finished.game.answers[9][guestUid].pointsAwarded).toBe(-250);
    expect(finished.game.scores[guestUid]).toBe(-2500);
    // A late request from the other client must not record a second result.
    await guest.evaluate(async (code) => {
      const { advanceRoundIfDue, leaveLobby } = await import('/src/multiplayer.js');
      const { auth } = await import('/src/cloud.js');
      await advanceRoundIfDue(code);
      await leaveLobby(code, auth.currentUser.uid);
    }, code);
    expect(await read(page, 'leaderboard', hostUid)).toEqual(host);
    expect(await read(page, 'leaderboard', guestUid)).toEqual(opponent);
    expect(errors).toEqual([]);
    if (process.env.MULTIPLAYER_SCREENSHOT_DIR) {
      await page.screenshot({
        path: path.join(
          process.env.MULTIPLAYER_SCREENSHOT_DIR,
          `multiplayer-${testInfo.project.name}.png`,
        ),
      });
    }
  } finally {
    await guest.close();
  }
});

test('a three-player tie shows a loss to third place', async ({ page, browser }, testInfo) => {
  const second = await browser.newPage();
  const third = await browser.newPage();
  const errors = [];
  for (const client of [page, second, third])
    client.on('pageerror', (error) => errors.push(error.message));
  try {
    const ids = [await login(page), await login(second), await login(third)];
    const code = await create(page);
    await join(second, code);
    await join(third, code);
    await page.getByRole('button', { name: 'Starta matchen!' }).click();
    await expect(third.locator('.round-badge')).toBeVisible();
    await page.evaluate(
      async ({ code, ids }) => {
        const { db } = await import('/src/cloud.js');
        const { doc, updateDoc } = window.multiplayerTestFirestore;
        await updateDoc(doc(db, 'lobbies', code), {
          'game.currentRoundIndex': 9,
          'game.roundStartTime': Date.now() - 61000,
          'game.scores': { [ids[0]]: 1000, [ids[1]]: 1000, [ids[2]]: 0 },
        });
      },
      { code, ids },
    );
    await expect(page.locator('.result-card h1')).toContainText('Oavgjort');
    await expect(second.locator('.result-card h1')).toContainText('Oavgjort');
    await expect(third.locator('.result-card h1')).toContainText('Förlust! (Plats #3 av 3)');
    expect(await read(third, 'leaderboard', ids[2])).toMatchObject({
      losses: 1,
      draws: 0,
      matchesPlayed: 1,
    });
    const layout = await third.locator('.result-card').evaluate((card) => ({
      right: card.getBoundingClientRect().right,
      viewportWidth: window.innerWidth,
      overflow: card.scrollWidth - card.clientWidth,
    }));
    expect(layout.right).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.overflow).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
    if (process.env.MULTIPLAYER_SCREENSHOT_DIR) {
      await third.screenshot({
        scale: 'css',
        path: path.join(
          process.env.MULTIPLAYER_SCREENSHOT_DIR,
          `arena-tie-${testInfo.project.name}.png`,
        ),
      });
    }
  } finally {
    await second.close();
    await third.close();
  }
});

test('remaining players finish a round after the host leaves', async ({ page, browser }) => {
  const second = await browser.newPage();
  const third = await browser.newPage();
  try {
    await login(page);
    await login(second);
    await login(third);
    const code = await create(page);
    await join(second, code);
    await join(third, code);
    await page.getByRole('button', { name: 'Starta matchen!' }).click();
    await expect(third.locator('.round-badge')).toBeVisible();
    await page
      .getByRole('button', { name: 'Plugga', exact: true })
      .filter({ visible: true })
      .click();
    await expect(second.locator('.answered-badge')).toContainText('0/2 svarat');
    const answer = (await read(second, 'lobbies', code)).game.questions[0].correctAnswer;
    await second
      .locator('.choices-grid')
      .getByRole('button', { name: answer, exact: true })
      .click();
    await expect(third.locator('.answered-badge')).toContainText('1/2 svarat');
    await third.locator('.choices-grid').getByRole('button', { name: answer, exact: true }).click();
    await expect(third.locator('.round-end-banner')).toBeVisible();
    await expect(second.locator('.round-badge')).toHaveText('Fråga 2 / 10');
    await expect(second.locator('.answered-badge')).toContainText('0/2 svarat');
  } finally {
    await second.close();
    await third.close();
  }
});

test('final round timeout records a draw for both players, including legacy profiles', async ({
  page,
  browser,
}) => {
  const guest = await browser.newPage();
  try {
    const hostUid = await login(page);
    const guestUid = await login(guest);
    const code = await create(page);
    await join(guest, code);
    await page.getByRole('button', { name: 'Starta matchen!' }).click();
    await expect(guest.locator('.round-badge')).toBeVisible();
    await page.evaluate(
      async ({ code, hostUid }) => {
        const { db } = await import('/src/cloud.js');
        const { doc, runTransaction, deleteField } = window.multiplayerTestFirestore;
        await runTransaction(db, async (tx) => {
          const ref = doc(db, 'lobbies', code);
          const snap = await tx.get(ref);
          tx.update(ref, {
            game: { ...snap.data().game, currentRoundIndex: 9, roundStartTime: Date.now() - 61000 },
          });
          tx.update(doc(db, 'leaderboard', hostUid), { lastMatchId: deleteField() });
        });
      },
      { code, hostUid },
    );
    await expect(page.locator('.result-card h1')).toContainText('Oavgjort');
    await expect(guest.locator('.result-card h1')).toContainText('Oavgjort');
    for (const uid of [hostUid, guestUid]) {
      expect(await read(page, 'leaderboard', uid)).toMatchObject({
        elo: 1200,
        draws: 1,
        matchesPlayed: 1,
      });
    }
  } finally {
    await guest.close();
  }
});

test('stale rooms cannot hide a fresh room and rooms expire without a new snapshot', async ({
  page,
}) => {
  const uid = await login(page);
  const now = Date.now();
  const liveName = `Live-${uid}`;
  const ids = Array.from({ length: 21 }, (_, i) => `000-${uid}-${i}`).concat(`zz-${uid}`);
  try {
    await page.evaluate(
      async ({ uid, now, liveName, ids }) => {
        const { db } = await import('/src/cloud.js');
        const { doc, writeBatch } = window.multiplayerTestFirestore;
        const batch = writeBatch(db);
        ids.forEach((id, i) =>
          batch.set(doc(db, 'lobbies', id), {
            id,
            status: 'waiting',
            category: 'particles',
            guest: null,
            game: null,
            host: { uid, displayName: i === 21 ? liveName : 'Övergivet', elo: 1200 },
            createdAt: now,
            heartbeat: i === 21 ? now : now - 60000,
          }),
        );
        await batch.commit();
      },
      { uid, now, liveName, ids },
    );
    await expect(page.locator('.lobby-item').filter({ hasText: liveName })).toBeVisible();
    await page.clock.setFixedTime(now + 60000);
    await expect(page.locator('.lobby-item').filter({ hasText: liveName })).toHaveCount(0);
  } finally {
    await page.evaluate(async (ids) => {
      const { db } = await import('/src/cloud.js');
      const { doc, writeBatch } = window.multiplayerTestFirestore;
      const batch = writeBatch(db);
      ids.forEach((id) => batch.delete(doc(db, 'lobbies', id)));
      await batch.commit();
    }, ids);
  }
});

test('leaving a live match records a forfeit, and leaving a waiting room removes it', async ({
  page,
  browser,
}) => {
  const guest = await browser.newPage();
  try {
    const hostUid = await login(page);
    const guestUid = await login(guest);
    const abandoned = await create(page);
    await page
      .getByRole('button', { name: 'Plugga', exact: true })
      .filter({ visible: true })
      .click();
    await expect.poll(() => read(page, 'lobbies', abandoned)).toBeNull();
    await arena(page);
    const code = await create(page);
    await join(guest, code);
    await page.getByRole('button', { name: 'Starta matchen!' }).click();
    await expect(guest.locator('.round-badge')).toBeVisible();
    await page
      .getByRole('button', { name: 'Plugga', exact: true })
      .filter({ visible: true })
      .click();
    await expect(guest.locator('.result-card h1')).toContainText('Seger');
    expect(await read(guest, 'leaderboard', hostUid)).toMatchObject({
      elo: 1184,
      losses: 1,
      matchesPlayed: 1,
    });
    expect(await read(guest, 'leaderboard', guestUid)).toMatchObject({
      elo: 1216,
      wins: 1,
      matchesPlayed: 1,
    });
  } finally {
    await guest.close();
  }
});

for (const input of ['mouse', 'keyboard', 'touch']) {
  test(`first answer stays locked during delayed delivery (${input})`, async ({
    page,
    browser,
  }, testInfo) => {
    const guest = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    guest.on('pageerror', (error) => errors.push(error.message));
    for (const client of [page, guest]) {
      client.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
    }
    try {
      const uid = await login(page);
      await expect(page).toHaveTitle('TentaPlugg · Japanska');
      await expect(page).toHaveURL('http://127.0.0.1:5175/multiplayer');
      await expect(page.locator('vite-error-overlay')).toHaveCount(0);
      await login(guest);
      const code = await create(page);
      await join(guest, code);
      await page.getByRole('button', { name: 'Starta matchen!' }).click();
      await expect(page.locator('.choices-grid button').first()).toBeEnabled();
      const lobby = await read(guest, 'lobbies', code);
      const question = lobby.game.questions[0];
      const correct = page
        .locator('.choices-grid')
        .getByRole('button', { name: question.correctAnswer, exact: true });
      const wrong = page.locator('.choices-grid').getByRole('button', {
        name: question.choices.find((c) => c !== question.correctAnswer),
        exact: true,
      });
      let delayed = false;
      await page.route('**/documents:batchGet**', async (route) => {
        if (!delayed) {
          delayed = true;
          await new Promise((resolve) => setTimeout(resolve, 2500));
        }
        await route.continue();
      });
      if (input === 'keyboard') {
        await correct.focus();
        await page.keyboard.press('Enter');
        await wrong.press('Enter');
      } else if (input === 'touch' && testInfo.project.name === 'webkit-mobile') {
        await correct.tap();
        const box = await wrong.boundingBox();
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      } else {
        await correct.dblclick();
        // Dispatch also exercises a queued event whose handler predates the render.
        await wrong.dispatchEvent('click');
      }
      await expect(page.locator('.answer-delivery-status')).toContainText('Skickar svar…');
      expect(await page.locator('.choices-grid button:enabled').count()).toBe(0);
      expect(await page.locator('.btn-correct, .btn-wrong, .choice-badge').count()).toBe(0);
      expect((await read(guest, 'lobbies', code)).game.answers[0]?.[uid]).toBeUndefined();
      if (input === 'mouse')
        await page.screenshot({ path: testInfo.outputPath('answer-sending.png') });
      await expect(page.locator('.answer-delivery-status')).toContainText('Svar mottaget.');
      expect(delayed).toBe(true);
      const saved = await read(guest, 'lobbies', code);
      expect(saved.game.answers[0][uid]).toMatchObject({
        answer: question.correctAnswer,
        isCorrect: true,
      });
      expect(saved.game.answers[0][uid].attemptId).toBeTruthy();
      expect(saved.game.scores[uid]).toBeGreaterThan(0);
      await expect(page.locator('.btn-correct .choice-text')).toHaveText(question.correctAnswer);
      expect(errors).toEqual([]);
    } finally {
      await page.unrouteAll({ behavior: 'wait' });
      await guest.close();
    }
  });
}

test('failed delivery retries only the locked choice', async ({ page, browser }) => {
  const guest = await browser.newPage();
  try {
    const uid = await login(page);
    await login(guest);
    const code = await create(page);
    await join(guest, code);
    await page.getByRole('button', { name: 'Starta matchen!' }).click();
    await expect(page.locator('.choices-grid button').first()).toBeEnabled();
    const question = (await read(guest, 'lobbies', code)).game.questions[0];
    await page.route('**/documents:batchGet**', (route) =>
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 403, status: 'PERMISSION_DENIED', message: 'Injected delivery failure' },
        }),
      }),
    );
    await page
      .locator('.choices-grid')
      .getByRole('button', { name: question.correctAnswer, exact: true })
      .click();
    await expect(page.locator('.answer-delivery-status')).toContainText(
      'Kunde inte bekräfta svaret',
    );
    expect(await page.locator('.choices-grid button:enabled').count()).toBe(0);
    expect(await page.locator('.btn-correct, .btn-wrong').count()).toBe(0);
    await page.unrouteAll({ behavior: 'wait' });
    await page.getByRole('button', { name: 'Skicka samma svar igen' }).dblclick();
    await expect(page.locator('.answer-delivery-status')).toContainText('Svar mottaget.');
    expect((await read(guest, 'lobbies', code)).game.answers[0][uid].answer).toBe(
      question.correctAnswer,
    );
  } finally {
    await page.unrouteAll({ behavior: 'wait' });
    await guest.close();
  }
});

test('late delivery result cannot lock the next round or a reset view', async ({
  page,
  browser,
}) => {
  const guest = await browser.newPage();
  try {
    await login(page);
    await login(guest);
    const code = await create(page);
    await join(guest, code);
    await page.getByRole('button', { name: 'Starta matchen!' }).click();
    await expect(page.locator('.choices-grid button').first()).toBeEnabled();
    let release;
    let intercepted;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const arrived = new Promise((resolve) => {
      intercepted = resolve;
    });
    await page.route('**/documents:batchGet**', async (route) => {
      intercepted();
      await gate;
      await route.continue();
    });
    await page.locator('.choices-grid button').first().click();
    await arrived;
    await guest.evaluate(async (code) => {
      const { db } = await import('/src/cloud.js');
      const { getMultiplayerNow } = await import('/src/multiplayer.js');
      const { doc, updateDoc } = window.multiplayerTestFirestore;
      await updateDoc(doc(db, 'lobbies', code), {
        'game.currentRoundIndex': 1,
        'game.roundStartTime': getMultiplayerNow(),
      });
    }, code);
    await expect(page.locator('.round-badge')).toHaveText('Fråga 2 / 10');
    release();
    await page.unrouteAll({ behavior: 'wait' });
    await expect(page.locator('.choices-grid button').first()).toBeEnabled();
    await expect(page.locator('.answer-delivery-status')).toHaveCount(0);
    // Reset while the next request is pending; its response must not restore arena feedback.
    const resetGate = new Promise((resolve) => {
      release = resolve;
    });
    const resetArrived = new Promise((resolve) => {
      intercepted = resolve;
    });
    await page.route('**/documents:batchGet**', async (route) => {
      intercepted();
      await resetGate;
      await route.continue();
    });
    await page.locator('.choices-grid button').first().click();
    await resetArrived;
    await page.evaluate(async () => {
      const { resetMultiplayerView } = await import('/src/views/multiplayer.js');
      await resetMultiplayerView();
    });
    release();
    await page.unrouteAll({ behavior: 'wait' });
    await arena(page);
    await expect(page.locator('.create-lobby-card')).toBeVisible();
    await expect(page.locator('.answer-delivery-status')).toHaveCount(0);
  } finally {
    await page.unrouteAll({ behavior: 'wait' });
    await guest.close();
  }
});

test('client with 6s delayed clock samples shows resync banner and retry, and becomes ready only when quality restored', async ({
  page,
  browser,
}) => {
  const guest = await browser.newPage();
  try {
    await login(page);
    await login(guest);
    const code = await create(page);

    // Inject 6-second delay on clock sample commit receipt for guest
    let delayClock = true;
    await guest.route('**', async (route) => {
      const url = route.request().url().toLowerCase();
      const data = (route.request().postData() || '').toLowerCase();
      if (
        delayClock &&
        data.includes('multiplayerclock') &&
        url.includes('commit') &&
        !data.includes('delete')
      ) {
        await new Promise((resolve) => setTimeout(resolve, 6000));
      }
      await route.continue();
    });

    await join(guest, code, { timeout: 35000 });

    // Guest should show clock synchronization banner and uncertain/syncing status
    await expect(guest.locator('.clock-sync-card')).toBeVisible();
    await expect(guest.locator('.sync-role')).toHaveText('Omsynkroniserar…');

    // Host sees guest as not ready; start button is disabled
    await expect(page.locator('.sync-role')).toHaveText('Omsynkroniserar…');
    await expect(page.locator('.start-btn')).toBeDisabled();

    // Now restore connection quality for guest and retry
    delayClock = false;
    await guest.unrouteAll({ behavior: 'wait' });
    await guest.locator('.resync-btn').click();

    // Guest is now ready!
    await expect(guest.locator('.clock-sync-card')).toHaveCount(0);
    await expect(guest.locator('.waiting-role').filter({ hasText: 'Redo' })).toBeVisible();

    // Host sees guest as Redo and start button is enabled
    await expect(page.locator('.start-btn')).toBeEnabled();

    // Host starts match; game begins normally
    await page.locator('.start-btn').click();
    await expect(page.locator('.arena-countdown-overlay')).toBeVisible();
    await expect(guest.locator('.arena-countdown-overlay')).toBeVisible();
  } finally {
    await guest.unrouteAll({ behavior: 'wait' });
    await guest.close();
  }
});

test('tab visibility return renews clock calibration', async ({ page, browser }) => {
  const guest = await browser.newPage();
  try {
    await login(page);
    await login(guest);
    const code = await create(page);
    await join(guest, code);

    // Guest simulates tab hidden then visible
    await guest.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await guest.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Verification that guest re-calibrates and is visible and ready
    await expect(guest.locator('.waiting-role').filter({ hasText: 'Redo' })).toBeVisible();
    await expect(page.locator('.start-btn')).toBeEnabled();
  } finally {
    await guest.close();
  }
});
