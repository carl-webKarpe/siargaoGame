import { pool, withTransaction } from '../config/db.js';
import { HttpError, parseJson } from '../utils/http.js';
import { adjustCleanliness, findSpot } from '../models/spotModel.js';
import { grant } from '../models/profileModel.js';
import { applyEvent } from './missionService.js';

const RESPAWN_MINUTES = 60;
const MIN_PICKUP_INTERVAL_MS = 300;
const CLEANLINESS_PER_PICKUP = 0.4;

/** Which trash items are visible for this player at this spot. */
export async function visibleTrash(userId, spot) {
  const total = spot.environment.trashCount ?? 16;
  const dirtiness = (100 - spot.cleanliness) / 100;
  let visible = Math.min(total, Math.max(3, Math.ceil(dirtiness * total * 1.6)));

  // Players with an active cleanup mission here always see the full designated area.
  const [missions] = await pool.query(
    `SELECT m.objectives FROM mission_progress mp JOIN missions m ON m.id = mp.mission_id
      WHERE mp.user_id = ? AND mp.status = 'active' AND m.tourist_spot_id = ?`,
    [userId, spot.id]
  );
  if (missions.some((m) => parseJson(m.objectives, []).some((o) => o.type === 'collect_trash'))) visible = total;

  const [picked] = await pool.query(
    'SELECT DISTINCT trash_index FROM trash_pickups WHERE user_id = ? AND tourist_spot_id = ? AND picked_at > NOW() - INTERVAL ? MINUTE',
    [userId, spot.id, RESPAWN_MINUTES]
  );
  const taken = new Set(picked.map((p) => p.trash_index));
  const indices = [];
  for (let i = 0; i < visible; i++) if (!taken.has(i)) indices.push(i);
  return { total, indices };
}

/** Validate and record a single piece of trash being collected. */
export async function collectTrash(userId, spotIdOrKey, trashIndex) {
  const spot = await findSpot(spotIdOrKey);
  if (!spot || !spot.isActive) throw new HttpError(404, 'Destination not found');
  const total = spot.environment.trashCount ?? 16;
  if (!Number.isInteger(trashIndex) || trashIndex < 0 || trashIndex >= total) {
    throw new HttpError(422, 'Invalid trash item');
  }

  return withTransaction(async (conn) => {
    // Lock the profile row to serialise pickups per player.
    await conn.query('SELECT id FROM player_profiles WHERE user_id = ? FOR UPDATE', [userId]);
    const [[last]] = await conn.query(
      'SELECT TIMESTAMPDIFF(MICROSECOND, MAX(picked_at), NOW(3)) / 1000 AS ms FROM trash_pickups WHERE user_id = ?',
      [userId]
    );
    if (last?.ms !== null && last?.ms !== undefined && Number(last.ms) < MIN_PICKUP_INTERVAL_MS) {
      throw new HttpError(429, 'Slow down! Pick up one item at a time.');
    }
    const [dupe] = await conn.query(
      'SELECT id FROM trash_pickups WHERE user_id = ? AND tourist_spot_id = ? AND trash_index = ? AND picked_at > NOW() - INTERVAL ? MINUTE',
      [userId, spot.id, trashIndex, RESPAWN_MINUTES]
    );
    if (dupe.length) throw new HttpError(409, 'You already collected this item');

    await conn.query('INSERT INTO trash_pickups (user_id, tourist_spot_id, trash_index) VALUES (?, ?, ?)', [userId, spot.id, trashIndex]);
    await conn.query(
      "INSERT INTO cleanliness_records (user_id, tourist_spot_id, source, cleanup_count, contribution_points) VALUES (?, ?, 'pickup', 1, 1)",
      [userId, spot.id]
    );
    const cleanliness = await adjustCleanliness(conn, spot.id, CLEANLINESS_PER_PICKUP);
    const rewards = await grant(conn, userId, { xp: 2, coins: 1, eco: 1 });
    const missionUpdates = await applyEvent(conn, userId, { type: 'collect_trash', spotId: spot.id });
    return { spotKey: spot.key, cleanliness, rewards, missionUpdates };
  });
}
