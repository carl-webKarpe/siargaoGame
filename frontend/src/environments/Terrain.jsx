import { useMemo } from 'react';
import * as THREE from 'three';
import { fbm } from './terrain.js';

const tmp = new THREE.Color();
const tmp2 = new THREE.Color();

/** Low-poly terrain mesh generated from a layout's height function. */
export default function Terrain({ layout, resolution = 120 }) {
  const geometry = useMemo(() => {
    const size = layout.size;
    const g = new THREE.PlaneGeometry(size, size, resolution, resolution);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const pal = layout.palette;
    const c = {
      sand: new THREE.Color(pal.sand),
      wet: new THREE.Color(pal.wet || '#d9b77c'),
      grass: new THREE.Color(pal.grass),
      grass2: new THREE.Color(pal.grass2 || pal.grass),
      rock: new THREE.Color(pal.rock),
      under: new THREE.Color(pal.under || '#c8b48a'),
      reef: new THREE.Color(pal.reef || '#c86b85'),
    };
    const sandTop = pal.sandTop ?? 1.1;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = layout.height(x, z);
      pos.setY(i, h);
      const dx = layout.height(x + 1, z) - h;
      const dz = layout.height(x, z + 1) - h;
      const slope = Math.hypot(dx, dz);
      const n = fbm(x * 0.08, z * 0.08, 2);
      if (h < -0.15) {
        tmp.copy(c.under).multiplyScalar(0.75 + 0.25 * Math.max(0, 1 + h / 6));
        if (layout.reef && h < -0.3 && h > -3.5 && n > 0.55) tmp.lerp(c.reef, (n - 0.55) * 2.2);
      } else if (h < 0.25) {
        tmp.copy(c.wet);
      } else if (h < sandTop) {
        tmp.copy(c.sand).lerp(tmp2.copy(c.wet), 0.15 * n);
      } else {
        tmp.copy(c.grass).lerp(c.grass2, n);
        if (h < sandTop + 0.5) tmp.lerp(c.sand, 1 - (h - sandTop) / 0.5);
      }
      if (slope > (pal.rockSlope ?? 0.9) || h > (pal.rockHeight ?? 99)) tmp.lerp(c.rock, Math.min(1, (slope - 0.6) * 1.5 + (h > (pal.rockHeight ?? 99) ? 0.8 : 0)));
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [layout, resolution]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors flatShading roughness={0.95} metalness={0} />
    </mesh>
  );
}
