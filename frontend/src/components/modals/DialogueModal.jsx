import { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { useGame } from '../../game/store.js';
import { CATEGORY_ICON, missionDone, missionGiver } from '../../game/format.js';

export default function DialogueModal({ npcKey, onClose }) {
  const talk = useGame((s) => s.talk);
  const detail = useGame((s) => s.detail);
  const layout = useGame((s) => s.layout);
  const missions = useGame((s) => s.missions);
  const profile = useGame((s) => s.profile);
  const { openModal, setMode, startMission, completeMission } = useGame.getState();
  const local = detail?.npcs.find((n) => n.key === npcKey);
  const [npc, setNpc] = useState(local || null);
  const [line, setLine] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const def = layout?.npcs.find((n) => n.key === npcKey) || {};

  useEffect(() => {
    talk(npcKey).then((n) => n && setNpc(n));
  }, [npcKey, talk]);

  const myMissions = useMemo(
    () => missions.filter((m) => m.spotKey === detail?.spot.key && missionGiver(m, layout) === npcKey && m.status !== 'completed'),
    [missions, detail, layout, npcKey]
  );
  if (!npc) return null;
  const lines = npc.dialogue || [];
  const atEnd = line >= lines.length - 1;

  return (
    <Modal title={npc.name} icon="💬" onClose={onClose}>
      <div className="text-xs font-bold uppercase tracking-wide text-ocean">{npc.role}</div>
      <div className="mt-2 min-h-[72px] rounded-2xl bg-sand/40 p-4 text-lg font-semibold leading-snug">“{lines[line]}”</div>
      {!atEnd ? (
        <button className="btn-ocean btn-sm mt-3" onClick={() => setLine((l) => l + 1)} autoFocus>
          Next ▸
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          {myMissions.map((m) => {
            const ready = missionDone(m);
            const recommended = m.recommendedRole === 'both' || m.recommendedRole === profile?.role;
            return (
              <div key={m.id} className="rounded-xl border-2 border-navy/10 p-3">
                <div className="flex items-center gap-2 font-display text-lg font-bold">
                  {CATEGORY_ICON[m.category]} {m.title}
                  {recommended && m.status === 'available' && <span className="rounded-full bg-sunset px-2 text-xs">For you</span>}
                </div>
                <p className="text-sm text-navy/75">{m.description}</p>
                <div className="mt-1 text-xs font-bold text-navy/60">Reward: {m.rewardCoins} coins · {m.rewardXp} XP{m.rewardBadge ? ` · ${m.rewardBadge}` : ''}</div>
                <div className="mt-2">
                  {m.status === 'available' && (
                    <button className="btn-green btn-sm" onClick={() => startMission(m.id)}>
                      Accept quest
                    </button>
                  )}
                  {m.status === 'active' && !ready && <span className="text-sm font-bold text-ocean">In progress — check your quest tracker.</span>}
                  {ready && (
                    <button className="btn-primary btn-sm" onClick={() => completeMission(m.id)}>
                      🏁 Claim reward
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost btn-sm !border-navy/20 !text-navy" onClick={() => setShowInfo((v) => !v)}>
              💡 Teach me something
            </button>
            {def.quiz && (
              <button className="btn-ocean btn-sm" onClick={() => openModal('quiz', { quizKey: def.quiz })}>
                📝 Take the quiz
              </button>
            )}
            {def.prop === 'surfboard' && detail?.spot.environment.surf && (
              <button className="btn-ocean btn-sm" onClick={() => openModal('surfSetup')}>
                🏄 Go surfing
              </button>
            )}
            {npcKey === 'kayak_nene' && layout?.kayak && (
              <button
                className="btn-ocean btn-sm"
                onClick={() => {
                  onClose();
                  setMode('kayak');
                }}
              >
                🛶 Rent a kayak
              </button>
            )}
            {def.shop && (
              <button className="btn-primary btn-sm" onClick={() => openModal('shop', { tab: 'local_product' })}>
                🛍️ Browse local products
              </button>
            )}
            <button className="btn-ghost btn-sm !border-navy/20 !text-navy" onClick={() => setLine(0)}>
              ↺ Hear again
            </button>
          </div>
          {showInfo && <div className="animate-floatUp rounded-xl bg-ocean/10 p-3 text-sm font-semibold text-navy">💡 {npc.info}</div>}
        </div>
      )}
    </Modal>
  );
}
