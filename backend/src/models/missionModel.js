import { pool } from '../config/db.js';
import { parseJson } from '../utils/http.js';

export const serializeMission = (r) => ({
  id: r.id,
  key: r.mission_key,
  spotId: r.tourist_spot_id,
  spotKey: r.spot_key,
  spotName: r.spot_name,
  title: r.title,
  description: r.description,
  category: r.mission_category,
  difficulty: r.difficulty,
  recommendedRole: r.recommended_role,
  objectives: parseJson(r.objectives, []),
  rewardXp: r.reward_xp,
  rewardCoins: r.reward_coins,
  rewardBadge: r.reward_badge,
  repeatable: !!r.is_repeatable,
  cooldownHours: r.cooldown_hours,
  isActive: !!r.is_active,
});

const BASE = `SELECT m.*, s.spot_key, s.name AS spot_name FROM missions m JOIN tourist_spots s ON s.id = m.tourist_spot_id`;

export async function listMissions({ spotKey, includeInactive = false } = {}) {
  const where = [];
  const params = [];
  if (!includeInactive) where.push('m.is_active = 1');
  if (spotKey) {
    where.push('s.spot_key = ?');
    params.push(spotKey);
  }
  const [rows] = await pool.query(`${BASE} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY m.tourist_spot_id, m.id`, params);
  return rows.map(serializeMission);
}

export async function findMission(id, db = pool) {
  const [rows] = await db.query(`${BASE} WHERE m.id = ?`, [id]);
  return rows[0] ? serializeMission(rows[0]) : null;
}

/** All mission_progress rows for a user, joined with mission data. */
export async function listUserProgress(userId) {
  const [rows] = await pool.query(
    `SELECT mp.id AS progress_id, mp.progress, mp.status, mp.started_at, mp.completed_at, m.*, s.spot_key, s.name AS spot_name
       FROM mission_progress mp
       JOIN missions m ON m.id = mp.mission_id
       JOIN tourist_spots s ON s.id = m.tourist_spot_id
      WHERE mp.user_id = ? AND mp.status <> 'abandoned'
      ORDER BY mp.status = 'active' DESC, COALESCE(mp.completed_at, mp.started_at) DESC`,
    [userId]
  );
  return rows.map((r) => ({
    ...serializeMission(r),
    progressId: r.progress_id,
    status: r.status,
    progress: parseJson(r.progress, {}),
    startedAt: r.started_at,
    completedAt: r.completed_at,
  }));
}
