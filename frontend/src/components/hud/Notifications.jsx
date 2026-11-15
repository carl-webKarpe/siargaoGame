import { useGame } from '../../game/store.js';

const COLORS = { success: 'border-green-400', eco: 'border-tropical', error: 'border-red-400', progress: 'border-ocean', info: 'border-white/30' };

export default function Notifications() {
  const notes = useGame((s) => s.notifications);
  return (
    <div className="pointer-events-none flex w-72 flex-col gap-1.5 sm:w-80" aria-live="polite">
      {notes.map((n) => (
        <div key={n.id} className={`panel animate-floatUp flex items-center gap-2 border-l-4 px-3 py-2 text-sm font-semibold ${COLORS[n.type] || COLORS.info}`}>
          <span className="text-lg" aria-hidden>{n.icon || 'ℹ️'}</span>
          <span>{n.text}</span>
        </div>
      ))}
    </div>
  );
}
