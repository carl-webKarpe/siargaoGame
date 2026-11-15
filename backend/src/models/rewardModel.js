import { pool } from '../config/db.js';

export async function hasReward(db, userId, type, key) {
  const [rows] = await db.query('SELECT id FROM rewards WHERE user_id = ? AND reward_type = ? AND reward_key = ? LIMIT 1', [userId, type, key]);
  return rows.length > 0;
}

/** Add a reward once (badges, boards, cosmetics). Returns true if newly added. */
export async function addUniqueReward(db, userId, type, key, name) {
  if (await hasReward(db, userId, type, key)) return false;
  await db.query('INSERT INTO rewards (user_id, reward_key, reward_name, reward_type) VALUES (?, ?, ?, ?)', [userId, key, name, type]);
  return true;
}

export async function listRewards(userId) {
  const [rows] = await pool.query(
    'SELECT id, reward_key AS `key`, reward_name AS name, reward_type AS type, earned_at AS earnedAt FROM rewards WHERE user_id = ? ORDER BY earned_at DESC, id DESC',
    [userId]
  );
  return rows;
}
