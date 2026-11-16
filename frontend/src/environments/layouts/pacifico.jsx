/**
 * Pacifico Beach, San Isidro — modelled on the aerial photo: a long, wide
 * white-sand beach with a dark seaweed wrack line, a jungle-covered hill rising
 * behind it, a white resort with a thick thatched roof, cabanas behind a low
 * fence, surfboards on the sand and clear turquoise water over dark reef patches.
 */
import { useRef } from 'react';
import { fbm, lerp, scatter, seedFrom, smooth } from '../terrain.js';
import { genPalms, LOOKS, PALETTES } from '../common.js';
import { genJungle } from '../vegetation.jsx';
import { Birds, Cabana, DistantIslands, EcoBin, Fence, ResortHouse, Sign, Surfboard, SurfRack, Umbrella } from '../props.jsx';
import Humanoid from '../../characters/Humanoid.jsx';
import SurfBreak from '../../activities/surfing/SurfBreak.jsx';

const shore = (x) => 4 + Math.sin(x * 0.018) * 6 + Math.sin(x * 0.07) * 1.2;

function height(x, z) {
  const d = z - shore(x);
  if (d >= 0) {
    // wide beach -> grass terrace -> steep jungle hill
    let h = Math.min(1.5, d * 0.07) + fbm(x * 0.15, z * 0.15) * 0.08;
    h += smooth(26, 34, d) * 0.5;
    h += smooth(36, 95, d) * (26 + fbm(x * 0.02, z * 0.03) * 16) * (0.75 + 0.25 * Math.sin(x * 0.03));
    return h;
  }
  // reef flat: shallow and clear, with dark coral/rock patches, then the drop-off
  let h = Math.max(-1.1, d * 0.09) - fbm(x * 0.12, z * 0.12) * 0.35;
  return lerp(h, -9, smooth(-40, -64, d));
}

const resort = { x: 22, z: 40 };
const cabanas = [[4, 34, 0.1], [10, 36, -0.1], [36, 36, 0.2], [44, 33, -0.15], [-14, 34, 0.15]];

const layout = {
  key: 'pacifico',
  size: 260,
  spawn: [-4, 20],
  spawnYaw: 0.5,
  palette: { ...PALETTES.white, sand: '#e9dcc0', wet: '#d6c6a2', under: '#dccfab', reef: '#4f5241', sandTop: 1.9, grass: '#6aa84a', grass2: '#3f8a3e' },
  reef: true,
  water: { clear: '#b8f5ea', shallow: '#3fd6cf', deep: '#0b5e98', wave: 1.1, depthScale: 9, clarity: 0.72 },
  height,
  platforms: [],
  grassCount: 1100,
  grassMax: 6,
  obstacles: [
    { x: resort.x, z: resort.z, r: 7 },
    ...cabanas.map(([x, z]) => ({ x, z, r: 2.2 })),
    { x: -30, z: 30, r: 1.8 },
  ],
  npcs: [
    { key: 'surfer_aya', pos: [-8, 13], rotY: 0.6, look: { ...LOOKS.surfer, shirt: '#ef476f', hair: '#3b1d0b' }, prop: 'surfboard' },
    { key: 'volunteer_carlo', pos: [12, 17], rotY: -0.5, look: LOOKS.volunteer, quiz: 'turtle_safety' },
  ],
  info: null,
  trashAreas: [{ x0: -95, x1: 95, z0: -2, z1: 34 }],
  trashValid: (x, z) => {
    const h = height(x, z);
    return h > 0.08 && h < 1.9;
  },
  surf: { entry: { x: -20, z: shore(-20) + 1.5 }, lineupZ: -58, endZ: -30, peelStart: -46, peelEnd: 30, scenic: true },
  islands: [{ x: -300, z: -260, s: 60 }, { x: 260, z: -320, s: 80 }],
  Features,
};

const avoid = [[resort.x, resort.z, 10], ...cabanas.map(([x, z]) => [x, z, 4]), [-4, 20, 10], [-8, 13, 3], [12, 17, 3], [-30, 30, 3]];
layout.palms = genPalms('pacifico', 95, [{ x0: -125, x1: 125, z0: 22, z1: 75 }], layout, { min: 1.2, max: 30, avoid, minDist: 4.5 });
layout.jungle = genJungle(layout, { count: 650, min: 4, areas: [{ x0: -130, x1: 130, z0: 35, z1: 130 }], avoid, minDist: 3.4, scale: [3.5, 7.5] });

