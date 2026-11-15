import { useGame } from '../../game/store.js';
import { isTouchDevice } from '../../contexts/SettingsContext.jsx';

export default function InteractPrompt() {
  const prompt = useGame((s) => s.prompt);
  const hold = useGame((s) => s.holdProgress);
  if (!prompt) return null;
  const touch = isTouchDevice();
  return (
    <div className="pointer-events-none absolute bottom-36 left-1/2 z-20 -translate-x-1/2 sm:bottom-32">
      <div className="panel flex items-center gap-3 px-4 py-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-white font-display text-xl font-extrabold text-navy shadow">{touch ? '✋' : 'E'}</span>
        <span className="font-display text-lg font-bold">{prompt.label}</span>
      </div>
      {prompt.hold && (
        <div className="mx-auto mt-2 h-2 w-48 overflow-hidden rounded-full bg-black/40">
          <div className="h-full bg-sunset" style={{ width: `${hold * 100}%` }} />
        </div>
      )}
    </div>
  );
}
