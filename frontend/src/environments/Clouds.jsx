import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { rng } from './terrain.js';

/** Soft cumulus texture painted from many overlapping radial puffs. */
function cloudTexture(seed) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d');
  const r = rng(seed);
  for (let i = 0; i < 38; i++) {
    const x = 40 + r() * 176;
    const y = 50 + r() * 50 - Math.abs(x - 128) * 0.15;
    const rad = 18 + r() * 34;
    const grad = g.createRadialGradient(x, y - rad * 0.3, rad * 0.1, x, y, rad);
    const shade = 225 + Math.floor(r() * 30);
    grad.addColorStop(0, `rgba(${shade},${shade},${shade + 5 > 255 ? 255 : shade + 5},0.55)`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, rad, 0, Math.PI * 2);
    g.fill();
  }
  // flat, slightly shaded base
  const base = g.createLinearGradient(0, 70, 0, 128);
  base.addColorStop(0, 'rgba(180,195,215,0)');
  base.addColorStop(1, 'rgba(180,195,215,0.25)');
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = base;
  g.fillRect(0, 0, 256, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Drifting cumulus clouds on a high ring around the destination. */
export default function Clouds({ count = 22, tint = '#ffffff', radius = 420 }) {
  const group = useRef();
  const textures = useMemo(() => [1, 2, 3, 4].map(cloudTexture), []);
  const items = useMemo(() => {
    const r = rng(99);
    return Array.from({ length: count }, (_, i) => {
      const a = r() * Math.PI * 2;
      const d = radius * (0.45 + r() * 0.55);
      const s = 70 + r() * 110;
      return { x: Math.cos(a) * d, z: Math.sin(a) * d, y: 70 + r() * 70 + d * 0.08, s, tex: i % 4 };
    });
  }, [count, radius]);
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.004;
  });
  return (
    <group ref={group}>
      {items.map((c, i) => (
        <sprite key={i} position={[c.x, c.y, c.z]} scale={[c.s, c.s * 0.5, 1]}>
          <spriteMaterial map={textures[c.tex]} color={tint} transparent depthWrite={false} fog={false} />
        </sprite>
      ))}
    </group>
  );
}