// Seaweed wrack line roughly halfway up the beach, plus scattered clumps.
layout.wrack = scatter(seedFrom('pacifico-wrack'), 420, [{ x0: -110, x1: 110, z0: -5, z1: 30 }], (x, z) => {
  const d = z - shore(x);
  const line = 9 + Math.sin(x * 0.11) * 2.5;
  return Math.abs(d - line) < 0.5 + fbm(x * 0.3, 0) * 0.9 || (d > 3 && d < 22 && fbm(x * 0.5, z * 0.5) > 0.86);
}, 0.45).map((p) => ({ x: p.x, z: p.z, s: 0.1 + p.r * 0.22, sx: 2.2, rot: p.r * 6.28 }));

/** Surfers hanging out on the sand with their boards. */
function BeachExtras({ groundAt }) {
  const anims = [useRef({ pose: 'stand' }), useRef({ pose: 'stand' }), useRef({ pose: 'stand' })];
  const people = [
    { x: -14, z: 8, rot: -2.4, look: { shirt: '#1d3557', shorts: '#e63946', skin: '#8d5524' }, board: '#ffd166' },
    { x: -2, z: 6.5, rot: 2.6, look: { shirt: '#ffffff', shorts: '#2a9d8f', skin: '#c68b59' }, board: '#ef476f' },
    { x: 26, z: 9, rot: -2.8, look: { shirt: '#f4a261', shorts: '#264653', skin: '#a8703f' }, board: '#ffffff' },
  ];
  return (
    <group>
      {people.map((p, i) => (
        <group key={i} position={[p.x, groundAt(p.x, p.z), p.z]} rotation-y={p.rot}>
          <Humanoid look={p.look} anim={anims[i]} />
          <Surfboard position={[0.55, 1.1, 0]} rotation={[0, 0, 1.45]} color={p.board} />
        </group>
      ))}
      {[[-24, 3.5, 0.3, '#ffd166'], [-20, 2.8, -0.2, '#ffd166'], [6, 3.2, 0.5, '#ffffff'], [-28, 5, 1.2, '#ef476f']].map(([x, z, r, c], i) => (
        <Surfboard key={i} position={[x, groundAt(x, z) + 0.08, z]} rotation={[0, r, 0]} color={c} length={2.8} />
      ))}
    </group>
  );
}

function Features({ groundAt }) {
  const y = (x, z) => groundAt(x, z);
  return (
    <group>
      <ResortHouse position={[resort.x, y(resort.x, resort.z) - 0.2, resort.z]} rotation={Math.PI} sign="PACIFICO SURF RESORT" />
      {cabanas.map(([x, z, r], i) => (
        <Cabana key={i} position={[x, y(x, z) - 0.1, z]} rotation={r} size={3.2} color={i % 2 ? '#6e5132' : '#8a6a40'} />
      ))}
      <Fence from={[-20, 29]} to={[0, 30]} groundAt={groundAt} />
      <Fence from={[48, 29]} to={[70, 27]} groundAt={groundAt} />
      <Sign position={[-30, y(-30, 30), 30]} rotation={0.4} title="PACIFICO" subtitle="San Isidro · Turtle zone ahead" width={5} height={1.6} postHeight={2.2} accent="#2e8b57" />
      <Sign position={[20, y(20, 12), 12]} rotation={-0.4} title="KEEP 3M FROM TURTLES" subtitle="Do not chase or touch" width={4.6} height={1.3} bg="#2e8b57" accent="#f4d6a0" />
      <SurfRack position={[-22, y(-22, 26), 26]} rotation={0.2} />
      <Umbrella position={[-34, y(-34, 18), 18]} color="#00b4d8" />
      <Umbrella position={[52, y(52, 16), 16]} color="#ff9f43" />
      <EcoBin position={[2, y(2, 22), 22]} />
      <EcoBin position={[30, y(30, 26), 26]} />
      <BeachExtras groundAt={groundAt} />
      <Birds center={[0, 0, -10]} radius={55} height={30} />
      <DistantIslands items={layout.islands} />
      <SurfBreak layout={layout} />
    </group>
  );
}

export default layout;
