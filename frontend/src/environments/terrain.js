/** Math helpers for procedural destination terrain. */

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Smooth value noise in [0, 1]. */
export function noise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}

/** Fractal noise in roughly [0, 1]. */
export function fbm(x, y, oct = 3) {
  let sum = 0;
  let amp = 0.5;
  let f = 1;
  for (let i = 0; i < oct; i++) {
    sum += amp * noise(x * f, y * f);
    f *= 2;
    amp *= 0.5;
  }
  return sum / (1 - Math.pow(0.5, oct));
}

/** Deterministic PRNG (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const seedFrom = (str) => [...str].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

/** Height of the walkable surface (terrain or platform) at (x, z). */
export function groundHeight(layout, x, z) {
  let h = layout.height(x, z);
  for (const p of layout.platforms || []) {
    if (Math.abs(x - p.x) <= p.w / 2 && Math.abs(z - p.z) <= p.d / 2) h = Math.max(h, p.y);
  }
  return h;
}

export function onPlatform(layout, x, z) {
  return (layout.platforms || []).some((p) => Math.abs(x - p.x) <= p.w / 2 && Math.abs(z - p.z) <= p.d / 2);
}

/** Scatter points inside rectangles with a validity predicate. */
export function scatter(seed, count, areas, valid, minDist = 2) {
  const r = rng(seed);
  const out = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 200) {
    const a = areas[Math.floor(r() * areas.length)];
    const x = lerp(a.x0, a.x1, r());
    const z = lerp(a.z0, a.z1, r());
    if (!valid(x, z, a)) continue;
    if (out.some((p) => Math.hypot(p.x - x, p.z - z) < minDist)) continue;
    out.push({ x, z, r: r(), area: a });
  }
  return out;
}
