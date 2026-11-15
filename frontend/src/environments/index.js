/**
 * Destination registry. Each layout is lazy-loaded so only the current
 * destination's code is downloaded.
 */
export const LAYOUT_LOADERS = {
  cloud9: () => import('./layouts/cloud9.jsx'),
  magpupungko: () => import('./layouts/magpupungko.jsx'),
  sugba: () => import('./layouts/sugba.jsx'),
  naked: () => import('./layouts/naked.jsx'),
  guyam: () => import('./layouts/guyam.jsx'),
  daku: () => import('./layouts/daku.jsx'),
  pacifico: () => import('./layouts/pacifico.jsx'),
  sohoton: () => import('./layouts/sohoton.jsx'),
  taktak: () => import('./layouts/taktak.jsx'),
};

/** Destinations added by admins with an unknown theme fall back to a generic beach. */
export async function loadLayout(theme) {
  const loader = LAYOUT_LOADERS[theme] || LAYOUT_LOADERS.pacifico;
  const mod = await loader();
  return mod.default;
}
