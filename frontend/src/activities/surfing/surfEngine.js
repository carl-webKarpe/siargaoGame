/**
 * Surfing mini-game simulation (framework independent).
 *
 * Phases: paddle -> ride -> (wipeout) -> done
 * Score: timing bonus + per-second riding + pocket bonus + carves.
 * The backend re-validates the submitted stats (see surfingController).
 */
export const BOARDS = {
  board_foamie: { name: 'Foamie Board', stability: 1.0, turn: 0.8, speed: 0.9, color: '#ffd166' },
  board_fun: { name: 'Funboard', stability: 0.8, turn: 1.0, speed: 1.0, color: '#00b4d8' },
  board_short: { name: 'Siargao Shortboard', stability: 0.6, turn: 1.3, speed: 1.15, color: '#ff6b6b' },
};

export const CHALLENGES = {
  tutorial: { name: 'Surf Tutorial', goal: 'Catch a wave and ride for 3 seconds', check: (s) => s.duration >= 3 },
  beginner: { name: 'Beginner Challenge', goal: 'Ride 8+ seconds and score 500+', check: (s) => s.duration >= 8 && s.score >= 500 },
  intermediate: { name: 'Intermediate Challenge', goal: 'Ride 15+ seconds, 4+ carves, score 1800+', check: (s) => s.duration >= 15 && s.carves >= 4 && s.score >= 1800 },
  free: { name: 'Free Surf', goal: 'Surf for fun and beat your best score', check: () => false },
};

const WAVE_APPROACH = 6.5; // wave speed during paddle phase
const CATCH_GOOD = 2.6;
const CATCH_PERFECT = 1.0;
const PEEL_SPEED = 3.2;
const RIDE_ADVANCE = 1.35;

export function createSurfSession({ surf, boardKey = 'board_foamie', challenge = 'beginner' }) {
  const board = BOARDS[boardKey] || BOARDS.board_foamie;
  const tutorial = challenge === 'tutorial';
  const startX = surf.peelStart + 7;
  return {
    surf,
    board,
    boardKey,
    challenge,
    tutorial,
    phase: 'paddle',
    time: 0,
    wave: { z: surf.lineupZ - 32, curlX: surf.peelStart, active: true, cooldown: 0 },
    rider: { x: startX, z: surf.lineupZ, balance: 0, steer: 0, lean: 0, heading: 0, wobbleVel: 0 },
    paddlePower: 0,
    message: tutorial ? 'Hold W (or ▲) to paddle and build speed' : 'Paddle (W) and catch the wave with SPACE!',
    messageType: 'hint',
    timing: null,
    score: 0,
    rideTime: 0,
    pocketTime: 0,
    carves: 0,
    lastSteerDir: 0,
    steerHold: 0,
    attempts: 0,
    wipeoutTimer: 0,
    result: null,
  };
}

const rand = (() => {
  let s = 1234567;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
})();

/**
 * Advance the simulation.
 * @param input { forward, left, right, catchPressed }
 */
