import { useGame } from '../../game/store.js';
import { missionDone } from '../../game/format.js';

export default function ActionBar({ canSurf }) {
  const openModal = useGame((s) => s.openModal);
  const missions = useGame((s) => s.missions);
  const ready = missions.filter(missionDone).length;
  const buttons = [
    { key: 'map', icon: '📍', label: 'Map' },
    { key: 'inventory', icon: '🎒', label: 'Inventory' },
    { key: 'missions', icon: '🏆', label: 'Missions', badge: ready || null },
    { key: 'surfSetup', icon: '🏄', label: 'Surfing', disabled: !canSurf, title: canSurf ? 'Go surfing' : 'Surfing is available at Cloud 9 and Pacifico Beach' },
    { key: 'shop', icon: '🛍️', label: 'Shop' },
    { key: 'community', icon: '👥', label: 'Community' },
  ];
  return (
    <nav className="flex items-end gap-1.5 sm:gap-3" aria-label="Game menu">
      {buttons.map((b) => (
        <button
          key={b.key}
          disabled={b.disabled}
          title={b.title || b.label}
          onClick={() => openModal(b.key)}
          className="group relative flex flex-col items-center disabled:opacity-40"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-white/40 bg-navy/80 text-2xl shadow-lg backdrop-blur transition group-hover:-translate-y-1 group-hover:border-sunset sm:h-14 sm:w-14 sm:text-3xl">
            {b.icon}
          </span>
          <span className="mt-0.5 font-display text-xs font-bold drop-shadow sm:text-base">{b.label}</span>
          {b.badge && (
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-xs font-bold">{b.badge}</span>
          )}
        </button>
      ))}
    </nav>
  );
}
