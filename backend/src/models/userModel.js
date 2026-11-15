import { pool } from '../config/db.js';

export async function findByLogin(login) {
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1', [login, login]);
  return rows[0] || null;
}

export async function existsUsernameOrEmail(username, email) {
  const [rows] = await pool.query('SELECT username, email FROM users WHERE username = ? OR email = ?', [username, email]);
  return rows;
}

export async function createUserWithProfile(conn, { username, email, passwordHash, role, accountType = 'player' }) {
  const [res] = await conn.query(
    'INSERT INTO users (username, email, password_hash, role, account_type) VALUES (?, ?, ?, ?, ?)',
    [username, email, passwordHash, role, accountType]
  );
  const [[spot]] = await conn.query("SELECT id FROM tourist_spots WHERE spot_key = 'cloud9'");
  const appearance = { shirt: role === 'local_resident' ? '#2e8b57' : '#ffffff', hat: null, board: 'board_foamie' };
  await conn.query('INSERT INTO player_profiles (user_id, appearance, current_spot_id) VALUES (?, ?, ?)', [
    res.insertId,
    JSON.stringify(appearance),
    spot?.id ?? null,
  ]);
  await conn.query(
    "INSERT INTO rewards (user_id, reward_key, reward_name, reward_type) VALUES (?, 'board_foamie', 'Foamie Board', 'surfboard')",
    [res.insertId]
  );
  return res.insertId;
}

export async function touchLogin(id) {
  await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [id]);
}
