import { create } from 'zustand';
import { api } from '../services/api.js';
import { audio } from '../services/audio.js';

let noteId = 0;

/**
 * Central game store: current destination, missions, trash, UI state.
 * All rewards/progress come back from the backend — the client never decides them.
 */
export const useGame = create((set, get) => ({
  profile: null,
  spots: [],
  spotKey: null,
  layout: null,
  layoutFor: null,
  detail: null, // { spot, npcs, activities, quizzes, missions }
  missions: [], // all missions with my status
  trash: { indices: [], total: 0 },
  loadingSpot: false,
  spotError: null,
  mode: 'explore', // explore | surf | kayak
  modeOptions: null,
  modal: null, // { type, props }
  prompt: null, // current interaction prompt
  holdProgress: 0,
  notifications: [],
  trackedMissionId: null,
  onProfile: null,

  setProfile(profile) {
    set({ profile });
    get().onProfile?.(profile);
  },

  notify(text, type = 'info', icon) {
    const id = ++noteId;
    set((s) => ({ notifications: [...s.notifications.slice(-4), { id, text, type, icon }] }));
    setTimeout(() => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })), 5500);
  },

  openModal(type, props = {}) {
    set({ modal: { type, props } });
  },
  closeModal() {
    set({ modal: null });
  },
  setPrompt(prompt) {
    if (get().prompt?.id !== prompt?.id || get().prompt?.label !== prompt?.label) set({ prompt });
  },
  setMode(mode, modeOptions = null) {
    set({ mode, modeOptions, prompt: null });
  },
  setLayout(layout, layoutFor) {
    set({ layout, layoutFor });
  },
  track(id) {
    set({ trackedMissionId: id });
  },

  async loadSpots() {
    const { spots } = await api.spots();
    set({ spots });
    return spots;
  },

  async loadSpot(key) {
    set({ loadingSpot: true, spotError: null, mode: 'explore', modal: null, prompt: null, trash: { indices: [], total: 0 } });
    try {
      const [detail, visit] = await Promise.all([api.spot(key), api.visit(key)]);
      set({ detail, spotKey: key });
      if (get().profile) set({ profile: { ...get().profile, currentSpot: key } });
      await Promise.all([get().refreshMissions(), get().refreshTrash(key), get().loadSpots()]);
      get().handleUpdates(visit.missionUpdates);
    } catch (e) {
      set({ spotError: e.message });
    } finally {
      set({ loadingSpot: false });
    }
  },

  async refreshMissions() {
    const { missions } = await api.missions();
    set({ missions });
    const tracked = get().trackedMissionId;
    if (!tracked || !missions.some((m) => m.id === tracked && m.status === 'active')) {
      const firstActive = missions.find((m) => m.status === 'active' && m.spotKey === get().spotKey) || missions.find((m) => m.status === 'active');
      set({ trackedMissionId: firstActive?.id ?? null });
    }
    return missions;
  },

  async refreshTrash(key = get().spotKey) {
    const t = await api.trash(key);
    set({ trash: { indices: t.indices, total: t.total } });
    get().updateCleanliness(key, t.cleanliness);
  },

  updateCleanliness(key, value) {
    if (value === null || value === undefined) return;
    set((s) => ({
      spots: s.spots.map((sp) => (sp.key === key ? { ...sp, cleanliness: value } : sp)),
      detail: s.detail && s.detail.spot.key === key ? { ...s.detail, spot: { ...s.detail.spot, cleanliness: value } } : s.detail,
    }));
  },

  /** Show feedback for validated mission progress returned by the backend. */
  handleUpdates(updates = []) {
    if (!updates?.length) return;
    for (const u of updates) {
      if (u.readyToComplete) {
        get().notify(`"${u.missionTitle}" complete! Claim your reward.`, 'success', '🏁');
        audio.success();
      } else {
        get().notify(`${u.objective} (${u.count}/${u.required})`, 'progress', '✔️');
      }
    }
    get().refreshMissions();
  },

  async collectTrash(index) {
    const { spotKey, trash } = get();
    if (!trash.indices.includes(index)) return;
    set({ trash: { ...trash, indices: trash.indices.filter((i) => i !== index) } });
    audio.pickup();
    try {
      const r = await api.collect(spotKey, index);
      get().setProfile(r.profile);
      get().updateCleanliness(r.spotKey, r.cleanliness);
      if (!r.missionUpdates?.length) get().notify(`+${r.rewards.eco} Eco Point · +${r.rewards.xp} XP (Clean Beach)`, 'eco', '🌿');
      if (r.rewards.leveledUp) get().notify(`Level up! You are now level ${r.rewards.level}`, 'success', '⭐');
      get().handleUpdates(r.missionUpdates);
    } catch (e) {
      if (e.status !== 409) set((s) => ({ trash: { ...s.trash, indices: [...s.trash.indices, index].sort((a, b) => a - b) } }));
      get().notify(e.message, 'error', '⚠️');
    }
  },

  async talk(npcKey) {
    try {
      const r = await api.talk(npcKey);
      get().handleUpdates(r.missionUpdates);
      return r.npc;
    } catch (e) {
      get().notify(e.message, 'error', '⚠️');
      return null;
    }
  },

  activityByKey(key) {
    return get().detail?.activities.find((a) => a.key === key);
  },

  async completeActivity(key, body) {
    const act = get().activityByKey(key);
    if (!act) return null;
    try {
      const r = await api.completeActivity(act.id, body);
      get().setProfile(r.profile);
      if (r.cleanliness !== null && r.cleanliness !== undefined) get().updateCleanliness(get().spotKey, r.cleanliness);
      if (r.rewards?.xp) get().notify(`${act.name}: +${r.rewards.xp} XP, +${r.rewards.coins} coins`, 'eco', '🛠️');
      if (r.rewards?.leveledUp) get().notify(`Level up! You are now level ${r.rewards.level}`, 'success', '⭐');
      get().handleUpdates(r.missionUpdates);
      return r;
    } catch (e) {
      get().notify(e.message, 'error', '⚠️');
      return null;
    }
  },

  async startMission(id) {
    try {
      await api.startMission(id);
      audio.click();
      set({ trackedMissionId: id });
      await get().refreshMissions();
      await get().refreshTrash();
      const m = get().missions.find((x) => x.id === id);
      get().notify(`Quest accepted: ${m?.title}`, 'info', '📜');
      return true;
    } catch (e) {
      get().notify(e.message, 'error', '⚠️');
      return false;
    }
  },

  async abandonMission(id) {
    try {
      await api.abandonMission(id);
      await get().refreshMissions();
    } catch (e) {
      get().notify(e.message, 'error', '⚠️');
    }
  },

  async completeMission(id) {
    try {
      const r = await api.completeMission(id);
      audio.success();
      get().setProfile(r.profile);
      if (r.cleanliness !== null && r.cleanliness !== undefined) get().updateCleanliness(r.mission.spotKey, r.cleanliness);
      await get().refreshMissions();
      get().openModal('reward', r);
      return r;
    } catch (e) {
      get().notify(e.message, 'error', '⚠️');
      return null;
    }
  },

  async buy(itemKey) {
    try {
      const r = await api.buy(itemKey);
      audio.success();
      get().setProfile(r.profile);
      get().notify(`Purchased ${r.item.name}!`, 'success', '🛍️');
      get().handleUpdates(r.missionUpdates);
      return r;
    } catch (e) {
      audio.error();
      get().notify(e.message, 'error', '⚠️');
      return null;
    }
  },
}));