export function stepSurf(s, dt, input) {
  s.time += dt;
  const r = s.rider;
  const w = s.wave;
  const surf = s.surf;

  if (s.phase === 'paddle') {
    s.paddlePower = Math.max(0, Math.min(1, s.paddlePower + (input.forward ? 0.65 : -0.35) * dt));
    // gentle sideways positioning
    const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    r.x = Math.max(surf.peelStart + 2, Math.min(surf.peelStart + 16, r.x + steer * 3 * dt));
    r.heading = 0;

    if (w.cooldown > 0) {
      w.cooldown -= dt;
      if (w.cooldown <= 0) {
        w.z = surf.lineupZ - 32;
        w.active = true;
      }
    } else {
      w.z += WAVE_APPROACH * (s.tutorial ? 0.65 : 1) * dt;
    }
    const delta = w.z - r.z; // negative = wave still behind (seaward)
    if (s.tutorial && s.paddlePower >= 0.5 && s.messageType === 'hint') {
      s.message = 'Great! Now press SPACE when the wave reaches the green zone';
    }
    if (input.catchPressed && w.active) {
      s.attempts += 1;
      const ad = Math.abs(delta);
      if (ad <= CATCH_GOOD && s.paddlePower >= 0.45) {
        s.timing = ad <= CATCH_PERFECT ? 'perfect' : 'good';
        s.score += s.timing === 'perfect' ? 300 : 150;
        s.phase = 'ride';
        s.message = s.timing === 'perfect' ? 'PERFECT TAKE-OFF! Steer with A / D' : 'Nice take-off! Steer with A / D';
        s.messageType = 'good';
        r.balance = 0;
      } else if (ad <= CATCH_GOOD) {
        s.message = 'Not enough speed — keep paddling (hold W)!';
        s.messageType = 'warn';
      } else {
        s.message = delta < 0 ? 'Too early! Wait for the wave…' : 'Too late! The wave passed.';
        s.messageType = 'warn';
      }
    }
    if (w.active && delta > CATCH_GOOD + 1) {
      w.active = false;
      w.cooldown = 2.2;
      s.message = 'Missed it — another set is coming. Paddle!';
      s.messageType = 'warn';
    }
    // keep the wave's peel point near the take-off zone while approaching
    w.curlX = surf.peelStart;
    return s;
  }

  if (s.phase === 'ride') {
    s.rideTime += dt;
    w.z += RIDE_ADVANCE * dt;
    w.curlX += PEEL_SPEED * dt;
    r.z = w.z - 1.2;

    const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    r.steer += (steer - r.steer) * Math.min(1, dt * 6 * s.board.turn);
    const vx = PEEL_SPEED * s.board.speed + r.steer * 3.6 * s.board.turn;
    r.x += vx * dt;
    r.heading = r.steer * 0.6;

    // balance: random wobble + weight shift from steering
    const instability = (1.25 - s.board.stability) * (s.tutorial ? 0.5 : 1);
    r.wobbleVel += (rand() - 0.5) * 6 * instability * dt;
    r.wobbleVel *= 0.96;
    r.balance += r.wobbleVel * dt + r.steer * 0.55 * dt - r.balance * 0.25 * dt;
    r.lean = r.balance;

    // carves = committed direction changes
    const dir = Math.sign(Math.round(r.steer * 2) / 2);
    if (dir !== 0) {
      if (dir === s.lastSteerDir) s.steerHold += dt;
      else {
        if (s.lastSteerDir !== 0 && s.steerHold >= 0.35) {
          s.carves += 1;
          s.score += 100;
          s.message = `Carve! x${s.carves}`;
          s.messageType = 'good';
        }
        s.lastSteerDir = dir;
        s.steerHold = 0;
      }
    }

    const pocket = r.x - w.curlX;
    const inPocket = pocket > 1.5 && pocket < 9;
    if (inPocket) s.pocketTime += dt;
    s.score += (40 + (inPocket ? 60 : 0)) * s.board.speed * dt;
    s.inPocket = inPocket;

    if (pocket < -0.5) {
      // caught by the whitewater
      r.balance += Math.sign(r.balance || 1) * 1.8 * dt;
      s.message = 'Whitewater! Steer right (D) to get ahead!';
      s.messageType = 'warn';
    } else if (pocket > 16) {
      s.message = 'You outran the wave — it fades out.';
      return finish(s, 'faded');
    }
    if (Math.abs(r.balance) >= 1) {
      s.phase = 'wipeout';
      s.wipeoutTimer = 1.4;
      s.message = 'WIPEOUT!';
      s.messageType = 'bad';
      return s;
    }
    if (w.z >= surf.endZ || r.x >= surf.peelEnd) {
      s.message = 'You rode it all the way in!';
      s.score += 50;
      return finish(s, 'complete');
    }
    return s;
  }

  if (s.phase === 'wipeout') {
    s.wipeoutTimer -= dt;
    w.z += RIDE_ADVANCE * dt;
    w.curlX += PEEL_SPEED * dt;
    if (s.wipeoutTimer <= 0) return finish(s, 'wipeout');
  }
  return s;
}

function finish(s, reason) {
  s.phase = 'done';
  const stats = {
    score: Math.round(s.score),
    duration: Math.round(s.rideTime * 10) / 10,
    carves: s.carves,
    waves: 1,
  };
  s.result = { ...stats, reason, timing: s.timing, passed: CHALLENGES[s.challenge].check(stats) };
  return s;
}
