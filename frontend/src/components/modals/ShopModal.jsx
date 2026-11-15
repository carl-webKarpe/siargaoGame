import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { api } from '../../services/api.js';
import { useGame } from '../../game/store.js';

const TABS = [['surfboard', '🏄 Surfboards'], ['cosmetic', '👕 Style'], ['local_product', '🧺 Local products']];

export default function ShopModal({ onClose, tab: initialTab = 'surfboard' }) {
  const profile = useGame((s) => s.profile);
  const spotKey = useGame((s) => s.spotKey);
  const spots = useGame((s) => s.spots);
  const buy = useGame((s) => s.buy);
  const [items, setItems] = useState(null);
  const [tab, setTab] = useState(initialTab);
  const [busy, setBusy] = useState(null);

  const load = () => api.shopItems().then((r) => setItems(r.items));
  useEffect(() => {
    load();
  }, []);

  const purchase = async (key) => {
    setBusy(key);
    const r = await buy(key);
    setBusy(null);
    if (r) load();
  };
  const spotName = (k) => spots.find((s) => s.key === k)?.name || k;

  return (
    <Modal title="Island Shop" icon="🛍️" onClose={onClose} wide>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-3 py-1.5 text-sm font-bold ${tab === k ? 'bg-navy text-white' : 'bg-navy/10'}`}>{l}</button>
        ))}
        <span className="ml-auto rounded-full bg-yellow-300 px-3 py-1 font-display font-bold">🪙 {profile?.coins}</span>
      </div>
      {tab === 'local_product' && (
        <p className="mb-3 rounded-xl bg-tropical/10 p-3 text-sm font-semibold text-tropical">
          Buying local keeps tourism money inside Siargao's communities. Local products can only be bought at their destination.
        </p>
      )}
      {!items ? (
        <p>Loading…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {items.filter((i) => i.type === tab).map((i) => {
            const here = !i.spotKey || i.spotKey === spotKey;
            return (
              <div key={i.key} className="flex flex-col rounded-2xl border-2 border-navy/10 p-3">
                <div className="h-2 rounded-full" style={{ background: i.data.color || '#ff9f43' }} />
                <div className="mt-2 font-display text-lg font-bold">{i.name}</div>
                <p className="flex-1 text-sm text-navy/70">{i.description}</p>
                {i.type === 'surfboard' && (
                  <div className="mt-1 text-xs font-semibold text-navy/60">
                    Stability {Math.round(i.data.stability * 100)} · Turn {Math.round(i.data.turn * 100)} · Speed {Math.round(i.data.speed * 100)}
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-display text-lg font-bold">🪙 {i.price}</span>
                  {i.owned ? (
                    <span className="font-bold text-tropical">✔ Owned</span>
                  ) : !here ? (
                    <span className="text-xs font-bold text-navy/60">Available at {spotName(i.spotKey)}</span>
                  ) : (
                    <button className="btn-primary btn-sm" disabled={busy === i.key || (profile?.coins ?? 0) < i.price} onClick={() => purchase(i.key)}>
                      Buy
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
