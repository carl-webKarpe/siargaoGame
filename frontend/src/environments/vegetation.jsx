/**
 * Instanced vegetation: coconut palms with real leaflets, dense rainforest
 * canopy for the hills, grass tufts and seaweed wrack lines. Everything is
 * instanced so hundreds of plants cost only a few draw calls.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { rng, scatter, seedFrom } from './terrain.js';
import { detailMaterial } from './materials.js';

const tmpC = new THREE.Color();

function withColor(geo, color, color2, axis = 'y') {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const pos = g.attributes.position;
  const arr = new Float32Array(pos.count * 3);
  const a = new THREE.Color(color);
  const b = new THREE.Color(color2 || color);
  g.computeBoundingBox();
  const bb = g.boundingBox;
  const span = Math.max(1e-4, bb.max[axis] - bb.min[axis]);
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getComponent(i, axis === 'x' ? 0 : axis === 'y' ? 1 : 2) - bb.min[axis]) / span;
    tmpC.copy(a).lerp(b, t);
    arr[i * 3] = tmpC.r;
    arr[i * 3 + 1] = tmpC.g;
    arr[i * 3 + 2] = tmpC.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  if (g.attributes.uv) g.deleteAttribute('uv');
  return g;
}

/** One palm frond: a drooping rib with two rows of hanging leaflets. */
function frondGeometry(len, r, colA, colB, dead = false) {
  const pos = [];
  const col = [];
  const cA = new THREE.Color(colA);
  const cB = new THREE.Color(colB);
  const rib = (x) => new THREE.Vector3(x, -Math.pow(x / len, 2) * len * (dead ? 0.9 : 0.42), 0);
  const tri = (a, b, c, ca, cb, cc) => {
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    col.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b, cc.r, cc.g, cc.b);
  };
  const N = 16;
  for (let k = 1; k < N; k++) {
    const t = k / N;
    const p = rib(t * len);
    const pn = rib((t + 0.06) * len);
    const lf = (dead ? 0.7 : 1.15) * Math.sin(Math.PI * Math.min(1, t * 1.15)) + 0.15;
    for (const side of [-1, 1]) {
      const droop = dead ? 0.9 : 0.55 + r() * 0.2;
      const tip = new THREE.Vector3(p.x + lf * 0.35, p.y - lf * droop, side * lf * (0.85 - droop * 0.3));
      const base2 = pn.clone();
      const cTip = cA.clone().lerp(cB, 0.6 + r() * 0.4);
      tri(p, tip, base2, cA, cTip, cA);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

function buildPalm(variant) {
  const r = rng(variant * 13 + 5);
  const parts = [];
  const height = 8 + r() * 2.5;
  const bend = 1.2 + r() * 1.6;
  const segs = 10;
  const pts = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    pts.push(new THREE.Vector3(Math.pow(t, 1.8) * bend, t * height, 0));
  }
  for (let i = 0; i < segs; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const len = a.distanceTo(b);
    const cyl = new THREE.CylinderGeometry(0.19 - i * 0.006, 0.24 - i * 0.006, len * 1.02, 9, 1);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    cyl.applyQuaternion(q);
    cyl.translate((a.x + b.x) / 2, (a.y + b.y) / 2, 0);
    parts.push(withColor(cyl, i % 2 ? '#8a7356' : '#7a6448', i % 2 ? '#9a8262' : '#6f5a40'));
  }
  // base flare
  const flare = new THREE.CylinderGeometry(0.26, 0.42, 0.6, 9);
  flare.translate(0, 0.25, 0);
  parts.push(withColor(flare, '#6a563e'));
  const top = pts[segs];
  const fronds = 12;
  for (let i = 0; i < fronds; i++) {
    const dead = i >= fronds - 2;
    const len = (dead ? 3.2 : 4.2) + r() * 1.0;
    const f = frondGeometry(len, r, dead ? '#9b8a55' : '#3f7d2f', dead ? '#b7a26a' : i % 3 ? '#76b043' : '#5f9e3a', dead);
    f.rotateZ(dead ? -0.5 : 0.45 - r() * 0.35);
    f.rotateY((i / fronds) * Math.PI * 2 + r() * 0.4);
    f.translate(top.x, top.y, top.z);
    parts.push(f);
  }
  for (let i = 0; i < 5; i++) {
    const nut = new THREE.SphereGeometry(0.2, 7, 6);
    const a = (i / 5) * Math.PI * 2;
    nut.translate(top.x + Math.cos(a) * 0.28, top.y - 0.3 - (i % 2) * 0.15, Math.sin(a) * 0.28);
    parts.push(withColor(nut, i % 2 ? '#7b8f2a' : '#5e6b20'));
  }
  return mergeGeometries(parts);
}

function swayMaterial(base, amount = 0.25, height = 9) {
  const m = base;
  m.userData.time = { value: 0 };
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (shader, r) => {
    prev?.call(m, shader, r);
    shader.uniforms.uTime = m.userData.time;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         float swayK = pow(max(position.y, 0.0) / ${height.toFixed(1)}, 2.0);
         float swayPh = instanceMatrix[3].x * 0.31 + instanceMatrix[3].z * 0.17;
         transformed.x += (sin(uTime * 1.2 + swayPh) + 0.4 * sin(uTime * 3.1 + swayPh * 2.0)) * ${amount.toFixed(2)} * swayK;
         transformed.z += cos(uTime * 1.0 + swayPh) * ${(amount * 0.7).toFixed(2)} * swayK;`
      );
  };
  m.customProgramCacheKey = () => `sway-${amount}-${height}`;
  return m;
}

function applyInstances(mesh, list, groundAt, sink = 0.2) {
  if (!mesh) return;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  list.forEach((p, i) => {
    const s = p.s ?? 1;
    e.set((p.lean ?? 0) * 0.18, p.rot ?? 0, (p.tilt ?? 0) * 0.1);
    q.setFromEuler(e);
    m.compose(new THREE.Vector3(p.x, groundAt(p.x, p.z) - sink * s, p.z), q, new THREE.Vector3(s * (p.sx ?? 1), s * (p.sy ?? 1), s * (p.sx ?? 1)));
    mesh.setMatrixAt(i, m);
    if (p.color && mesh.instanceColor !== undefined) mesh.setColorAt(i, tmpC.set(p.color));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
}

/** Coconut palms with leaflet fronds and wind sway. */
export function Palms({ items, groundAt }) {
  const geos = useMemo(() => [buildPalm(1), buildPalm(2), buildPalm(3)], []);
  const material = useMemo(
    () => swayMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }), 0.35, 10),
    []
  );
  const groups = useMemo(() => [0, 1, 2].map((k) => items.filter((_, i) => i % 3 === k)), [items]);
  useFrame((_, dt) => {
    material.userData.time.value += dt;
  });
  return groups.map((list, gi) =>
    list.length ? (
      <instancedMesh key={`${gi}-${list.length}`} ref={(mesh) => applyInstances(mesh, list, groundAt, 0.15)} args={[geos[gi], material, list.length]} castShadow receiveShadow />
    ) : null
  );
}

/** Dense rainforest canopy (as on the hills behind Pacifico and around Sugba). */
export function Jungle({ items, groundAt }) {
  const geo = useMemo(() => {
    const parts = [];
    const r = rng(7);
    // a canopy clump: several overlapping lumpy spheres
    for (let i = 0; i < 5; i++) {
      const g = new THREE.IcosahedronGeometry(0.55 + r() * 0.35, 2);
      const p = g.attributes.position;
      for (let k = 0; k < p.count; k++) {
        const v = new THREE.Vector3(p.getX(k), p.getY(k), p.getZ(k));
        const n = Math.sin(v.x * 7.1 + i) * Math.sin(v.y * 6.3) * Math.sin(v.z * 5.7 + i * 2) * 0.12;
        v.multiplyScalar(1 + n);
        v.y *= 0.75;
        p.setXYZ(k, v.x, v.y, v.z);
      }
      const a = (i / 5) * Math.PI * 2;
      g.translate(i ? Math.cos(a) * 0.55 : 0, i ? 0.05 + r() * 0.2 : 0.35, i ? Math.sin(a) * 0.55 : 0);
      parts.push(g);
    }
    const trunk = new THREE.CylinderGeometry(0.08, 0.12, 1.4, 6);
    trunk.translate(0, -0.6, 0);
    parts.push(trunk);
    const merged = mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)).map((g) => {
      if (g.attributes.uv) g.deleteAttribute('uv');
      return g;
    }));
    merged.computeVertexNormals();
    return merged;
  }, []);
  const material = useMemo(() => detailMaterial('foliage', { material: { roughness: 0.9, color: '#ffffff' } }), []);
  if (!items.length) return null;
  return <instancedMesh key={items.length} ref={(mesh) => applyInstances(mesh, items, groundAt, 0.1)} args={[geo, material, items.length]} castShadow receiveShadow />;
}

/** Grass tufts with sway. */
export function Grass({ items, groundAt }) {
  const geo = useMemo(() => {
    const parts = [];
    for (let i = 0; i < 4; i++) {
      const blade = new THREE.PlaneGeometry(0.7, 0.7, 1, 2);
      const p = blade.attributes.position;
      for (let k = 0; k < p.count; k++) {
        const y = p.getY(k) + 0.35;
        p.setY(k, y);
        p.setX(k, p.getX(k) * (1 - y * 0.9));
        p.setZ(k, y * y * 0.25);
      }
      blade.rotateY((i / 4) * Math.PI);
      parts.push(withColor(blade, '#2f6a24', '#a8c96a'));
    }
    return mergeGeometries(parts);
  }, []);
  const material = useMemo(
    () => swayMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1 }), 0.12, 0.8),
    []
  );
  useFrame((_, dt) => {
    material.userData.time.value += dt;
  });
  if (!items.length) return null;
  return <instancedMesh key={items.length} ref={(mesh) => applyInstances(mesh, items, groundAt, 0.02)} args={[geo, material, items.length]} receiveShadow />;
}

/** Dark seaweed wrack line on the sand (as in the Pacifico photo). */
export function Wrack({ items, groundAt }) {
  const geo = useMemo(() => {
    const g = new THREE.CircleGeometry(0.5, 7);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6b5a3a', roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }), []);
  if (!items.length) return null;
  return <instancedMesh key={items.length} ref={(mesh) => applyInstances(mesh, items, (x, z) => groundAt(x, z) + 0.03, 0)} args={[geo, material, items.length]} receiveShadow />;
}

// ------------------------------------------------------------------ generators

const JUNGLE_GREENS = ['#2f6b2a', '#3a7d30', '#4a8c36', '#2a5f28', '#567f2e', '#3e7536'];

/** Rainforest canopy scattered on hills (height between min and max). */
export function genJungle(layout, { count = 300, areas, min = 2.5, max = 60, minDist = 3, avoid = [], scale = [3, 6] } = {}) {
  const a = areas || [{ x0: -layout.size / 2, x1: layout.size / 2, z0: -layout.size / 2, z1: layout.size / 2 }];
  return scatter(seedFrom(layout.key + 'jungle'), count, a, (x, z) => {
    const h = layout.height(x, z);
    if (h < min || h > max) return false;
    return !avoid.some((p) => Math.hypot(p[0] - x, p[1] - z) < (p[2] ?? 6));
  }, minDist).map((p, i) => ({
    x: p.x, z: p.z, s: scale[0] + p.r * (scale[1] - scale[0]), rot: p.r * 6.28, sy: 0.9 + (i % 3) * 0.12,
    color: JUNGLE_GREENS[i % JUNGLE_GREENS.length],
  }));
}

/** Grass tufts on gentle grassy ground. */
export function genGrass(layout, count) {
  if (!count) return [];
  const sandTop = layout.palette.sandTop ?? 1.1;
  const half = Math.min(layout.size / 2, 90);
  return scatter(seedFrom(layout.key + 'grass'), count, [{ x0: -half, x1: half, z0: -half, z1: half }], (x, z) => {
    const h = layout.height(x, z);
    if (h < sandTop + 0.35 || h > (layout.grassMax ?? 14)) return false;
    const slope = Math.hypot(layout.height(x + 1, z) - h, layout.height(x, z + 1) - h);
    return slope < 0.45;
  }, 0.9).map((p) => ({ x: p.x, z: p.z, s: 0.7 + p.r * 0.9, rot: p.r * 6.28 }));
}
