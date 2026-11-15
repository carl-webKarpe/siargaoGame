import { pool } from '../config/db.js';
import { parseJson } from '../utils/http.js';

/** Cleanliness slowly decays (0.25%/hour, floor 40%) so communities must keep cleaning. */
export async function applyDecay() {
  await pool.query(
    `UPDATE tourist_spots
        SET cleanliness_percentage = LEAST(cleanliness_percentage, GREATEST(40,
              cleanliness_percentage - 0.25 * FLOOR(TIMESTAMPDIFF(MINUTE, last_decay_at, NOW()) / 60))),
            last_decay_at = last_decay_at + INTERVAL FLOOR(TIMESTAMPDIFF(MINUTE, last_decay_at, NOW()) / 60) HOUR
      WHERE TIMESTAMPDIFF(MINUTE, last_decay_at, NOW()) >= 60`
  );
}

export const serializeSpot = (r) => ({
  id: r.id,
  key: r.spot_key,
  name: r.name,
  municipality: r.municipality,
  description: r.description,
  locationType: r.location_type,
  cleanliness: Number(r.cleanliness_percentage),
  environment: parseJson(r.environment_data, {}),
  isActive: !!r.is_active,
});

export async function listSpots({ includeInactive = false } = {}) {
  await applyDecay();
  const [rows] = await pool.query(
    `SELECT * FROM tourist_spots ${includeInactive ? '' : 'WHERE is_active = 1'} ORDER BY id`
  );
  return rows.map(serializeSpot);
}

/** Look up by numeric id or spot_key. */
export async function findSpot(idOrKey, db = pool) {
  const isId = /^\d+$/.test(String(idOrKey));
  const [rows] = await db.query(`SELECT * FROM tourist_spots WHERE ${isId ? 'id' : 'spot_key'} = ?`, [idOrKey]);
  return rows[0] ? serializeSpot(rows[0]) : null;
}

export async function adjustCleanliness(conn, spotId, delta) {
  await conn.query(
    'UPDATE tourist_spots SET cleanliness_percentage = LEAST(100, GREATEST(0, cleanliness_percentage + ?)) WHERE id = ?',
    [delta, spotId]
  );
  const [[row]] = await conn.query('SELECT cleanliness_percentage FROM tourist_spots WHERE id = ?', [spotId]);
  return Number(row.cleanliness_percentage);
}
