import { useEffect } from 'react';

/** Accessible modal panel used across the game UI. */
export default function Modal({ title, icon, onClose, children, wide = false, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-navy/50 p-3 backdrop-blur-sm" onPointerDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`panel-light animate-floatUp flex max-h-[92vh] w-full flex-col overflow-hidden ${wide ? 'max-w-4xl' : 'max-w-xl'}`}>
        <div className="flex items-center justify-between bg-navy px-5 py-3 text-white">
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
            {icon && <span aria-hidden>{icon}</span>}
            {title}
          </h2>
          {onClose && (
            <button onClick={onClose} className="rounded-full p-1 text-2xl leading-none text-white/80 hover:bg-white/10 hover:text-white" aria-label="Close">
              ×
            </button>
          )}
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-t border-navy/10 bg-sand/30 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
