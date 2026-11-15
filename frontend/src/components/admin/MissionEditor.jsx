import { useMemo, useState } from 'react';
import { api } from '../../services/api.js';
import { CATEGORY_LABEL } from '../../game/format.js';

const OBJ_TYPES = {
  collect_trash: 'Collect trash', talk_npc: 'Talk to NPC', quiz: 'Pass quiz', activity: 'Complete activity', surf: 'Surf challenge', visit: 'Visit destination',
};
const blank = (spotId) => ({
  spotId, title: '', description: '', category: 'beach_cleanup', difficulty: 'easy', recommendedRole: 'both',
  objectives: [{ id: 'trash', type: 'collect_trash', count: 10, label: 'Collect 10 pieces of trash' }],
  rewardXp: 100, rewardCoins: 150, rewardBadge: '', repeatable: false, cooldownHours: 6, isActive: true,
});

/** Create / edit a mission. Objective targets are validated by the backend. */
export default function MissionEditor({ mission, spots, lookups, onSaved, onCancel }) {
  const [f, setF] = useState(() => (mission ? { ...mission, rewardBadge: mission.rewardBadge || '' } : blank(spots[0]?.id)));
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const targets = useMemo(() => ({
    talk_npc: lookups.npcs.filter((n) => n.spotId === Number(f.spotId)),
    quiz: lookups.quizzes.filter((n) => n.spotId === Number(f.spotId)),
    activity: lookups.activities.filter((n) => n.spotId === Number(f.spotId)),
    surf: [{ key: 'tutorial', name: 'Tutorial' }, { key: 'beginner', name: 'Beginner' }, { key: 'intermediate', name: 'Intermediate' }],
  }), [lookups, f.spotId]);

  const setObj = (i, patch) => set('objectives', f.objectives.map((o, k) => (k === i ? { ...o, ...patch } : o)));

  const save = async () => {
    setBusy(true);
    setError(null);
    const body = {
      spotId: Number(f.spotId), title: f.title, description: f.description, category: f.category, difficulty: f.difficulty,
      recommendedRole: f.recommendedRole, rewardXp: Number(f.rewardXp), rewardCoins: Number(f.rewardCoins),
      rewardBadge: f.rewardBadge || null, repeatable: !!f.repeatable, cooldownHours: Number(f.cooldownHours), isActive: !!f.isActive,
      objectives: f.objectives.map((o) => ({ id: o.id, type: o.type, count: Number(o.count), label: o.label, ...(o.target ? { target: o.target } : {}) })),
    };
    try {
      if (mission) await api.put(`/admin/missions/${mission.id}`, body);
      else await api.post('/admin/missions', body);
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border-2 border-ocean/30 bg-white p-4">
      <h3 className="font-display text-xl font-bold">{mission ? `Edit: ${mission.title}` : 'Create mission'}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <div><label className="label">Title</label><input className="input" value={f.title} onChange={(e) => set('title', e.target.value)} /></div>
        <div>
          <label className="label">Destination</label>
          <select className="input" value={f.spotId} onChange={(e) => set('spotId', Number(e.target.value))}>
            {spots.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="md:col-span-2"><label className="label">Description</label><textarea className="input" rows={2} value={f.description} onChange={(e) => set('description', e.target.value)} /></div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={f.category} onChange={(e) => set('category', e.target.value)}>
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Difficulty</label>
            <select className="input" value={f.difficulty} onChange={(e) => set('difficulty', e.target.value)}>
              {['easy', 'medium', 'hard'].map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Recommended for</label>
            <select className="input" value={f.recommendedRole} onChange={(e) => set('recommendedRole', e.target.value)}>
              <option value="both">Both</option><option value="local_resident">Local Residents</option><option value="tourist">Tourists</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><label className="label">XP</label><input type="number" className="input" value={f.rewardXp} onChange={(e) => set('rewardXp', e.target.value)} /></div>
          <div><label className="label">Coins</label><input type="number" className="input" value={f.rewardCoins} onChange={(e) => set('rewardCoins', e.target.value)} /></div>
          <div><label className="label">Cooldown h</label><input type="number" className="input" value={f.cooldownHours} onChange={(e) => set('cooldownHours', e.target.value)} /></div>
        </div>
        <div><label className="label">Badge name (optional)</label><input className="input" value={f.rewardBadge} onChange={(e) => set('rewardBadge', e.target.value)} /></div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={f.repeatable} onChange={(e) => set('repeatable', e.target.checked)} /> Repeatable</label>
          <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={f.isActive} onChange={(e) => set('isActive', e.target.checked)} /> Active</label>
        </div>
      </div>
      <div>
        <div className="label">Objectives</div>
        <div className="space-y-2">
          {f.objectives.map((o, i) => (
            <div key={i} className="grid items-end gap-2 rounded-xl bg-sand/30 p-2 md:grid-cols-[90px_150px_1fr_70px_1.4fr_auto]">
              <div><label className="text-xs font-bold">ID</label><input className="input !py-1" value={o.id} onChange={(e) => setObj(i, { id: e.target.value })} /></div>
              <div>
                <label className="text-xs font-bold">Type</label>
                <select className="input !py-1" value={o.type} onChange={(e) => setObj(i, { type: e.target.value, target: undefined })}>
                  {Object.entries(OBJ_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold">Target</label>
                {targets[o.type] ? (
                  <select className="input !py-1" value={o.target || ''} onChange={(e) => setObj(i, { target: e.target.value })}>
                    <option value="">— choose —</option>
                    {targets[o.type].map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
                  </select>
                ) : (
                  <div className="py-1.5 text-xs text-navy/60">n/a</div>
                )}
              </div>
              <div><label className="text-xs font-bold">Count</label><input type="number" min="1" className="input !py-1" value={o.count} onChange={(e) => setObj(i, { count: e.target.value })} /></div>
              <div><label className="text-xs font-bold">Label</label><input className="input !py-1" value={o.label} onChange={(e) => setObj(i, { label: e.target.value })} /></div>
              <button className="btn btn-sm text-red-600" onClick={() => set('objectives', f.objectives.filter((_, k) => k !== i))} aria-label="Remove objective">✕</button>
            </div>
          ))}
        </div>
        <button className="btn btn-sm mt-2 border border-navy/20" onClick={() => set('objectives', [...f.objectives, { id: `obj${f.objectives.length + 1}`, type: 'visit', count: 1, label: 'Visit the destination' }])}>
          + Add objective
        </button>
      </div>
      {error && <p className="rounded-lg bg-red-50 p-2 text-sm font-semibold text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button className="btn-green" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save mission'}</button>
        <button className="btn border border-navy/20" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
