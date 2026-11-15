/** Thin REST client for the Siargao Pixel Life backend. */
const BASE = (import.meta.env.VITE_API_URL || '') + '/api';
const TOKEN_KEY = 'spl_token';

export const tokenStore = {
  get: () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set: (t) => {
    try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
  },
};

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(method, path, body) {
  const token = tokenStore.get();
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the game server. Is the backend running?');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event('spl:unauthorized'));
    throw new ApiError(res.status, data.error || `Request failed (${res.status})`, data.details);
  }
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b ?? {}),
  put: (p, b) => request('PUT', p, b ?? {}),

  register: (b) => request('POST', '/auth/register', b),
  login: (b) => request('POST', '/auth/login', b),
  me: () => request('GET', '/auth/me'),

  updateProfile: (b) => request('PUT', '/players/profile', b),
  myMissions: () => request('GET', '/players/missions'),
  inventory: () => request('GET', '/players/inventory'),

  spots: () => request('GET', '/tourist-spots'),
  spot: (key) => request('GET', `/tourist-spots/${key}`),
  trash: (key) => request('GET', `/tourist-spots/${key}/trash`),
  visit: (key) => request('POST', `/tourist-spots/${key}/visit`, {}),

  missions: (spot) => request('GET', `/missions${spot ? `?spot=${spot}` : ''}`),
  startMission: (id) => request('POST', `/missions/${id}/start`, {}),
  completeMission: (id) => request('POST', `/missions/${id}/complete`, {}),
  abandonMission: (id) => request('POST', `/missions/${id}/abandon`, {}),

  completeActivity: (id, b) => request('POST', `/activities/${id}/complete`, b),
  talk: (key) => request('POST', `/npcs/${key}/talk`, {}),
  quiz: (key) => request('GET', `/quizzes/${key}`),
  submitQuiz: (key, answers) => request('POST', `/quizzes/${key}/submit`, { answers }),
  collect: (spotId, trashIndex) => request('POST', '/cleanup/collect', { spotId, trashIndex }),

  shopItems: (spot) => request('GET', `/shop/items${spot ? `?spot=${spot}` : ''}`),
  buy: (itemKey) => request('POST', '/shop/buy', { itemKey }),

  community: () => request('GET', '/community/progress'),
  submitSurf: (b) => request('POST', '/surfing/submit-score', b),
  leaderboard: (spot) => request('GET', `/surfing/leaderboard${spot ? `?spot=${spot}` : ''}`),
};
