import Modal from '../ui/Modal.jsx';
import { useGame } from '../../game/store.js';

export default function RewardModal({ mission, rewards, cleanliness, onClose }) {
  const profile = useGame((s) => s.profile);
  const cert = rewards.badge?.type === 'certificate';
  return (
    <Modal title="Mission Complete!" icon="🏁" onClose={onClose} footer={<button className="btn-primary w-full" onClick={onClose} autoFocus>Continue</button>}>
      <div className="text-center">
        <div className="font-display text-2xl font-bold">{mission.title}</div>
        <div className="mt-3 flex justify-center gap-3">
          <div className="rounded-xl bg-yellow-200 px-4 py-2 font-display text-xl font-bold">🪙 +{rewards.coins}</div>
          <div className="rounded-xl bg-ocean/20 px-4 py-2 font-display text-xl font-bold">✨ +{rewards.xp} XP</div>
          <div className="rounded-xl bg-tropical/20 px-4 py-2 font-display text-xl font-bold">🍃 +{rewards.eco}</div>
        </div>
        {rewards.leveledUp && <div className="mt-3 font-display text-xl font-bold text-sunset">⭐ Level up! You are now level {rewards.level}</div>}
        {cleanliness !== null && cleanliness !== undefined && (
          <div className="mt-3 rounded-xl bg-tropical/10 p-2 font-bold text-tropical">🧹 {mission.spotName} is now {Number(cleanliness).toFixed(0)}% clean thanks to you!</div>
        )}
        {rewards.badge && !cert && <div className="mt-3 text-lg font-bold">🏅 New badge: {rewards.badge.name}</div>}
        {rewards.achievements?.map((a) => (
          <div key={a} className="mt-1 font-bold">🏆 Achievement unlocked: {a}</div>
        ))}
        {cert && (
          <div className="mx-auto mt-4 max-w-sm rounded-xl border-8 border-double border-sunset bg-[#fffaf0] p-5 font-display shadow-inner">
            <div className="text-xs font-bold tracking-widest text-ocean">SIARGAO PIXEL LIFE</div>
            <div className="text-2xl font-extrabold">{rewards.badge.name}</div>
            <div className="mt-2 text-sm font-body">This certifies that</div>
            <div className="text-2xl font-extrabold text-tropical">{profile?.username}</div>
            <div className="mt-1 text-sm font-body">explored responsibly, protected the environment and supported local communities at {mission.spotName}.</div>
            <div className="mt-2 text-xs font-body text-navy/60">{new Date().toLocaleDateString()}</div>
          </div>
        )}
      </div>
    </Modal>
  );
}
