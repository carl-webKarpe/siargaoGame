import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { api } from '../../services/api.js';
import { useGame } from '../../game/store.js';
import { ROLE_LABEL } from '../../game/format.js';

const DEFAULT_SHIRTS = ['#ffffff', '#87ceeb', '#f4d6a0'];

export default function InventoryModal({ onClose }) {
  const profile = useGame((s) => s.profile);
  const setProfile = useGame((s) => s.setProfile);
  const notify = useGame((s) => s.notify);
  const [rewards, setRewards] = useState(null);
  const [tab, setTab] = useState('badges');

  useEffect(() => {
    api.inventory().then((r) => setRewards(r.rewards)).catch((e) => notify(e.message, 'error'));
  }, [notify]);

  const equip = async (appearance) => {
    try {
      const r = await api.updateProfile({ appearance });
      setProfile(r.profile);
      notify('Equipped!', 'success', '👕');
    } catch (e) {
      notify(e.message, 'error', '⚠️');
    }
  };

  if (!profile) return null;
  const a = profile.appearance || {};
  const stats = [
    ['Level', profile.level], ['Coins', profile.coins], ['Eco Points', profile.ecoPoints], ['Surf Skill', `${profile.surfingSkill}/100`],
    ['Missions done', profile.stats.completedMissions], ['Trash collected', profile.stats.trashCollected],
    ['Marine actions', profile.stats.marineRecords], ['Best surf', profile.stats.bestSurf],
  ];
  const byType = (t) => (rewards || []).filter((r) => (Array.isArray(t) ? t.includes(r.type) : r.type === t));
  const unique = (list) => [...new Map(list.map((r) => [r.key, r])).values()];

  return (
    <Modal title="Inventory & Profile" icon="🎒" onClose={onClose} wide>
      <div className="flex flex-wrap items-center gap-3">
        <div className="font-display text-2xl font-bold">{profile.username}</div>
        <span className="rounded-full bg-navy px-3 py-0.5 text-sm font-bold text-white">{ROLE_LABEL[profile.role]}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-xl bg-sand/40 p-2 text-center">
            <div className="text-[11px] font-bold text-navy/60">{k}</div>
            <div className="font-display text-xl font-extrabold">{v}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        {[['badges', '🏅 Badges'], ['boards', '🏄 Surfboards'], ['style', '👕 Style'], ['local', '🧺 Local goods']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-3 py-1.5 text-sm font-bold ${tab === k ? 'bg-navy text-white' : 'bg-navy/10'}`}>{l}</button>
        ))}
      </div>
      {!rewards ? (
        <p className="py-6 text-center">Loading…</p>
      ) : (
        <div className="mt-3">
          {tab === 'badges' && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {byType(['badge', 'achievement', 'certificate']).map((r) => (
                <div key={r.id} className={`rounded-xl border-2 p-3 text-center ${r.type === 'certificate' ? 'border-sunset bg-sunset/10' : 'border-navy/10'}`}>
                  <div className="text-3xl">{r.type === 'certificate' ? '📜' : r.type === 'achievement' ? '🏆' : '🏅'}</div>
                  <div className="font-bold leading-tight">{r.name}</div>
                  <div className="text-[11px] text-navy/60">{new Date(r.earnedAt).toLocaleDateString()}</div>
                </div>
              ))}
              {!byType(['badge', 'achievement', 'certificate']).length && <p className="col-span-full text-navy/60">Complete missions and surf challenges to earn badges!</p>}
            </div>
          )}
          {tab === 'boards' && (
            <div className="grid gap-2 sm:grid-cols-3">
              {byType('surfboard').map((r) => (
                <div key={r.id} className="rounded-xl border-2 border-navy/10 p-3">
                  <div className="h-3 w-full rounded-full" style={{ background: r.item?.data.color }} />
                  <div className="mt-2 font-bold">{r.name}</div>
                  <div className="text-xs text-navy/60">{r.item?.description}</div>
                  {a.board === r.key ? (
                    <div className="mt-2 text-sm font-bold text-tropical">✔ Equipped</div>
                  ) : (
                    <button className="btn-ocean btn-sm mt-2" onClick={() => equip({ board: r.key })}>Equip</button>
                  )}
                </div>
              ))}
            </div>
          )}
          {tab === 'style' && (
            <div className="space-y-4">
              <div>
                <div className="mb-1 font-bold">Shirts</div>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_SHIRTS.map((c) => (
                    <button key={c} onClick={() => equip({ shirt: c })} className={`h-10 w-10 rounded-full border-4 ${a.shirt === c && !a.shirtItem ? 'border-sunset' : 'border-navy/10'}`} style={{ background: c }} aria-label={`Shirt ${c}`} />
                  ))}
                  {unique(byType('cosmetic').filter((r) => r.item?.data.slot === 'shirt')).map((r) => (
                    <button key={r.key} onClick={() => equip({ shirt: r.key })} className={`flex items-center gap-2 rounded-full border-4 px-3 ${a.shirtItem === r.key ? 'border-sunset' : 'border-navy/10'}`}>
                      <span className="h-5 w-5 rounded-full" style={{ background: r.item.data.color }} /> {r.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1 font-bold">Hats</div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => equip({ hat: null })} className={`rounded-full border-4 px-3 py-1 ${!a.hat ? 'border-sunset' : 'border-navy/10'}`}>No hat</button>
                  {unique(byType('cosmetic').filter((r) => r.item?.data.slot === 'hat')).map((r) => (
                    <button key={r.key} onClick={() => equip({ hat: r.key })} className={`rounded-full border-4 px-3 py-1 ${a.hatItem === r.key ? 'border-sunset' : 'border-navy/10'}`}>
                      🎩 {r.name}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-navy/60">Buy more styles in the Shop.</p>
              </div>
            </div>
          )}
          {tab === 'local' && (
            <ul className="space-y-1">
              {byType('local_product').map((r) => (
                <li key={r.id} className="rounded-xl bg-sand/30 px-3 py-2 font-semibold">🧺 {r.name} <span className="text-xs text-navy/60">· {new Date(r.earnedAt).toLocaleDateString()}</span></li>
              ))}
              {!byType('local_product').length && <p className="text-navy/60">Support local families — buy local products at Daku Island.</p>}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
}
