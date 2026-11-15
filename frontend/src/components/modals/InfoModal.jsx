import { useEffect, useRef } from 'react';
import Modal from '../ui/Modal.jsx';
import { useGame } from '../../game/store.js';

/** Educational info board. Reading it is recorded as an explore activity. */
export default function InfoModal({ title, text, activity, index, onClose }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    useGame.getState().completeActivity(activity, { pointIndex: index });
  }, [activity, index]);
  return (
    <Modal title={title} icon="ℹ️" onClose={onClose} footer={<button className="btn-ocean w-full" onClick={onClose} autoFocus>Got it!</button>}>
      <p className="text-lg font-semibold leading-relaxed">{text}</p>
      <p className="mt-4 rounded-xl bg-tropical/10 p-3 text-sm font-bold text-tropical">🌏 Siargao is everyone's responsibility — share what you learned!</p>
    </Modal>
  );
}
