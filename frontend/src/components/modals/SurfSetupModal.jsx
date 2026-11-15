import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { api } from '../../services/api.js';
import { useGame } from '../../game/store.js';
import { BOARDS, CHALLENGES } from '../../activities/surfing/surfEngine.js';

export default function SurfSetupModal({ onClose }) {
  const profile = useGame((s) => s.profile);
  const detail = useGame((s) => s.detail);
  const setMode = useGame((s) => s.setMode);
  const [owned, setOwned] = useState(['board_foamie']);
  const [board, setBoard] = useState(profile?.appearance?.board || 'board_foamie');
  const [challenge, setChallenge] = useState(profile?.surfingSkill ? 'beginner' : 'tutorial');
  const [board10, setBoard10] = useState([]);
  const spotKey = detail?.spot.key;
  const canSurf = !!detail?.spot.environment.surf;

  useEffect(() => {
    api.inventory().then((r) => setOwned(r.rewards.filter((x) => x.type === 'surfboard').map((x) => x.key)));
    if (spotKey) api.leaderboard(spotKey).then((r) => setBoard10(r.leaderboard.slice(0, 5)));
  }, [spotKey]);

  if (!canSurf) {
    return (
      <Modal title="Surfing" icon="🏄" onClose={onClose}>
        <p className="font-semibold">There is no surf break here. Travel to <b>Cloud 9</b> or <b>Pacifico Beach</b> to surf!</p>
      </Modal>
    );
  }
  return (
    <Modal
      title={`Surf ${detail.spot.name}`}
      icon="🏄"
      onClose={onClose}
      wide
      footer={
        <button
          className="btn-primary w-full"
          onClick={() => {
            onClose();
            setMode('surf', { boardKey: owned.includes(board) ? board : 'board_foamie', challenge, nonce: Date.now() });
          }}
        >
          🌊 Paddle out!
        </button>
      }
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="mb-2 font-display text-lg font-bold">1. Choose your board</h3>
          <div className="space-y-2">
            {Object.entries(BOARDS).map(([k, b]) => {
              const has = owned.includes(k);
              return (
                <button key={k} disabled={!has} onClick={() => setBoard(k)} className={`w-full rounded-xl border-2 p-3 text-left disabled:opacity-50 ${board === k ? 'border-ocean bg-ocean/10' : 'border-navy/10'}`}>
                  <div className="flex items-center gap-2 font-bold">
                    <span className="h-3 w-10 rounded-full" style={{ background: b.color }} /> {b.name}
                    {!has && <span className="ml-auto text-xs">🔒 Buy in Shop</span>}
                  </div>
                  <div className="text-xs text-navy/60">Stability {Math.round(b.stability * 100)} · Turning {Math.round(b.turn * 100)} · Speed {Math.round(b.speed * 100)}</div>
                </button>
              );
            })}
          </div>
          <h3 className="mb-2 mt-4 font-display text-lg font-bold">2. Choose a challenge</h3>
          <div className="space-y-2">
            {Object.entries(CHALLENGES).map(([k, c]) => (
              <button key={k} onClick={() => setChallenge(k)} className={`w-full rounded-xl border-2 p-3 text-left ${challenge === k ? 'border-sunset bg-sunset/10' : 'border-navy/10'}`}>
                <div className="font-bold">{c.name}</div>
                <div className="text-xs text-navy/60">{c.goal}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2 font-display text-lg font-bold">How to surf</h3>
          <ol className="list-inside list-decimal space-y-1 text-sm font-semibold">
            <li>Hold <kbd className="rounded bg-navy px-1.5 text-white">W</kbd> to paddle and build speed.</li>
            <li>Press <kbd className="rounded bg-navy px-1.5 text-white">SPACE</kbd> when the wave marker hits the green zone.</li>
            <li>Steer with <kbd className="rounded bg-navy px-1.5 text-white">A</kbd>/<kbd className="rounded bg-navy px-1.5 text-white">D</kbd>. Steering shifts your weight — alternate to keep balance and score carves.</li>
            <li>Stay in the pocket just ahead of the breaking curl for double points.</li>
          </ol>
          <p className="mt-3 rounded-xl bg-ocean/10 p-3 text-sm font-semibold">🤙 Etiquette: never drop in on another surfer and never stand on the reef.</p>
          <h3 className="mb-2 mt-4 font-display text-lg font-bold">🏆 Top surfers here</h3>
          <ol className="space-y-1 text-sm">
            {board10.map((r) => (
              <li key={r.rank} className="flex justify-between rounded-lg bg-sand/40 px-3 py-1">
                <span>{r.rank}. {r.username}</span>
                <b>{r.best}</b>
              </li>
            ))}
            {!board10.length && <li className="text-navy/60">No rides yet — be the first!</li>}
          </ol>
        </div>
      </div>
    </Modal>
  );
}
