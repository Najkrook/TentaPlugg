import { test, expect } from '@playwright/test';
import path from 'node:path';
import os from 'node:os';

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

// Expected optimistic commit conflicts are checked by response body, not hidden
// with a broad console filter. All other network, page and console errors fail.
function trackBrowserHealth(clients) {
  const errors = [];
  const networkErrors = [];
  for (const client of clients) {
    client.on('pageerror', (error) => errors.push({ text: error.message, url: '' }));
    client.on('console', (message) => {
      if (message.type() === 'error')
        errors.push({ text: message.text(), url: message.location().url });
    });
    client.on('response', (response) => {
      if (response.status() >= 400)
        networkErrors.push(
          (async () => ({
            client,
            commit: response.request().postDataJSON(),
            url: response.url(),
            status: response.status(),
            body: await response.json().catch(() => null),
          }))(),
        );
    });
  }
  return async () => {
    const conflicts = await Promise.all(networkErrors);
    for (const failure of conflicts) {
      expect(failure.url).toContain('127.0.0.1:8080/');
      expect(failure.url).toContain('documents:commit');
      if (failure.status === 409) {
        // A receipt appeared after reduction read that document as missing.
        expect(failure.body?.error.status).toBe('ALREADY_EXISTS');
        expect(failure.body.error.message).toMatch(/entity already exists:.*\/answers\//);
      } else if (failure.status === 403) {
        // Firestore can evaluate startup rules against a winning transition
        // before reporting the losing optimistic transaction's precondition.
        // Accept only a startup write whose actual durable version has won.
        expect(failure.body?.error.status).toBe('PERMISSION_DENIED');
        const write = failure.commit?.writes?.find((w) => w.update?.fields?.start);
        expect(write?.currentDocument?.updateTime).toBeTruthy();
        expect(write.update.name).toMatch(/\/lobbies\/[^/]+$/);
        const proposed = write.update.fields.start.mapValue.fields;
        expect(['countdown', 'confirmed']).toContain(proposed.phase.stringValue);
        const lobby = await read(failure.client, 'lobbies', write.update.name.split('/').at(-1));
        expect(lobby.start.version).toBe(Number(proposed.version.integerValue));
        expect(lobby.start.phase).toBe('confirmed');
        expect(lobby.gameRevision).toBeGreaterThanOrEqual(
          Number(write.update.fields.gameRevision.integerValue),
        );
        expect(Object.keys(lobby.start.entered).sort()).toEqual(
          Object.keys(lobby.start.sessions).sort(),
        );
      } else {
        expect(failure.status).toBe(400);
        expect(failure.body?.error.status).toBe('FAILED_PRECONDITION');
        expect(failure.body.error.message).toContain('does not match the required base version');
      }
    }
    expect(
      errors.filter(
        (error) =>
          !(
            /Failed to load resource:.*(400|403|409)/.test(error.text) &&
            conflicts.some((conflict) => conflict.url === error.url)
          ),
      ),
    ).toEqual([]);
  };
}

test('receipt contention: five fresh ten-client matches retain ten real simultaneous answers', async ({
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Heavy contention is covered in Chromium');
  test.setTimeout(240000);
  for (let run = 0; run < 5; run++) {
    const clients = await Promise.all(Array.from({ length: 10 }, () => browser.newPage()));
    const assertHealthy = trackBrowserHealth(clients);
    try {
      const uids = [];
      for (const client of clients) uids.push(await login(client));
      const code = await create(clients[0]);
      for (const client of clients.slice(1)) await join(client, code);
      await Promise.all(clients.map(observeFirstEnabled));
      await clients[0].getByRole('button', { name: 'Starta matchen!' }).evaluate((button) => {
        button.click();
        button.click();
      });
      await Promise.all(
        clients.map((client) =>
          expect(client.locator('.choices-grid button').first()).toBeEnabled({ timeout: 35000 }),
        ),
      );
      const startTimes = await Promise.all(
        clients.map((client) => client.evaluate(() => window.firstEnabledAt)),
      );
      expect(Math.max(...startTimes) - Math.min(...startTimes)).toBeLessThanOrEqual(500);
      const startingLobby = await read(clients[0], 'lobbies', code);
      expect(startingLobby.start.version).toBe(1);
      expect(startingLobby.start.phase).toBe('confirmed');
      const question = startingLobby.game.questions[0];
      const results = await Promise.all(
        clients.map((client, i) =>
          client.evaluate(
            async ({ code, uid, answer }) => {
              const { submitPlayerAnswer } = await import('/src/multiplayer.js');
              return submitPlayerAnswer(code, uid, 0, answer);
            },
            { code, uid: uids[i], answer: question.correctAnswer },
          ),
        ),
      );
      expect(results.every((r) => r.status === 'accepted')).toBe(true);
      const saved = await read(clients[0], 'lobbies', code);
      const raw = await clients[0].evaluate(
        async ({ code, uids }) => {
          const { db } = await import('/src/cloud.js');
          const { doc, getDoc } = window.multiplayerTestFirestore;
          return Promise.all(
            uids.map(async (uid) => {
              const receipt = (
                await getDoc(doc(db, 'lobbies', code, 'answers', `0_${uid}`))
              ).data();
              return { ...receipt, receivedAtMs: receipt.receivedAt.toMillis() };
            }),
          );
        },
        { code, uids },
      );
      const first = Math.min(...raw.map((r) => r.receivedAtMs));
      expect(saved.game.firstAnswerAt).toBe(first);
      expect(saved.game.roundDeadline).toBe(first + 8000);
      for (const receipt of raw) {
        const answer = saved.game.answers[0][receipt.uid];
        expect(receipt.answer).toBe(question.correctAnswer);
        expect(receipt.attemptId).toBeTruthy();
        expect(answer.timedOut).toBeUndefined();
        expect(answer.isCorrect).toBe(true);
        expect(answer.pointsAwarded).toBe(
          Math.round(1000 * Math.max(0.2, 1 - (receipt.receivedAtMs - first) / 8000)),
        );
      }
      await assertHealthy();
    } finally {
      await Promise.all(clients.map((client) => client.close()));
    }
  }
});

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
      const { doc, updateDoc, increment, serverTimestamp } = window.multiplayerTestFirestore;
      await updateDoc(doc(db, 'lobbies', code), {
        gameRevision: increment(1),
        gameUpdatedAt: serverTimestamp(),
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
    await expect(third.locator('.choices-grid button').first()).toBeEnabled({ timeout: 35000 });
    await page.evaluate(
      async ({ code, ids }) => {
        const { db } = await import('/src/cloud.js');
        const { doc, updateDoc, increment, serverTimestamp } = window.multiplayerTestFirestore;
        await updateDoc(doc(db, 'lobbies', code), {
          gameRevision: increment(1),
          gameUpdatedAt: serverTimestamp(),
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
    await expect(third.locator('.choices-grid button').first()).toBeEnabled({ timeout: 35000 });
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
    await expect(guest.locator('.choices-grid button').first()).toBeEnabled({ timeout: 35000 });
    await page.evaluate(
      async ({ code, hostUid }) => {
        const { db } = await import('/src/cloud.js');
        const { doc, runTransaction, deleteField, serverTimestamp } =
          window.multiplayerTestFirestore;
        await runTransaction(db, async (tx) => {
          const ref = doc(db, 'lobbies', code);
          const snap = await tx.get(ref);
          tx.update(ref, {
            gameRevision: snap.data().gameRevision + 1,
            gameUpdatedAt: serverTimestamp(),
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
            protocolVersion: 3,
            start: { version: 0, phase: 'waiting' },
            gameRevision: 0,
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
    await expect(guest.locator('.choices-grid button').first()).toBeEnabled({ timeout: 35000 });
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
    const assertHealthy = trackBrowserHealth([page, guest]);
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
      await assertHealthy();
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
      const { doc, updateDoc, increment, serverTimestamp } = window.multiplayerTestFirestore;
      await updateDoc(doc(db, 'lobbies', code), {
        gameRevision: increment(1),
        gameUpdatedAt: serverTimestamp(),
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

// Move only the server-stamped presence fixture; production expiry and forfeit
// operations still run against the emulator with the real security rules.
async function expirePresence(request, code, uid) {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  const response = await request.patch(
    `http://${host}/v1/projects/demo-tentaplugg/databases/(default)/documents/lobbies/${code}/presence/${uid}?updateMask.fieldPaths=seenAt`,
    {
      headers: { Authorization: 'Bearer owner' },
      data: { fields: { seenAt: { timestampValue: new Date(Date.now() - 46000).toISOString() } } },
    },
  );
  expect(response.ok()).toBeTruthy();
}

test('presence: abrupt guest closure removes readiness and prevents a solo start', async ({
  page,
  browser,
  request,
}, testInfo) => {
  const guest = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await login(page);
    const uid = await login(guest);
    const code = await create(page);
    await join(guest, code);
    await expect(page.getByRole('button', { name: 'Starta matchen!' })).toBeEnabled();
    await guest.close();
    expect((await read(page, 'lobbies', code)).players[uid]).toBeTruthy();
    await expirePresence(request, code, uid);
    await expect(page.locator('.waiting-counter-badge')).toContainText('1 / 10');
    await expect(page.locator('.waiting-role').filter({ hasText: 'Frånkopplad' })).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Starta matchen!' })).toBeDisabled();
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);
    expect(await page.title()).toMatch(/TentaPlugg/i);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: path.join(os.tmpdir(), `tentaplugg-presence-${testInfo.project.name}.png`),
    });
    expect(errors).toEqual([]);
  } finally {
    if (!guest.isClosed()) await guest.close();
  }
});

test('presence: interrupted match keeps its deadline, then forfeits the absent player once', async ({
  page,
  browser,
  request,
}) => {
  const guest = await browser.newPage();
  try {
    const hostUid = await login(page);
    const uid = await login(guest);
    const code = await create(page);
    await join(guest, code);
    await page.getByRole('button', { name: 'Starta matchen!' }).click();
    await expect(guest.locator('.choices-grid button').first()).toBeEnabled({ timeout: 35000 });
    const before = await read(page, 'lobbies', code);
    // Known local network loss is shown immediately; short recovery is not a forfeit.
    await guest.context().setOffline(true);
    await expect(guest.getByRole('status').filter({ hasText: 'Återanslut inom' })).toBeVisible();
    await guest.context().setOffline(false);
    await expect(guest.getByRole('status').filter({ hasText: 'Återanslut inom' })).toHaveCount(0);
    expect((await read(page, 'lobbies', code)).game.roundStartTime).toBe(
      before.game.roundStartTime,
    );
    await guest.close();
    expect((await read(page, 'lobbies', code)).status).toBe('playing');
    await expirePresence(request, code, uid);
    await expect(page.locator('.result-card h1')).toContainText('Seger');
    expect(await read(page, 'leaderboard', uid)).toMatchObject({ losses: 1, matchesPlayed: 1 });
    expect(await read(page, 'leaderboard', hostUid)).toMatchObject({ wins: 1, matchesPlayed: 1 });
  } finally {
    if (!guest.isClosed()) await guest.close();
  }
});

test('presence: stale host closes the waiting view without unregistering a newer guest session', async ({
  page,
  browser,
  request,
}) => {
  const guest = await browser.newPage();
  try {
    const hostUid = await login(page);
    const uid = await login(guest);
    const code = await create(page);
    await join(guest, code);
    await guest.evaluate(
      async ({ code, uid }) => {
        const { connectPlayerPresence } = await import('/src/multiplayer.js');
        await connectPlayerPresence(code, uid);
      },
      { code, uid },
    );
    await page.close();
    await expirePresence(request, code, hostUid);
    await expect(guest.locator('.room-code-tag')).toHaveCount(0);
    await expect(guest.locator('.feedback-msg')).toContainText('Värden är inte längre ansluten');
    expect((await read(guest, 'lobbies', code)).players[uid]).toBeTruthy();
  } finally {
    await guest.close();
  }
});

// Delay only subscription delivery; Firestore writes, rules and transaction
// responses remain real. No view callback or saved game state is replaced.
async function delayLobbySubscription(page) {
  await page.route('**/src/multiplayer-transport.js', async (route) => {
    const response = await route.fetch();
    const source = await response.text();
    await route.fulfill({
      response,
      body: source.replace(
        'receive, onError);',
        `snapshot => {
        const delay = window.startDeliveryDelay;
        const data = snapshot.data();
        if (delay && (!delay.phase || data?.start?.phase === delay.phase)) {
          window.delayedStartDeliveries = (window.delayedStartDeliveries || 0) + 1;
          setTimeout(() => { window.releasedStartDeliveries = (window.releasedStartDeliveries || 0) + 1; receive(snapshot); }, delay.ms);
        } else receive(snapshot);
      }, onError);`,
      ),
    });
  });
}

async function observeFirstEnabled(page) {
  await page.evaluate(() => {
    window.firstEnabledAt = null;
    const check = () => {
      if (window.firstEnabledAt == null && document.querySelector('.choices-grid button:enabled'))
        window.firstEnabledAt = Date.now();
    };
    const observer = new MutationObserver(check);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true });
  });
}

// Delay real finalization writes, while receipts and clock/presence writes
// continue to reach the emulator unchanged.
async function delayRoundEndCommits(page, milliseconds) {
  let delayed = 0;
  await page.route(/\/documents:commit(?:\?|$)/, async (route) => {
    const writes = route.request().postDataJSON()?.writes || [];
    if (
      writes.some(
        (write) =>
          write.update?.fields?.game?.mapValue?.fields?.status?.stringValue === 'round_end',
      )
    ) {
      delayed++;
      await new Promise((resolve) => setTimeout(resolve, milliseconds));
    }
    await route.continue();
  });
  return () => delayed;
}

async function observeRoundFeedback(page) {
  await page.evaluate(() => {
    window.roundFeedback = [];
    const observer = new MutationObserver(() => {
      const text = document.querySelector('.round-end-banner')?.textContent;
      if (text) window.roundFeedback.push(text);
    });
    observer.observe(document.querySelector('main'), {
      subtree: true,
      childList: true,
      characterData: true,
    });
  });
}

test('visible deadline: no answers shows sixty seconds, pending result, then one timeout each', async ({
  page,
  browser,
}, testInfo) => {
  test.setTimeout(110000);
  const guest = await browser.newPage();
  const healthy = trackBrowserHealth([page, guest]);
  try {
    const hostUid = await login(page);
    const guestUid = await login(guest);
    expect(new URL(page.url()).origin).toBe('http://127.0.0.1:5175');
    await expect(page).toHaveTitle(/TentaPlugg/i);
    const code = await create(page);
    await join(guest, code);
    await page.getByRole('button', { name: 'Starta matchen!' }).click();
    await expect(page.locator('.arena-countdown-overlay')).toBeVisible();
    await expect(page.getByRole('timer')).toHaveText(/Inväntar matchstart/);
    await expect(page.locator('.choices-grid button').first()).toBeEnabled();
    await expect(page.getByRole('timer')).toHaveText(/(60|59)s kvar/);
    await expect(page.locator('.round-time-status')).toContainText('60 sekunder');
    await expect(page.getByRole('timer')).toHaveAttribute('aria-live', 'off');
    await observeRoundFeedback(page);
    await page.screenshot({
      path: path.join(os.tmpdir(), `deadline-initial-${testInfo.project.name}.png`),
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const delayed = await delayRoundEndCommits(page, 3000);
    await delayRoundEndCommits(guest, 3000);
    await expect(page.getByRole('timer')).toHaveText(/\b0s kvar/, { timeout: 65000 });
    await expect(page.locator('.round-time-status')).toHaveText(
      'Svarstiden är slut. Hämtar resultat…',
    );
    await expect(page.locator('.choices-grid button:enabled')).toHaveCount(0);
    await expect(page.locator('.round-end-banner')).toHaveCount(0);
    expect(delayed()).toBeGreaterThan(0);
    expect(await page.locator('.timer-fill').evaluate((el) => el.style.width)).toBe('0%');
    // A delayed commit may consume the result pause before delivery. Record
    // every rendered result rather than sampling past a short banner.
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            window.roundFeedback.some((text) => text.includes('Tiden ute! (-50p)')),
          ),
        { timeout: 15000 },
      )
      .toBe(true);
    const saved = await read(page, 'lobbies', code);
    for (const uid of [hostUid, guestUid]) {
      expect(saved.game.answers[0][uid]).toMatchObject({ timedOut: true, pointsAwarded: -50 });
      expect(saved.game.scores[uid]).toBe(-50);
    }
    await expect(page.locator('.round-badge')).toHaveText('Fråga 2 / 10');
    expect((await read(page, 'lobbies', code)).game.scores).toEqual(saved.game.scores);
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);
    await healthy();
  } finally {
    await guest.unrouteAll({ behavior: 'wait' });
    await guest.close();
  }
});

test('visible deadline: late first receipt opens eight seconds and delayed reduction never shows false timeout', async ({
  page,
  browser,
}, testInfo) => {
  test.setTimeout(115000);
  const guest = await browser.newPage();
  const healthy = trackBrowserHealth([page, guest]);
  try {
    await delayLobbySubscription(page);
    const hostUid = await login(page);
    const guestUid = await login(guest);
    const code = await create(page);
    await join(guest, code);
    await page.getByRole('button', { name: 'Starta matchen!' }).click();
    await expect(page.locator('.choices-grid button').first()).toBeEnabled();
    const initial = await read(page, 'lobbies', code);
    const answer = initial.game.questions[0].correctAnswer;
    await expect(guest.getByRole('timer')).toHaveText(/\b2s kvar/, { timeout: 65000 });
    // Host receives the real first-answer snapshot one second late.
    await page.evaluate(() => {
      window.startDeliveryDelay = { ms: 1000 };
      window.deadlineSamples = [];
      window.deadlineObserver = new MutationObserver(() => {
        window.deadlineSamples.push(document.querySelector('[role="timer"]')?.textContent.trim());
      });
      window.deadlineObserver.observe(document.querySelector('.arena-header'), {
        subtree: true,
        childList: true,
        characterData: true,
      });
    });
    await guest.locator('.choice-btn').filter({ hasText: answer }).click();
    await expect(guest.getByRole('timer')).toHaveText(/\b8s kvar/);
    await expect(page.locator('.round-time-status')).toContainText('8 sekunder');
    const received = await read(page, 'lobbies', code);
    expect(received.game.firstAnswerAt - initial.game.roundStartTime).toBeGreaterThan(57000);
    expect(received.game.roundDeadline - received.game.firstAnswerAt).toBe(8000);
    await expect(page.getByRole('timer')).toHaveText(/\b5s kvar/);
    const samples = await page.evaluate(() => {
      window.deadlineObserver.disconnect();
      return window.deadlineSamples;
    });
    expect(samples.some((text) => /(^|\s)0s kvar|−\d|-[0-9]/.test(text))).toBe(false);
    await expect(page.locator('.choices-grid button').first()).toBeEnabled();
    expect(
      await page.locator('.timer-fill').evaluate((el) => parseFloat(el.style.width)),
    ).toBeGreaterThan(40);
    await page.screenshot({
      path: path.join(os.tmpdir(), `deadline-extended-${testInfo.project.name}.png`),
    });
    await delayRoundEndCommits(page, 8000);
    await delayRoundEndCommits(guest, 8000);
    await observeRoundFeedback(page);
    await page.locator('.choice-btn').filter({ hasText: answer }).click();
    await expect(page.locator('.answer-delivery-status')).toContainText('Skickar svar');
    await expect(page.getByRole('timer')).toHaveText(/\b0s kvar/, { timeout: 8000 });
    await expect(page.locator('.round-time-status')).toContainText('Hämtar resultat');
    await expect(page.locator('.round-end-banner')).toHaveCount(0);
    await expect
      .poll(
        () => page.evaluate(() => window.roundFeedback.some((text) => text.includes('Rätt svar!'))),
        { timeout: 15000 },
      )
      .toBe(true);
    expect(
      await page.evaluate(() => window.roundFeedback.some((text) => text.includes('Tiden ute!'))),
    ).toBe(false);
    const saved = await read(page, 'lobbies', code);
    for (const uid of [hostUid, guestUid]) {
      expect(saved.game.answers[0][uid].isCorrect).toBe(true);
      expect(saved.game.answers[0][uid].timedOut).toBeUndefined();
    }
    expect(saved.game.answers[0][hostUid].timestamp).toBeGreaterThan(
      initial.game.roundStartTime + 60000,
    );
    await healthy();
  } finally {
    await guest.unrouteAll({ behavior: 'wait' });
    await guest.close();
  }
});

test('visible deadline: uncertain clock hides exact time and preserves a confirmed answer', async ({
  page,
  browser,
}, testInfo) => {
  const guest = await browser.newPage();
  const healthy = trackBrowserHealth([page, guest]);
  try {
    await login(page);
    await login(guest);
    const code = await create(page);
    await join(guest, code);
    await page.getByRole('button', { name: 'Starta matchen!' }).click();
    await expect(page.locator('.choices-grid button').first()).toBeEnabled();
    const answer = (await read(page, 'lobbies', code)).game.questions[0].correctAnswer;
    await page.locator('.choice-btn').filter({ hasText: answer }).click();
    await expect(page.locator('.answer-delivery-status')).toHaveText('Svar mottaget.');
    await page.evaluate(async () => {
      const { db } = await import('/src/cloud.js');
      const { invalidateMultiplayerClock } = await import('/src/multiplayer.js');
      invalidateMultiplayerClock(db, 'test-uncertain');
    });
    await expect(page.getByRole('timer')).toHaveText(/Omsynkroniserar/);
    await expect(page.getByRole('timer')).not.toHaveText(/\d+s kvar/);
    await expect(page.locator('.answer-delivery-status')).toHaveText('Svar mottaget.');
    await expect(page.locator('.btn-correct')).toBeVisible();
    await expect(page.locator('.choices-grid button:enabled')).toHaveCount(0);
    await page.screenshot({
      path: path.join(os.tmpdir(), `deadline-uncertain-${testInfo.project.name}.png`),
    });
    await healthy();
  } finally {
    await guest.close();
  }
});

test('startup: host subscription delayed 13s still starts locally and stale snapshots cannot rewind', async ({
  page,
  browser,
}) => {
  const guest = await browser.newPage();
  const healthy = trackBrowserHealth([page, guest]);
  try {
    await delayLobbySubscription(page);
    await login(page);
    await login(guest);
    const code = await create(page);
    await join(guest, code);
    await expect(page.getByRole('button', { name: 'Starta matchen!' })).toBeEnabled();
    await Promise.all([observeFirstEnabled(page), observeFirstEnabled(guest)]);
    await page.evaluate(() => {
      window.startDeliveryDelay = { ms: 13000 };
    });
    await page.getByRole('button', { name: 'Starta matchen!' }).click();
    await expect(page.locator('.choices-grid button').first()).toBeEnabled({ timeout: 15000 });
    await expect(guest.locator('.choices-grid button').first()).toBeEnabled();
    const times = await Promise.all(
      [page, guest].map((p) => p.evaluate(() => window.firstEnabledAt)),
    );
    expect(Math.abs(times[0] - times[1])).toBeLessThanOrEqual(500);
    expect(await page.evaluate(() => window.delayedStartDeliveries)).toBeGreaterThan(0);
    expect((await read(guest, 'lobbies', code)).start.phase).toBe('confirmed');
    await expect
      .poll(() => page.evaluate(() => window.releasedStartDeliveries || 0), { timeout: 15000 })
      .toBeGreaterThan(0);
    await expect(page.locator('.round-badge')).toHaveText('Fråga 1 / 10');
    await expect(page.locator('.choices-grid button').first()).toBeEnabled();
    await page.screenshot({ path: path.join(os.tmpdir(), 'tentaplugg-start-host.png') });
    await healthy();
  } finally {
    await guest.close();
  }
});

test('startup: late guest schedule cancels without scores or ELO and permits a fresh version', async ({
  page,
  browser,
}) => {
  const guest = await browser.newPage();
  const healthy = trackBrowserHealth([page, guest]);
  let delayedNetwork = 0,
    releasedNetwork = 0;
  try {
    const uid = await login(page);
    await delayLobbySubscription(guest);
    const guestUid = await login(guest);
    const code = await create(page);
    await join(guest, code);
    await guest.evaluate(() => {
      window.startDeliveryDelay = { ms: 13000, phase: 'countdown' };
    });
    // The helper transaction is a second delivery path; delay that same server
    // state too, otherwise its confirmed response correctly bypasses the delay.
    await guest.route('**/documents:batchGet**', async (route) => {
      const response = await route.fetch();
      const body = await response.text();
      if (/"stringValue"\s*:\s*"countdown"/.test(body)) {
        delayedNetwork++;
        await new Promise((resolve) => setTimeout(resolve, 13000));
        releasedNetwork++;
      }
      await route.fulfill({ response, body });
    });
    await guest.route('**/documents:commit**', async (route) => {
      const response = await route.fetch();
      if ((route.request().postData() || '').includes('countdown')) {
        delayedNetwork++;
        await new Promise((resolve) => setTimeout(resolve, 13000));
        releasedNetwork++;
      }
      await route.fulfill({ response });
    });
    await page.getByRole('button', { name: 'Starta matchen!' }).click();
    await expect(
      page.getByText('Alla deltagare kunde inte förbereda starten i tid. Försök igen.'),
    ).toBeVisible({ timeout: 15000 });
    const cancelled = await read(page, 'lobbies', code);
    expect(cancelled.game).toBeNull();
    expect(cancelled.start.version).toBe(1);
    for (const id of [uid, guestUid])
      expect((await read(page, 'leaderboard', id)).matchesPlayed).toBe(0);
    await guest.unroute('**/documents:batchGet**');
    await guest.unroute('**/documents:commit**');
    await guest.evaluate(() => {
      window.startDeliveryDelay = null;
    });
    await page.getByRole('button', { name: 'Starta matchen!' }).click();
    await expect(guest.locator('.choices-grid button').first()).toBeEnabled({ timeout: 15000 });
    expect((await read(page, 'lobbies', code)).start.version).toBe(2);
    await expect
      .poll(
        async () =>
          releasedNetwork + (await guest.evaluate(() => window.releasedStartDeliveries || 0)),
        { timeout: 15000 },
      )
      .toBeGreaterThan(0);
    await expect(guest.locator('.choices-grid button').first()).toBeEnabled();
    await guest.locator('.choices-grid button').first().click();
    await expect(guest.locator('.answer-delivery-status')).toContainText('Svar mottaget.');
    expect(delayedNetwork).toBeGreaterThan(0);
    await healthy();
  } finally {
    await guest.close();
  }
});

test('startup: missing preparation times out within 30s and host can cancel and retry', async ({
  page,
  browser,
}) => {
  const guest = await browser.newPage();
  try {
    await login(page);
    await delayLobbySubscription(guest);
    await login(guest);
    const code = await create(page);
    await join(guest, code);
    await guest.evaluate(() => {
      window.startDeliveryDelay = { ms: 35000, phase: 'preparing' };
    });
    await page.getByRole('button', { name: 'Starta matchen!' }).click();
    await expect(page.getByRole('heading', { name: 'Förbereder matchen…' })).toBeVisible();
    await expect(page.getByText('1 / 2 deltagare', { exact: false })).toBeVisible();
    await page.screenshot({ path: path.join(os.tmpdir(), 'tentaplugg-start-preparing.png') });
    await page.getByRole('button', { name: 'Avbryt starten' }).click();
    await expect(page.getByText('Starten avbröts. Försök igen.')).toBeVisible();
    await page.getByRole('button', { name: 'Starta matchen!' }).click();
    await expect(
      page.getByText('Alla deltagare kunde inte förbereda starten i tid. Försök igen.'),
    ).toBeVisible({ timeout: 32000 });
    const data = await read(page, 'lobbies', code);
    expect(data.game).toBeNull();
    expect(data.start.version).toBe(2);
  } finally {
    await guest.close();
  }
});

test('startup: disconnected guest during preparation cancels without a match result', async ({
  page,
  browser,
  request,
}) => {
  const guest = await browser.newPage();
  const healthy = trackBrowserHealth([page, guest]);
  try {
    const hostUid = await login(page);
    await delayLobbySubscription(guest);
    const uid = await login(guest);
    const code = await create(page);
    await join(guest, code);
    await guest.evaluate(() => {
      window.startDeliveryDelay = { ms: 35000, phase: 'preparing' };
    });
    await page.getByRole('button', { name: 'Starta matchen!' }).click();
    await expect(page.getByRole('heading', { name: 'Förbereder matchen…' })).toBeVisible();
    await guest.close();
    await expirePresence(request, code, uid);
    await expect(
      page.getByText('Alla deltagare kunde inte förbereda starten i tid. Försök igen.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Starta matchen!' })).toBeDisabled();
    expect((await read(page, 'lobbies', code)).game).toBeNull();
    for (const id of [hostUid, uid])
      expect((await read(page, 'leaderboard', id)).matchesPlayed).toBe(0);
    expect(await page.title()).toMatch(/TentaPlugg/i);
    expect(page.url()).toContain('http://127.0.0.1:5175/');
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);
    await healthy();
  } finally {
    if (!guest.isClosed()) await guest.close();
  }
});
