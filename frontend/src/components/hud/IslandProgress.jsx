import { useGame } from '../../game/store.js';
import { cleanColor } from '../../game/format.js';
import ProgressBar from '../ui/ProgressBar.jsx';

export default function IslandProgress({ onOpen }) {
  const detail = useGame((s) => s.detail);
  const spots = useGame((s) => s.spots);
  const profile = useGame((s) => s.profile);
  if (!detail) return null;
  const c = detail.spot.cleanliness;
  const overall = spots.length ? spots.reduce((a, s) => a + s.cleanliness, 0) / spots.length : 0;
  const rows = [
    { label: `${detail.spot.name} Cleanliness`, value: c, color: cleanColor(c), icon: '🧹' },
    { label: 'Island-wide Cleanliness', value: overall, color: '#00b4d8', icon: '🌊' },
  ];
  return (
    <button onClick={onOpen} className="panel w-60 p-3 text-left text-sm hover:brightness-110 sm:w-64" aria-label="Open community progress">
      <div className="mb-1 flex items-center gap-2 font-display text-lg font-bold">🌿 Island Progress</div>
      {rows.map((r) => (
        <div key={r.label} className="mb-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span>
              {r.icon} {r.label}
            </span>
            <span>{r.value.toFixed(0)}%</span>
          </div>
          <ProgressBar value={r.value} color={r.color} />
        </div>
      ))}
      <div className="mt-1 flex justify-between text-xs font-semibold text-green-200">
        <span>🍃 Your Eco Points</span>
        <span>{profile?.ecoPoints ?? 0}</span>
      </div>
    </button>
  );
}
