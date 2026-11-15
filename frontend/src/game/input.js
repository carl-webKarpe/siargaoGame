/**
 * Unified input state shared by keyboard/mouse and the mobile touch controls.
 * Game loops read it every frame (non-reactive for performance).
 */
export const input = {
  keys: new Set(),
  joystick: { x: 0, y: 0 }, // -1..1, y = forward
  touchRun: false,
  look: { dx: 0, dy: 0 }, // accumulated camera drag
  zoom: 0,
  pressed: new Set(), // one-shot actions: jump, interact
  holding: new Set(), // held actions: interact (for hold-to-repair)
  enabled: true,
};

const KEYMAP = {
  KeyW: 'forward', ArrowUp: 'forward',
  KeyS: 'back', ArrowDown: 'back',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'run', ShiftRight: 'run',
  Space: 'jump',
  KeyE: 'interact',
};

export const isDown = (action) => input.keys.has(action);

export function press(action) {
  input.pressed.add(action);
  input.holding.add(action);
}
export function release(action) {
  input.holding.delete(action);
}

/** Returns true once per press. */
export function consume(action) {
  if (input.pressed.has(action)) {
    input.pressed.delete(action);
    return true;
  }
  return false;
}

/** Movement vector from keyboard + joystick: { x: strafe, y: forward } */
export function moveVector() {
  let x = input.joystick.x;
  let y = input.joystick.y;
  if (isDown('forward')) y += 1;
  if (isDown('back')) y -= 1;
  if (isDown('left')) x -= 1;
  if (isDown('right')) x += 1;
  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  return { x, y };
}

function isTyping(e) {
  const t = e.target;
  return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
}

export function attachKeyboard() {
  const down = (e) => {
    if (isTyping(e)) return;
    const a = KEYMAP[e.code];
    if (!a) return;
    if (a === 'jump' || e.code.startsWith('Arrow')) e.preventDefault();
    if (!input.keys.has(a) && (a === 'jump' || a === 'interact')) press(a);
    input.keys.add(a);
  };
  const up = (e) => {
    const a = KEYMAP[e.code];
    if (!a) return;
    input.keys.delete(a);
    release(a);
  };
  const blur = () => {
    input.keys.clear();
    input.holding.clear();
  };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', blur);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    window.removeEventListener('blur', blur);
    blur();
  };
}

export function resetInput() {
  input.keys.clear();
  input.pressed.clear();
  input.holding.clear();
  input.joystick.x = 0;
  input.joystick.y = 0;
  input.look.dx = 0;
  input.look.dy = 0;
}
