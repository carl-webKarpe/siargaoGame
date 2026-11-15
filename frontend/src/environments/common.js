import { scatter, seedFrom } from './terrain.js';

/** Scatter palm trees on valid land. */
export function genPalms(key, count, areas, layout, { min = 0.4, max = 5, avoid = [], minDist = 4 } = {}) {
  return scatter(seedFrom(key + 'palms'), count, areas, (x, z) => {
    const h = layout.height(x, z);
    if (h < min || h > max) return false;
    return !avoid.some((a) => Math.hypot(a[0] - x, a[1] - z) < (a[2] ?? 6));
  }, minDist).map((p) => ({ x: p.x, z: p.z, s: 0.8 + p.r * 0.55, rot: p.r * Math.PI * 2, lean: p.r - 0.5 }));
}

export const PALETTES = {
  beach: { sand: '#f4d6a0', wet: '#dcb97f', grass: '#5fa548', grass2: '#3f8a3e', rock: '#8a8577', under: '#d7c28e', reef: '#c46b8a', sandTop: 1.2 },
  white: { sand: '#fbf1dc', wet: '#eadbb8', grass: '#6db552', grass2: '#4b9a47', rock: '#9a958a', under: '#e8dcb5', reef: '#d07a96', sandTop: 1.5 },
  rocky: { sand: '#e9cf9b', wet: '#c6ae80', grass: '#4f9a45', grass2: '#3a7d3a', rock: '#6f6a61', under: '#a99a7a', rockSlope: 0.5, sandTop: 0.6 },
  lagoon: { sand: '#e6d3a5', wet: '#b7a57a', grass: '#3e8a3d', grass2: '#2f7535', rock: '#8e8a7f', under: '#7f9a6d', rockSlope: 0.7, sandTop: 0.5 },
  forest: { sand: '#bfa77a', wet: '#8f7d58', grass: '#3d8b3d', grass2: '#2a6e30', rock: '#7b776d', under: '#6a7a5a', rockSlope: 0.75, sandTop: 0.2 },
};

/** Common look presets for NPC characters. */
export const LOOKS = {
  surfer: { shirt: '#00b4d8', shorts: '#ff9f43', skin: '#a8703f', hair: '#1a1008' },
  volunteer: { shirt: '#2e8b57', shorts: '#2b2b2b', skin: '#c68b59', hair: '#3b2414' },
  elder: { shirt: '#f4d6a0', shorts: '#5b3a1e', skin: '#b07a4a', hair: '#d9d9d9' },
  guide: { shirt: '#ff9f43', shorts: '#102a43', skin: '#c08050', hair: '#20140a', hat: { style: 'cap', color: '#102a43' } },
  leader: { shirt: '#ffffff', shorts: '#3a3a3a', skin: '#b67b4c', hair: '#151515' },
  fisher: { shirt: '#4a6fa5', shorts: '#3a2a1a', skin: '#8f5a30', hair: '#111', hat: { style: 'salakot', color: '#c8a165' } },
  vendor: { shirt: '#ef476f', shorts: '#2b2b2b', skin: '#c68b59', hair: '#2a160a' },
  ranger: { shirt: '#556b2f', shorts: '#556b2f', skin: '#b5794a', hair: '#1a1a1a', hat: { style: 'cap', color: '#3b4a1f' } },
  boatman: { shirt: '#f0f0f0', shorts: '#1f3b5a', skin: '#8a552b', hair: '#111' },
};
