import { useEffect, useState } from 'react';
import { surfRuntime } from '../runtime.js';
import { CHALLENGES } from './surfEngine.js';
import { useGame } from '../../game/store.js';
import { playerState } from '../../game/playerState.js';
import { isTouchDevice } from '../../contexts/SettingsContext.jsx';

const MSG = { good: 'text-green-300', warn: 'text-yellow-300', bad: 'text-red-400', hint: 'text-white' };

/** Overlay for the surfing mini-game: timing, balance, score and results. */
export default function SurfHUD({ layout }) {
  const [, tick] = useState(0);
  const setMode = useGame((s) => s.setMode);
  const modeOptions = useGame((s) => s.modeOptions);
  useEffect(() => {
    const id = setInterval(() => tick((t) => t + 1), 66);
    return () => clearInterval(id);
  }, []);
  const s = surfRuntime.engine;
  if (!s) return null;
  const ch = CHALLENGES[s.challenge];
  const touch = isTouchDevice();
  const exit = () => {
    const e = layout.surf.entry;
    playerState.teleport = { x: e.x, z: e.z - 0.5, yaw: 0 };
    setMode('explore');
  };
  const again = () => setMode('surf', { ...modeOptions, nonce: Date.now() });

  const delta = s.wave.z - s.rider.z; // -32 .. +4
  const timingPos = Math.max(0, Math.min(1, (delta + 30) / 34));
  const zoneL = (30 - 2.6) / 34;
  const zoneR = (30 + 2.6) / 34;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute left-1/2 top-3 w-[min(92vw,520px)] -translate-x-1/2 text-center">
        <div className="panel px-4 py-2">
          <div className="font-display text-xl font-bold">🏄 {ch.name} · {s.board.name}</div>
          <div className="text-xs text-white/80">Goal: {ch.goal}</div>
          <div className="mt-1 flex justify-center gap-4 font-display text-lg font-bold">
            <span>Score {Math.round(s.score)}</span>
            <span>⏱ {s.rideTime.toFixed(1)}s</span>
            <span>↺ {s.carves} carves</span>
          </div>
        </div>
        <div className={`mt-2 font-display text-2xl font-extrabold drop-shadow-lg ${MSG[s.messageType]}`} style={{ WebkitTextStroke: '1px #102a43' }}>
          {s.message}
        </div>
      </div>

      {s.phase === 'paddle' && (
        <div className="absolute bottom-40 left-1/2 w-[min(90vw,460px)] -translate-x-1/2 space-y-3">
          <div className="panel p-3">
            <div className="mb-1 flex justify-between text-xs font-bold">
              <span>🌊 Wave timing</span>
              <span>{touch ? 'Tap CATCH' : 'SPACE'} in the green zone</span>
            </div>
            <div className="relative h-5 rounded-full bg-black/40">
              <div className="absolute h-full rounded-full bg-green-500/70" style={{ left: `${zoneL * 100}%`, width: `${(zoneR - zoneL) * 100}%` }} />
              {s.wave.active && <div className="absolute -top-1 h-7 w-2 rounded bg-white shadow" style={{ left: `calc(${timingPos * 100}% - 4px)` }} />}
            </div>
            <div className="mb-1 mt-3 flex justify-between text-xs font-bold">
              <span>💪 Paddle speed</span>
              <span>Hold {touch ? 'joystick ▲' : 'W'}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-black/40">
              <div className="h-full rounded-full" style={{ width: `${s.paddlePower * 100}%`, background: s.paddlePower >= 0.45 ? '#2e8b57' : '#ff9f43' }} />
            </div>
          </div>
        </div>
      )}

      {s.phase === 'ride' && (
        <div className="absolute bottom-40 left-1/2 w-[min(90vw,460px)] -translate-x-1/2">
          <div className="panel p-3">
            <div className="mb-1 flex justify-between text-xs font-bold">
              <span>⚖️ Balance — alternate {touch ? 'left/right' : 'A / D'} to carve</span>
              <span className={s.inPocket ? 'text-green-300' : 'text-white/70'}>{s.inPocket ? 'IN THE POCKET ×2' : 'find the pocket'}</span>
            </div>
            <div className="relative h-5 rounded-full" style={{ background: 'linear-gradient(90deg,#e63946,#ffd166 25%,#2e8b57 45%,#2e8b57 55%,#ffd166 75%,#e63946)' }}>
              <div className="absolute -top-1 h-7 w-2 rounded bg-white shadow" style={{ left: `calc(${((s.rider.balance + 1) / 2) * 100}% - 4px)` }} />
            </div>
          </div>
        </div>
      )}

      {s.phase === 'done' && <SurfResult s={s} onAgain={again} onExit={exit} />}

      {s.phase !== 'done' && (
        <button onClick={exit} className="btn-ghost btn-sm pointer-events-auto absolute right-3 top-3">
          ✕ Leave water
        </button>
      )}
    </div>
  );
}

function SurfResult({ s, onAgain, onExit }) {
  const sub = surfRuntime.submit;
  const res = sub?.res;
  return (
    <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-navy/40 p-4">
      <div className="panel-light animate-floatUp w-full max-w-md overflow-hidden text-center">
        <div className={`px-5 py-3 font-display text-3xl font-extrabold text-white ${s.result.passed ? 'bg-tropical' : 'bg-ocean'}`}>
          {s.result.passed ? '🏆 Challenge Complete!' : s.result.reason === 'wipeout' ? '🌊 Wipeout!' : '🏄 Ride Over'}
        </div>
        <div className="grid grid-cols-3 gap-2 p-5">
          {[
            ['Score', s.result.score],
            ['Ride time', `${s.result.duration}s`],
            ['Carves', s.result.carves],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-sand/40 p-2">
              <div className="text-xs font-bold text-navy/60">{k}</div>
              <div className="font-display text-2xl font-extrabold">{v}</div>
            </div>
          ))}
          <div className="col-span-3 text-sm font-semibold text-navy/70">Take-off: {s.result.timing === 'perfect' ? '⭐ Perfect' : 'Good'}</div>
        </div>
        <div className="px-5 pb-2 text-sm">
          {!sub || sub.status === 'pending' ? (
            <span className="text-navy/60">Saving your ride…</span>
          ) : sub.status === 'error' ? (
            <span className="font-bold text-red-600">Could not save: {sub.error}</span>
          ) : (
            <span className="font-bold text-tropical">
              Saved! +{res.rewards.xp} XP · +{res.rewards.coins} coins{res.rewards.badge ? ` · Badge: ${res.rewards.badge}` : ''}
            </span>
          )}
        </div>
        <div className="flex gap-2 p-4">
          <button className="btn-ocean flex-1" onClick={onAgain}>Surf again</button>
          <button className="btn-primary flex-1" onClick={onExit}>Back to beach</button>
        </div>
      </div>
    </div>
  );
}
