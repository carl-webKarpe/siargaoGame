import { ROLE_LABEL } from '../../game/format.js';
import ProgressBar from '../ui/ProgressBar.jsx';

export default function PlayerCard({ profile, onClick }) {
  if (!profile) return null;
  const isLocal = profile.role === 'local_resident';
  return (
    <button onClick={onClick} className="panel flex items-center gap-3 p-2 pr-4 text-left transition hover:brightness-110" aria-label="Open inventory and profile">
      <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full border-4 border-white/80 text-2xl shadow-lg sm:h-16 sm:w-16" style={{ background: isLocal ? '#2e8b57' : '#00b4d8' }}>
        <span aria-hidden>{isLocal ? '🏡' : '🎒'}</span>
      </div>
      <div className="min-w-0">
        <div className="truncate font-display text-lg font-bold leading-tight sm:text-xl">{profile.username}</div>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="font-bold">Lv. {profile.level}</span>
          <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: isLocal ? '#2e8b57' : '#00b4d8' }}>
            {ROLE_LABEL[profile.role]}
          </span>
        </div>
        <div className="mt-1 w-32 sm:w-40">
          <ProgressBar value={profile.xpIntoLevel} max={profile.xpToNext} color="linear-gradient(90deg,#2e8b57,#7bd389)" />
          <div className="mt-0.5 text-[10px] font-semibold text-white/80">
            {profile.xpIntoLevel} / {profile.xpToNext} XP
          </div>
        </div>
      </div>
    </button>
  );
}
