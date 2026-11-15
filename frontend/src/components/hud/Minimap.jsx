import { useEffect, useMemo, useRef } from 'react';
import { playerState } from '../../game/playerState.js';
import { interactables } from '../../game/registry.js';

const SIZE = 150;

/** Top-down minimap rendered from the layout's height function. */
export default function Minimap({ layout, spotName, coords = true }) {
  const canvas = useRef();
  const base = useMemo(() => {
    if (!layout) return null;
    const res = 96;
    const c = document.createElement('canvas');
    c.width = c.height = res;
    const g = c.getContext('2d');
    const img = g.createImageData(res, res);
    const range = Math.min(layout.size, 160);
    for (let j = 0; j < res; j++) {
      for (let i = 0; i < res; i++) {
        const x = (i / res - 0.5) * range;
        const z = (j / res - 0.5) * range;
        let h = layout.height(x, z);
        for (const p of layout.platforms || []) if (Math.abs(x - p.x) <= p.w / 2 && Math.abs(z - p.z) <= p.d / 2) h = 99;
        let col;
        if (h === 99) col = [139, 90, 50];
        else if (h < -2) col = [12, 110, 170];
        else if (h < -0.2) col = [60, 200, 210];
        else if (h < 1.2) col = [244, 214, 160];
        else if (h < 7) col = [80, 160, 80];
        else col = [120, 120, 110];
        const k = (j * res + i) * 4;
        img.data.set([...col, 255], k);
      }
    }
    g.putImageData(img, 0, 0);
    return { canvas: c, range };
  }, [layout]);

  useEffect(() => {
    let raf;
    const draw = () => {
      const cv = canvas.current;
      if (cv && base) {
        const g = cv.getContext('2d');
        g.clearRect(0, 0, SIZE, SIZE);
        g.save();
        g.beginPath();
        g.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2);
        g.clip();
        g.imageSmoothingEnabled = true;
        g.drawImage(base.canvas, 0, 0, SIZE, SIZE);
        const toMap = (x, z) => [(x / base.range + 0.5) * SIZE, (z / base.range + 0.5) * SIZE];
        for (const it of interactables.all()) {
          const [mx, my] = toMap(it.x, it.z);
          g.fillStyle = it.kind === 'npc' ? '#ffd166' : it.kind === 'trash' ? '#e63946' : it.kind === 'info' ? '#ffffff' : '#ff9f43';
          g.beginPath();
          g.arc(mx, my, it.kind === 'npc' ? 3.5 : 2.2, 0, Math.PI * 2);
          g.fill();
        }
        const [px, py] = toMap(playerState.pos.x, playerState.pos.z);
        g.translate(px, py);
        g.rotate(-playerState.camYaw);
        g.fillStyle = '#ffffff';
        g.strokeStyle = '#102a43';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(0, -8);
        g.lineTo(6, 6);
        g.lineTo(0, 3);
        g.lineTo(-6, 6);
        g.closePath();
        g.fill();
        g.stroke();
        g.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [base]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative rounded-full border-4 border-white/80 bg-ocean shadow-xl">
        <canvas ref={canvas} width={SIZE} height={SIZE} className="block h-28 w-28 sm:h-[150px] sm:w-[150px]" aria-label="Minimap" />
        <span className="absolute left-1/2 top-0.5 -translate-x-1/2 rounded bg-navy px-1 text-[10px] font-extrabold">N</span>
      </div>
      <div className="panel -mt-2 px-3 py-1 text-center">
        <div className="font-display text-base font-bold leading-tight sm:text-lg">📍 {spotName}</div>
        {coords && <Coords />}
      </div>
    </div>
  );
}

function Coords() {
  const ref = useRef();
  useEffect(() => {
    const id = setInterval(() => {
      if (ref.current) ref.current.textContent = `(X: ${Math.round(playerState.pos.x)}, Y: ${Math.round(playerState.pos.z)})`;
    }, 250);
    return () => clearInterval(id);
  }, []);
  return <div ref={ref} className="text-[10px] text-white/75" />;
}
