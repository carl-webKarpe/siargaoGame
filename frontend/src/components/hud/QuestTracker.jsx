import { useState } from 'react';
import { useGame } from '../../game/store.js';
import { missionDone, objectiveDone } from '../../game/format.js';

export default function QuestTracker() {
  const missions = useGame((s) => s.missions);
  const trackedId = useGame((s) => s.trackedMissionId);
  const openModal = useGame((s) => s.openModal);
  const completeMission = useGame((s) => s.completeMission);
  const [collapsed, setCollapsed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const m = missions.find((x) => x.id === trackedId && x.status === 'active');

  if (!m) {
    return (
      <button onClick={() => openModal('missions')} className="panel w-64 p-3 text-left text-sm hover:brightness-110">
        <div className="font-display text-lg font-bold text-sunset">📜 No active quest</div>
        <div className="text-white/80">Talk to locals marked with <b className="text-yellow-300">!</b> or open Missions.</div>
      </button>
    );
  }
  const done = missionDone(m);
  return (
    <div className="panel w-64 overflow-hidden text-sm sm:w-72">
      <button onClick={() => setCollapsed((c) => !c)} className="flex w-full items-center gap-2 border-b border-white/10 px-3 py-2 text-left">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-yellow-400 font-display text-lg font-extrabold text-navy">!</span>
        <span className="font-display text-lg font-bold text-sunset">Active Quest</span>
        <span className="ml-auto text-white/60">{collapsed ? '▸' : '▾'}</span>
      </button>
      {!collapsed && (
        <div className="space-y-1.5 px-3 py-2">
          <div className="font-display text-base font-bold leading-tight">✦ {m.title}</div>
          <div className="text-[11px] font-semibold text-sky">📍 {m.spotName}</div>
          <ul className="space-y-1">
            {m.objectives.map((o) => {
              const ok = objectiveDone(m, o);
              const c = m.progress?.[o.id]?.count ?? 0;
              return (
                <li key={o.id} className={`flex items-start gap-2 ${ok ? 'text-green-300' : ''}`}>
                  <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border ${ok ? 'border-green-300 bg-green-500/40' : 'border-white/60'}`}>{ok ? '✓' : ''}</span>
                  <span className={ok ? 'line-through opacity-80' : ''}>
                    {o.label}
                    {o.count > 1 && ` (${Math.min(c, o.count)}/${o.count})`}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center gap-1 pt-1 text-xs font-bold text-yellow-200">
            🪙 Reward: {m.rewardCoins} Coins + {m.rewardXp} XP{m.rewardBadge ? ` + "${m.rewardBadge}"` : ''}
          </div>
          {done && (
            <button
              disabled={claiming}
              onClick={async () => {
                setClaiming(true);
                await completeMission(m.id);
                setClaiming(false);
              }}
              className="btn-primary btn-sm mt-1 w-full animate-pulse"
            >
              🏁 Claim reward
            </button>
          )}
        </div>
      )}
    </div>
  );
}
