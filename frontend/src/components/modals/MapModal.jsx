import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { useGame } from '../../game/store.js';
import { cleanColor } from '../../game/format.js';
import ProgressBar from '../ui/ProgressBar.jsx';

/** Stylized map of Siargao and nearby islands. Coordinates are 0-100 percentages. */
const ISLAND_PATH =
  'M48 4 C60 3 72 8 80 16 C88 24 90 34 84 44 C80 52 78 60 74 66 C70 72 64 76 58 74 C52 72 48 64 42 60 C36 56 28 58 24 52 C20 46 24 38 28 32 C34 24 38 10 48 4 Z';

export default function MapModal({ onClose }) {
  const spots = useGame((s) => s.spots);
  const spotKey = useGame((s) => s.spotKey);
  const missions = useGame((s) => s.missions);
  const loadSpot = useGame((s) => s.loadSpot);
  const [sel, setSel] = useState(spotKey);
  const spot = spots.find((s) => s.key === sel);
  const avail = (k) => missions.filter((m) => m.spotKey === k && m.status !== 'completed').length;

  return (
    <Modal title="Siargao Island Map" icon="🗺️" onClose={onClose} wide>
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-ocean to-[#0369a1]">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
            <defs>
              <pattern id="waves" width="8" height="4" patternUnits="userSpaceOnUse">
                <path d="M0 2 Q2 0 4 2 T8 2" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#waves)" />
            <path d={ISLAND_PATH} fill="#7cc36f" stroke="#f4d6a0" strokeWidth="1.5" />
            <path d="M40 30 C46 26 56 28 60 36 C62 44 56 52 50 50 C44 48 38 40 40 30 Z" fill="#4f9a45" opacity="0.7" />
            <ellipse cx="20" cy="18" rx="7" ry="5" fill="#7cc36f" stroke="#f4d6a0" strokeWidth="1" />
            <ellipse cx="58" cy="85" rx="6" ry="3" fill="#7cc36f" stroke="#f4d6a0" strokeWidth="1" />
            <circle cx="66" cy="80" r="1.6" fill="#7cc36f" stroke="#f4d6a0" strokeWidth="0.8" />
            <ellipse cx="72" cy="76" rx="2.5" ry="0.9" fill="#fbf1dc" />
            <text x="45" y="45" fontSize="4" fill="#ffffff" opacity="0.6" fontWeight="800">SIARGAO</text>
            <text x="9" y="28" fontSize="2.6" fill="#ffffff" opacity="0.7" fontWeight="700">Bucas Grande</text>
          </svg>
          {spots.map((s) => {
            const pos = s.environment.mapPos || { x: 50, y: 50 };
            const here = s.key === spotKey;
            return (
              <button
                key={s.key}
                onClick={() => setSel(s.key)}
                className="group absolute -translate-x-1/2 -translate-y-full"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                aria-label={s.name}
              >
                <div className={`flex flex-col items-center ${sel === s.key ? 'scale-125' : ''} transition`}>
                  <span className="whitespace-nowrap rounded-full bg-navy/85 px-1.5 text-[10px] font-bold text-white sm:text-xs">{s.name}</span>
                  <span className="text-2xl drop-shadow" style={{ filter: here ? 'hue-rotate(160deg)' : '' }}>
                    {here ? '🧍' : '📍'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        {spot && (
          <div className="flex flex-col">
            <h3 className="font-display text-2xl font-bold">{spot.name}</h3>
            <div className="text-sm font-bold text-ocean">{spot.municipality}</div>
            <p className="mt-2 text-sm text-navy/80">{spot.description}</p>
            <div className="mt-3 text-sm font-bold">
              Cleanliness: <span style={{ color: cleanColor(spot.cleanliness) }}>{spot.cleanliness.toFixed(0)}%</span>
            </div>
            <ProgressBar value={spot.cleanliness} color={cleanColor(spot.cleanliness)} />
            <ul className="mt-3 space-y-1 text-sm">
              {spot.environment.surf && <li>🏄 Surf break</li>}
              <li>📜 {avail(spot.key)} open mission(s)</li>
              {(spot.environment.facts || []).slice(0, 2).map((f) => (
                <li key={f} className="text-navy/70">💡 {f}</li>
              ))}
            </ul>
            <div className="mt-auto pt-4">
              {spot.key === spotKey ? (
                <div className="rounded-xl bg-tropical/15 p-2 text-center font-bold text-tropical">You are here</div>
              ) : (
                <button
                  className="btn-primary w-full"
                  onClick={() => {
                    onClose();
                    loadSpot(spot.key);
                  }}
                >
                  ✈ Travel to {spot.name}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
