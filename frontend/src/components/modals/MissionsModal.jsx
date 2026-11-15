import { useMemo, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { useGame } from '../../game/store.js';
import { CATEGORY_ICON, CATEGORY_LABEL, missionDone, objectiveDone, ROLE_LABEL } from '../../game/format.js';
import ProgressBar from '../ui/ProgressBar.jsx';

const TABS = [
  { key: 'here', label: 'This destination' },
  { key: 'recommended', label: 'Recommended' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

export default function MissionsModal({ onClose }) {
  const missions = useGame((s) => s.missions);
  const spotKey = useGame((s) => s.spotKey);
  const profile = useGame((s) => s.profile);
  const trackedId = useGame((s) => s.trackedMissionId);
  const { startMission, completeMission, abandonMission, track, loadSpot } = useGame.getState();
  const [tab, setTab] = useState('here');
  const [busy, setBusy] = useState(null);

  const list = useMemo(() => {
    switch (tab) {
      case 'here':
        return missions.filter((m) => m.spotKey === spotKey);
      case 'recommended':
        return missions.filter((m) => m.status === 'available' && m.recommended);
      case 'active':
        return missions.filter((m) => m.status === 'active');
      default:
        return missions.filter((m) => m.status === 'completed');
    }
  }, [missions, tab, spotKey]);

  const act = async (id, fn) => {
    setBusy(id);
    await fn();
    setBusy(null);
  };

  return (
    <Modal title="Missions" icon="🏆" onClose={onClose} wide>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`rounded-full px-4 py-1.5 text-sm font-bold ${tab === t.key ? 'bg-navy text-white' : 'bg-navy/10 hover:bg-navy/20'}`}>
            {t.label}
            {t.key === 'active' && ` (${missions.filter((m) => m.status === 'active').length})`}
          </button>
        ))}
      </div>
      {tab === 'recommended' && (
        <p className="mb-3 rounded-xl bg-ocean/10 p-3 text-sm font-semibold">
          As a <b>{ROLE_LABEL[profile?.role]}</b>, these missions fit your role best — but every mission is open to everyone.
        </p>
      )}
      {!list.length && <p className="py-8 text-center font-semibold text-navy/60">No missions here yet.</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((m) => {
          const ready = missionDone(m);
          const total = m.objectives.reduce((a, o) => a + o.count, 0);
          const prog = m.objectives.reduce((a, o) => a + Math.min(o.count, m.progress?.[o.id]?.count ?? 0), 0);
          return (
            <article key={m.id} className={`rounded-2xl border-2 p-4 ${trackedId === m.id ? 'border-sunset' : 'border-navy/10'}`}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-lg font-bold leading-tight">
                  {CATEGORY_ICON[m.category]} {m.title}
                </h3>
                <span className="shrink-0 rounded-full bg-navy/10 px-2 py-0.5 text-[11px] font-bold capitalize">{m.difficulty}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1 text-[11px] font-bold">
                <span className="rounded-full bg-ocean/15 px-2 py-0.5 text-ocean">📍 {m.spotName}</span>
                <span className="rounded-full bg-tropical/15 px-2 py-0.5 text-tropical">{CATEGORY_LABEL[m.category]}</span>
                {m.recommended && m.status === 'available' && <span className="rounded-full bg-sunset/30 px-2 py-0.5">⭐ Recommended</span>}
                {m.repeatable && <span className="rounded-full bg-navy/10 px-2 py-0.5">↻ Repeatable</span>}
              </div>
              <p className="mt-2 text-sm text-navy/75">{m.description}</p>
              <ul className="mt-2 space-y-0.5 text-sm">
                {m.objectives.map((o) => (
                  <li key={o.id} className={m.status === 'active' && objectiveDone(m, o) ? 'text-tropical line-through' : ''}>
                    • {o.label}
                    {m.status === 'active' && o.count > 1 && ` (${Math.min(o.count, m.progress?.[o.id]?.count ?? 0)}/${o.count})`}
                  </li>
                ))}
              </ul>
              {m.status === 'active' && <ProgressBar value={prog} max={total} className="mt-2" color="#00b4d8" />}
              <div className="mt-2 text-xs font-bold text-navy/60">
                🪙 {m.rewardCoins} coins · ✨ {m.rewardXp} XP{m.rewardBadge ? ` · 🏅 ${m.rewardBadge}` : ''}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {m.status === 'available' && (
                  <button className="btn-green btn-sm" disabled={busy === m.id} onClick={() => act(m.id, () => startMission(m.id))}>
                    Accept
                  </button>
                )}
                {m.status === 'active' && !ready && trackedId !== m.id && (
                  <button className="btn-ocean btn-sm" onClick={() => track(m.id)}>Track</button>
                )}
                {ready && (
                  <button className="btn-primary btn-sm" disabled={busy === m.id} onClick={() => act(m.id, () => completeMission(m.id))}>
                    🏁 Claim reward
                  </button>
                )}
                {m.status === 'active' && (
                  <button className="btn-sm btn rounded-xl border border-red-300 text-red-600 hover:bg-red-50" onClick={() => act(m.id, () => abandonMission(m.id))}>
                    Abandon
                  </button>
                )}
                {m.spotKey !== spotKey && m.status !== 'completed' && (
                  <button className="btn-sm btn border border-navy/20 hover:bg-navy/5" onClick={() => loadSpot(m.spotKey)}>
                    ✈ Travel there
                  </button>
                )}
                {m.status === 'completed' && <span className="text-sm font-bold text-tropical">✔ Completed {m.completedAt ? new Date(m.completedAt).toLocaleDateString() : ''}</span>}
              </div>
            </article>
          );
        })}
      </div>
    </Modal>
  );
}
