import { useEffect, useState } from 'react';
import { kayakRuntime } from '../runtime.js';
import { useGame } from '../../game/store.js';
import { playerState } from '../../game/playerState.js';

export default function KayakHUD({ layout }) {
  const [, tick] = useState(0);
  const setMode = useGame((s) => s.setMode);
  useEffect(() => {
    const id = setInterval(() => tick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, []);
  const s = kayakRuntime.state;
  if (!s) return null;
  const exit = () => {
    playerState.teleport = { x: layout.kayak.start[0], z: layout.kayak.start[1] + 5, yaw: 0 };
    setMode('explore');
  };
  const sub = kayakRuntime.submit;
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute left-1/2 top-3 -translate-x-1/2 text-center">
        <div className="panel px-5 py-2">
          <div className="font-display text-xl font-bold">🛶 Sugba Kayak Loop</div>
          <div className="font-display text-lg">
            Buoys {s.next}/{s.total} · ⏱ {(s.elapsed / 1000).toFixed(1)}s
          </div>
          <div className="text-xs text-white/80">W paddle · A/D steer · E grab floating litter</div>
        </div>
      </div>
      {s.finished && (
        <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-navy/40 p-4">
          <div className="panel-light animate-floatUp w-full max-w-sm overflow-hidden text-center">
            <div className="bg-tropical px-5 py-3 font-display text-3xl font-extrabold text-white">🛶 Loop complete!</div>
            <p className="p-5 font-semibold">
              Time: {(s.elapsed / 1000).toFixed(1)}s
              <br />
              {sub?.status === 'ok' ? '✅ Saved to your progress.' : sub?.status === 'error' ? '⚠️ Could not save this run.' : 'Saving…'}
            </p>
            <p className="px-5 text-sm text-navy/70">Paddling instead of motor boats keeps the lagoon clear and quiet for wildlife.</p>
            <div className="p-4">
              <button className="btn-primary w-full" onClick={exit}>Return to the dock</button>
            </div>
          </div>
        </div>
      )}
      {!s.finished && (
        <button onClick={exit} className="btn-ghost btn-sm pointer-events-auto absolute right-3 top-3">
          ✕ Return to dock
        </button>
      )}
    </div>
  );
}
