import { z } from 'zod';
import { pool, withTransaction } from '../config/db.js';
import { HttpError, parseJson, toInt } from '../utils/http.js';
import { grant, getProfile } from '../models/profileModel.js';
import { adjustCleanliness } from '../models/spotModel.js';
import { applyEvent } from '../services/missionService.js';

export const completeActivitySchema = z.object({
  pointIndex: z.number().int().min(0).max(50).optional(),
  checkpoints: z.number().int().min(0).max(50).optional(),
  timeMs: z.number().int().min(0).max(30 * 60 * 1000).optional(),
});

export async function list(req, res) {
  const params = [];
  let where = 'a.is_active = 1';
  if (req.query.spot) {
    where += ' AND s.spot_key = ?';
    params.push(String(req.query.spot));
  }
  const [rows] = await pool.query(
    `SELECT a.*, s.spot_key, s.name AS spot_name FROM activities a JOIN tourist_spots s ON s.id = a.tourist_spot_id WHERE ${where} ORDER BY a.tourist_spot_id, a.id`,
    params
  );
  res.json({
    activities: rows.map((a) => ({
      id: a.id, key: a.activity_key, spotKey: a.spot_key, spotName: a.spot_name, name: a.activity_name,
      type: a.activity_type, description: a.description, config: parseJson(a.config, {}),
    })),
  });
}

/**
 * Complete an activity step. Each activity type has its own server-side
 * validation; rewards are fixed here, never taken from the client.
 */
export async function complete(req, res) {
  const id = toInt(req.params.id);
  const [[a]] = await pool.query('SELECT * FROM activities WHERE id = ? AND is_active = 1', [id]);
  if (!a) throw new HttpError(404, 'Activity not found');
  const config = parseJson(a.config, {});
  const userId = req.user.id;
  const body = req.body;

  let uniqueKey;
  let reward = { xp: 0, coins: 0, eco: 0 };
  let cleanlinessDelta = 0;

  switch (a.activity_type) {
    case 'explore':
    case 'maintenance': {
      const points = config.points ?? 1;
      if (body.pointIndex === undefined || body.pointIndex >= points) throw new HttpError(422, 'Invalid activity point');
      uniqueKey = body.pointIndex;
      const [dupe] = await pool.query(
        `SELECT id FROM activity_records WHERE user_id = ? AND activity_id = ? AND completed_at > NOW() - INTERVAL 1 HOUR
           AND JSON_EXTRACT(result, '$.pointIndex') = ? LIMIT 1`,
        [userId, id, body.pointIndex]
      );
      if (!dupe.length) {
        reward = a.activity_type === 'explore' ? { xp: 10, coins: 2, eco: 0 } : { xp: 15, coins: 5, eco: 2 };
        if (a.activity_type === 'maintenance') cleanlinessDelta = 0.5;
      }
      break;
    }
    case 'kayak': {
      const need = config.checkpoints ?? 1;
      if (body.checkpoints !== need) throw new HttpError(422, 'All checkpoints must be passed');
      if (body.timeMs === undefined || body.timeMs < (config.minTimeMs ?? 10000)) throw new HttpError(422, 'Run time is not plausible');
      const [dupe] = await pool.query(
        'SELECT id FROM activity_records WHERE user_id = ? AND activity_id = ? AND completed_at > NOW() - INTERVAL ? SECOND LIMIT 1',
        [userId, id, Math.floor((config.minTimeMs ?? 10000) / 1000)]
      );
      if (dupe.length) throw new HttpError(429, 'You just finished a run — paddle another loop first');
      reward = { xp: 50, coins: 20, eco: 2 };
      break;
    }
    default:
      throw new HttpError(400, `${a.activity_type} activities are completed through their own endpoint`);
  }

  const result = await withTransaction(async (conn) => {
    await conn.query('INSERT INTO activity_records (user_id, activity_id, result) VALUES (?, ?, ?)', [userId, id, JSON.stringify(body)]);
    const granted = await grant(conn, userId, reward);
    let cleanliness = null;
    if (cleanlinessDelta) {
      cleanliness = await adjustCleanliness(conn, a.tourist_spot_id, cleanlinessDelta);
      await conn.query(
        "INSERT INTO cleanliness_records (user_id, tourist_spot_id, source, cleanup_count, contribution_points) VALUES (?, ?, 'maintenance', 0, 2)",
        [userId, a.tourist_spot_id]
      );
    }
    if (a.activity_type === 'kayak') {
      await conn.query(
        'INSERT INTO marine_conservation_records (user_id, tourist_spot_id, activity_type, details) VALUES (?, ?, ?, ?)',
        [userId, a.tourist_spot_id, 'kayak_patrol', `${a.activity_name} in ${(body.timeMs / 1000).toFixed(1)}s`]
      );
    }
    const missionUpdates = await applyEvent(conn, userId, { type: 'activity', spotId: a.tourist_spot_id, target: a.activity_key, uniqueKey });
    return { rewards: granted, cleanliness, missionUpdates };
  });
  res.json({ ...result, profile: await getProfile(userId) });
}
