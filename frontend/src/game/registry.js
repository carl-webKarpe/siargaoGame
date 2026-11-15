/**
 * Registry of interactable objects in the current scene.
 * Each entry: { id, kind, x, y, z, radius, label, hold?, onInteract(), data }
 */
const items = new Map();
const listeners = new Set();

export const interactables = {
  register(item) {
    items.set(item.id, item);
    return () => items.delete(item.id);
  },
  unregister(id) {
    items.delete(id);
  },
  all: () => items.values(),
  get: (id) => items.get(id),
  clear: () => items.clear(),
  /** Nearest interactable to (x, z) within its radius. */
  nearest(x, y, z) {
    let best = null;
    let bestD = Infinity;
    for (const it of items.values()) {
      if (it.disabled) continue;
      const d = Math.hypot(it.x - x, it.z - z);
      if (d < (it.radius ?? 2) && Math.abs((it.y ?? y) - y) < 3.5 && d < bestD) {
        best = it;
        bestD = d;
      }
    }
    return best;
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
