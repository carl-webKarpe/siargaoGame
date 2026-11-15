import * as THREE from 'three';

const cache = new Map();

function canvasTex(key, w, h, draw, repeat) {
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
  }
  cache.set(key, t);
  return t;
}

/** Wooden plank texture for boardwalks and decks. */
export const woodTexture = () =>
  canvasTex('wood', 128, 128, (g, w, h) => {
    const shades = ['#8a5a32', '#9b6a3e', '#7d4f2b', '#a87547', '#93633a'];
    const n = 8;
    for (let i = 0; i < n; i++) {
      g.fillStyle = shades[i % shades.length];
      g.fillRect(0, (i * h) / n, w, h / n);
      g.fillStyle = 'rgba(40,20,5,0.55)';
      g.fillRect(0, ((i + 1) * h) / n - 2, w, 2);
      for (let k = 0; k < 6; k++) {
        g.fillStyle = 'rgba(60,30,10,0.18)';
        g.fillRect(Math.random() * w, (i * h) / n + Math.random() * (h / n), 20 + Math.random() * 30, 1);
      }
    }
  }, true);

/** Woven nipa / thatch texture. */
export const thatchTexture = () =>
  canvasTex('thatch', 128, 128, (g, w, h) => {
    g.fillStyle = '#b8955a';
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 6) {
      for (let x = 0; x < w; x += 3) {
        g.fillStyle = `rgba(${90 + Math.random() * 60},${60 + Math.random() * 40},20,${0.25 + Math.random() * 0.3})`;
        g.fillRect(x, y + Math.random() * 3, 2, 6);
      }
    }
  }, true);

/** A painted sign with a title and optional subtitle. */
export function signTexture(title, subtitle = '', { bg = '#102a43', fg = '#ffffff', accent = '#00b4d8', w = 512, h = 192 } = {}) {
  return canvasTex(`sign:${title}:${subtitle}:${bg}`, w, h, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = accent;
    g.lineWidth = 10;
    g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = fg;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const size = Math.min(92, Math.floor((w - 60) / Math.max(4, title.length * 0.58)));
    g.font = `800 ${size}px "Baloo 2", Nunito, sans-serif`;
    g.fillText(title, w / 2, subtitle ? h * 0.42 : h / 2);
    if (subtitle) {
      g.font = `700 ${Math.floor(size * 0.42)}px Nunito, sans-serif`;
      g.fillStyle = accent;
      g.fillText(subtitle, w / 2, h * 0.76);
    }
  });
}

/** Striped awning texture for stalls and umbrellas. */
export const stripeTexture = (a = '#ff6b6b', b = '#ffffff') =>
  canvasTex(`stripe:${a}:${b}`, 64, 64, (g, w, h) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? a : b;
      g.fillRect((i * w) / 8, 0, w / 8, h);
    }
  }, true);
