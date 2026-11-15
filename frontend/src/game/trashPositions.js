import { scatter, seedFrom } from '../environments/terrain.js';

/**
 * Deterministic trash spawn points for a destination. Index i always maps to the
 * same position, so the backend can validate pickups by index.
 */
export function trashPositions(layout, total) {
  const pts = scatter(seedFrom(layout.key + ':trash'), total, layout.trashAreas, (x, z, a) => layout.trashValid(x, z, a), 3);
  return pts.map((p, i) => ({ index: i, x: p.x, z: p.z, water: !!p.area.water, variant: i % 5, rot: p.r * Math.PI * 2 }));
}
