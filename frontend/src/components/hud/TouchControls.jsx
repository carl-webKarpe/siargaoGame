import { useRef, useState } from 'react';
import { input, press, release } from '../../game/input.js';

/** Virtual joystick + action buttons for phones and tablets. */
export default function TouchControls({ mode }) {
  const base = useRef();
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [run, setRun] = useState(false);
  const pid = useRef(null);

  const update = (e) => {
    const r = base.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = (e.clientX - cx) / (r.width / 2);
    let dy = (e.clientY - cy) / (r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    input.joystick.x = dx;
    input.joystick.y = -dy;
    setKnob({ x: dx, y: dy });
  };
  const end = () => {
    pid.current = null;
    input.joystick.x = 0;
    input.joystick.y = 0;
    setKnob({ x: 0, y: 0 });
  };
  const btn = (action, label, cls) => (
    <button
      className={`grid select-none place-items-center rounded-full border-2 border-white/60 font-display font-extrabold shadow-xl active:scale-95 ${cls}`}
      onPointerDown={(e) => {
        e.stopPropagation();
        press(action);
      }}
      onPointerUp={() => release(action)}
      onPointerLeave={() => release(action)}
    >
      {label}
    </button>
  );
  return (
    <>
      <div
        ref={base}
        className="pointer-events-auto absolute bottom-28 left-6 z-30 h-32 w-32 touch-none rounded-full border-2 border-white/40 bg-white/15 backdrop-blur"
        onPointerDown={(e) => {
          e.stopPropagation();
          pid.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          update(e);
        }}
        onPointerMove={(e) => pid.current === e.pointerId && update(e)}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <div className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full bg-white/70 shadow" style={{ transform: `translate(calc(-50% + ${knob.x * 36}px), calc(-50% + ${knob.y * 36}px))` }} />
      </div>
      <div className="pointer-events-auto absolute bottom-28 right-5 z-30 flex items-end gap-3">
        {mode === 'explore' && (
          <button
            className={`h-12 w-12 rounded-full border-2 border-white/60 text-sm font-bold shadow-xl ${run ? 'bg-sunset text-navy' : 'bg-navy/70'}`}
            onPointerDown={(e) => {
              e.stopPropagation();
              input.touchRun = !run;
              setRun(!run);
            }}
          >
            RUN
          </button>
        )}
        <div className="flex flex-col gap-3">
          {btn('interact', mode === 'surf' ? 'CATCH' : 'E', 'h-14 w-14 bg-ocean text-white text-base')}
          {mode !== 'kayak' && btn('jump', mode === 'surf' ? '🏄' : '⤒', 'h-16 w-16 bg-sunset text-navy text-2xl')}
        </div>
      </div>
    </>
  );
}
