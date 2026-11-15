/**
 * End-to-end API test against a running server + seeded database.
 *   npm run dev   (in another terminal)
 *   npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

const API = process.env.API_URL || 'http://localhost:4000/api';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(method, path, body, token) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { ...json, status: res.status };
}

const uname = `test_${Date.now().toString(36)}`;
let token;

test('register validates and creates a Local Resident', async () => {
  const bad = await call('POST', '/auth/register', { username: uname, email: `${uname}@example.com`, password: 'abc', confirmPassword: 'abc', role: 'local_resident' });
  assert.equal(bad.status, 400);
  const r = await call('POST', '/auth/register', { username: uname, email: `${uname}@example.com`, password: 'island123', confirmPassword: 'island123', role: 'local_resident' });
  assert.equal(r.status, 201, r.error);
  assert.equal(r.profile.role, 'local_resident');
  token = r.token;
  const dup = await call('POST', '/auth/register', { username: uname, email: `x${uname}@example.com`, password: 'island123', confirmPassword: 'island123', role: 'tourist' });
  assert.equal(dup.status, 409);
});

test('login works and wrong password is rejected', async () => {
  assert.equal((await call('POST', '/auth/login', { login: uname, password: 'wrong123' })).status, 401);
  const r = await call('POST', '/auth/login', { login: uname, password: 'island123' });
  assert.equal(r.status, 200);
  assert.equal((await call('GET', '/auth/me', null, r.token)).profile.username, uname);
});

test('Maintain Cloud 9 can only be completed after validated objectives', async () => {
  const { missions } = await call('GET', '/missions?spot=cloud9', null, token);
  const m = missions.find((x) => x.key === 'maintain_cloud9');
  assert.ok(m.recommended);
  assert.equal((await call('POST', `/missions/${m.id}/start`, null, token)).status, 201);
  assert.equal((await call('POST', `/missions/${m.id}/complete`, null, token)).status, 422);

  const before = (await call('GET', '/tourist-spots/cloud9')).spot.cleanliness;
  const trash = await call('GET', '/tourist-spots/cloud9/trash', null, token);
  assert.ok(trash.indices.length >= 15);
  for (const idx of trash.indices.slice(0, 15)) {
    const r = await call('POST', '/cleanup/collect', { spotId: 'cloud9', trashIndex: idx }, token);
    assert.equal(r.status, 200, r.error);
    await sleep(320);
  }
  const dupe = await call('POST', '/cleanup/collect', { spotId: 'cloud9', trashIndex: trash.indices[0] }, token);
  assert.equal(dupe.status, 409);
  assert.equal((await call('POST', '/cleanup/collect', { spotId: 'cloud9', trashIndex: 300 }, token)).status, 422);

  await call('POST', '/npcs/kuya_jun/talk', null, token);
  const acts = (await call('GET', '/activities?spot=cloud9')).activities;
  const repair = acts.find((a) => a.key === 'boardwalk_repair');
  assert.equal((await call('POST', `/activities/${repair.id}/complete`, { pointIndex: 9 }, token)).status, 422);
  for (let i = 0; i < 4; i++) await call('POST', `/activities/${repair.id}/complete`, { pointIndex: i }, token);

  const quiz = (await call('GET', '/quizzes/marine_basics')).quiz;
  assert.ok(!('answer' in quiz.questions[0]));
  const fail = await call('POST', '/quizzes/marine_basics/submit', { answers: quiz.questions.map(() => 3) }, token);
  assert.equal(fail.passed, false);
  const pass = await call('POST', '/quizzes/marine_basics/submit', { answers: [1, 1, 2, 2, 1] }, token);
  assert.equal(pass.passed, true);

  const done = await call('POST', `/missions/${m.id}/complete`, null, token);
  assert.equal(done.status, 200, done.error);
  assert.equal(done.rewards.coins, 500);
  assert.equal(done.rewards.badge.name, 'Cloud 9 Keeper');
  assert.ok(done.cleanliness > before);
  assert.equal((await call('POST', `/missions/${m.id}/start`, null, token)).status, 409);
});

test('surf scores are validated server-side', async () => {
  const cheat = await call('POST', '/surfing/submit-score', { spotId: 'cloud9', challenge: 'beginner', boardKey: 'board_foamie', score: 90000, duration: 5, carves: 1, waves: 1 }, token);
  assert.equal(cheat.status, 422);
  const notOwned = await call('POST', '/surfing/submit-score', { spotId: 'cloud9', challenge: 'beginner', boardKey: 'board_short', score: 600, duration: 9, carves: 1, waves: 1 }, token);
  assert.equal(notOwned.status, 403);
  const ok = await call('POST', '/surfing/submit-score', { spotId: 'cloud9', challenge: 'beginner', boardKey: 'board_foamie', score: 900, duration: 10, carves: 2, waves: 1 }, token);
  assert.equal(ok.status, 200, ok.error);
  assert.equal(ok.passed, true);
  assert.equal((await call('POST', '/surfing/submit-score', { spotId: 'naked', challenge: 'free', boardKey: 'board_foamie', score: 10, duration: 1, carves: 0, waves: 1 }, token)).status, 422);
});

test('shop enforces prices and destination for local products', async () => {
  assert.equal((await call('POST', '/shop/buy', { itemKey: 'local_grilled_fish' }, token)).status, 422);
  await call('POST', '/tourist-spots/daku/visit', null, token);
  const r = await call('POST', '/shop/buy', { itemKey: 'local_grilled_fish' }, token);
  assert.equal(r.status, 200, r.error);
  const eq = await call('PUT', '/players/profile', { appearance: { board: 'board_short' } }, token);
  assert.equal(eq.status, 403);
});

test('community progress and admin protection', async () => {
  const c = await call('GET', '/community/progress');
  assert.ok(c.totals.cleanup_missions >= 1);
  assert.equal(c.spots.length, 9);
  assert.equal((await call('GET', '/admin/stats', null, token)).status, 403);
});
