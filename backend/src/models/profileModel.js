import { pool } from '../config/db.js';
import { parseJson } from '../utils/http.js';
import { levelFromXp } from '../utils/progression.js';

export async function getProfile(userId, db = pool) {
  const [[row]] = await db.query(
    `SELECT u.id AS user_id, u.username, u.email, u.role, u.account_type, u.created_at,
            p.level, p.experience, p.coins, p.surfing_skill, p.eco_points, p.appearance,
            s.spot_key AS current_spot
       FROM users u
       JOIN player_profiles p ON p.user_id = u.id
       LEFT JOIN tourist_spots s ON s.id = p.current_spot_id
      WHERE u.id = ?`,
    [userId]
  );
  if (!row) return null;
  const [[stats]] = await db.query(
    `SELECT
       (SELECT COUNT(*) FROM mission_progress WHERE user_id = ? AND status = 'completed') AS completed_missions,
       (SELECT COALESCE(SUM(cleanup_count),0) FROM cleanliness_records WHERE user_id = ? AND source = 'pickup') AS trash_collected,
       (SELECT COUNT(*) FROM marine_conservation_records WHERE user_id = ?) AS marine_records,
       (SELECT COALESCE(MAX(score),0) FROM surfing_records WHERE user_id = ?) AS best_surf,
       (SELECT COUNT(*) FROM rewards WHERE user_id = ? AND reward_type IN ('badge','certificate','achievement')) AS badges`,
    [userId, userId, userId, userId, userId]
  );
  const lv = levelFromXp(row.experience);
  return {
    userId: row.user_id,
    username: row.username,
    email: row.email,
    role: row.role,
    accountType: row.account_type,
    createdAt: row.created_at,
    level: lv.level,
    experience: row.experience,
    xpIntoLevel: lv.xpIntoLevel,
    xpToNext: lv.xpToNext,
    coins: row.coins,
    surfingSkill: row.surfing_skill,
    ecoPoints: row.eco_points,
    appearance: parseJson(row.appearance, {}),
    currentSpot: row.current_spot,
    stats: {
      completedMissions: Number(stats.completed_missions),
      trashCollected: Number(stats.trash_collected),
      marineRecords: Number(stats.marine_records),
      bestSurf: Number(stats.best_surf),
      badges: Number(stats.badges),
    },
  };
}

/**
 * Grant XP / coins / eco points. Amounts are always computed server-side by
 * the caller — never taken from the request body.
 */
export async function grant(conn, userId, { xp = 0, coins = 0, eco = 0, surf = 0 }) {
  const [[p]] = await conn.query('SELECT experience, level FROM player_profiles WHERE user_id = ? FOR UPDATE', [userId]);
  const experience = p.experience + xp;
  const { level } = levelFromXp(experience);
  await conn.query(
    `UPDATE player_profiles
        SET experience = ?, level = ?, coins = coins + ?, eco_points = eco_points + ?,
            surfing_skill = LEAST(100, surfing_skill + ?)
      WHERE user_id = ?`,
    [experience, level, coins, eco, surf, userId]
  );
  return { xp, coins, eco, leveledUp: level > p.level, level };
}

export async function setCurrentSpot(userId, spotId) {
  await pool.query('UPDATE player_profiles SET current_spot_id = ? WHERE user_id = ?', [spotId, userId]);
}
