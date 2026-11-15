import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function makeTexture(draw, w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Name tag rendered as a camera-facing sprite (cheap, no DOM). */
export function NameTag({ name, role, position }) {
  const tex = useMemo(
    () =>
      makeTexture((g, w, h) => {
        g.fillStyle = 'rgba(16,42,67,0.85)';
        const r = 28;
        g.beginPath();
        g.roundRect(4, 4, w - 8, h - 8, r);
        g.fill();
        g.textAlign = 'center';
        g.fillStyle = '#ffffff';
        g.font = '800 40px Nunito, sans-serif';
        g.fillText(name, w / 2, role ? 52 : h / 2 + 14);
        if (role) {
          g.fillStyle = '#f4d6a0';
          g.font = '700 26px Nunito, sans-serif';
          g.fillText(role, w / 2, 90);
        }
      }, 400, role ? 112 : 72),
    [name, role]
  );
  useEffect(() => () => tex.dispose(), [tex]);
  const aspect = role ? 400 / 112 : 400 / 72;
  return (
    <sprite position={position} scale={[0.6 * aspect, 0.6, 1]} renderOrder={5}>
      <spriteMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  );
}

const SYMBOLS = { available: ['!', '#facc15'], active: ['?', '#38bdf8'], ready: ['✓', '#4ade80'] };

/** Bobbing quest marker above an NPC. */
export function QuestMarker({ type, position }) {
  const ref = useRef();
  const tex = useMemo(() => {
    const [sym, color] = SYMBOLS[type] || SYMBOLS.available;
    return makeTexture((g, w, h) => {
      g.font = '900 110px "Baloo 2", Nunito, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.lineWidth = 14;
      g.strokeStyle = '#102a43';
      g.strokeText(sym, w / 2, h / 2 + 6);
      g.fillStyle = color;
      g.fillText(sym, w / 2, h / 2 + 6);
    }, 128, 128);
  }, [type]);
  useEffect(() => () => tex.dispose(), [tex]);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 3) * 0.12;
  });
  return (
    <sprite ref={ref} position={position} scale={[0.9, 0.9, 1]} renderOrder={6}>
      <spriteMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  );
}

/** Emoji icon sprite used for activity markers. */
export function IconSprite({ icon, color, position }) {
  const ref = useRef();
  const tex = useMemo(
    () =>
      makeTexture((g, w, h) => {
        g.fillStyle = color;
        g.beginPath();
        g.arc(w / 2, h / 2, w / 2 - 6, 0, Math.PI * 2);
        g.fill();
        g.lineWidth = 8;
        g.strokeStyle = '#ffffff';
        g.stroke();
        g.font = '64px sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(icon, w / 2, h / 2 + 4);
      }, 128, 128),
    [icon, color]
  );
  useEffect(() => () => tex.dispose(), [tex]);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 2.5) * 0.15;
  });
  return (
    <sprite ref={ref} position={position} scale={[1, 1, 1]} renderOrder={6}>
      <spriteMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  );
}
