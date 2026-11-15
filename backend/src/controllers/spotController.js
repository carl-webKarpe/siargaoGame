import { pool, withTransaction } from '../config/db.js';
import { HttpError, parseJson } from '../utils/http.js';
import { findSpot, listSpots } from '../models/spotModel.js';
import { listMissions } from '../models/missionModel.js';
import { setCurrentSpot } from '../models/profileModel.js';
import { visibleTrash } from '../services/cleanupService.js';
import { applyEvent } from '../services/missionService.js';

export async function list(_req, res) {
  res.json({ spots: await listSpots() });
}

/** Destination details: NPCs, activities, quizzes, missions. */
export async function detail(req, res) {
  const spot = await findSpot(req.params.id);
  if (!spot || !spot.isActive) throw new HttpError(404, 'Destination not found');
  const [npcs] = await pool.query('SELECT npc_key, name, npc_role, dialogue, info FROM npcs WHERE tourist_spot_id = ?', [spot.id]);
  const [acts] = await pool.query(
    'SELECT id, activity_key, activity_name, activity_type, description, config FROM activities WHERE tourist_spot_id = ? AND is_active = 1',
    [spot.id]
  );
  const [quizzes] = await pool.query('SELECT quiz_key, title, category FROM quizzes WHERE tourist_spot_id = ?', [spot.id]);
  res.json({
    spot,
    npcs: npcs.map((n) => ({ key: n.npc_key, name: n.name, role: n.npc_role, dialogue: parseJson(n.dialogue, []), info: n.info })),
    activities: acts.map((a) => ({
      id: a.id, key: a.activity_key, name: a.activity_name, type: a.activity_type, description: a.description, config: parseJson(a.config, {}),
    })),
    quizzes: quizzes.map((q) => ({ key: q.quiz_key, title: q.title, category: q.category })),
    missions: await listMissions({ spotKey: spot.key }),
  });
}

export async function trash(req, res) {
  const spot = await findSpot(req.params.id);
  if (!spot || !spot.isActive) throw new HttpError(404, 'Destination not found');
  res.json({ spotKey: spot.key, cleanliness: spot.cleanliness, ...(await visibleTrash(req.user.id, spot)) });
}

/** Travel to a destination: records the visit and satisfies visit objectives. */
export async function visit(req, res) {
  const spot = await findSpot(req.params.id);
  if (!spot || !spot.isActive) throw new HttpError(404, 'Destination not found');
  await setCurrentSpot(req.user.id, spot.id);
  const missionUpdates = await withTransaction(async (conn) => {
    const [[recent]] = await conn.query(
      'SELECT id FROM spot_visits WHERE user_id = ? AND tourist_spot_id = ? AND visited_at > NOW() - INTERVAL 10 MINUTE LIMIT 1',
      [req.user.id, spot.id]
    );
    if (!recent) await conn.query('INSERT INTO spot_visits (user_id, tourist_spot_id) VALUES (?, ?)', [req.user.id, spot.id]);
    return applyEvent(conn, req.user.id, { type: 'visit', spotId: spot.id, uniqueKey: 'visit' });
  });
  res.json({ spot, missionUpdates });
}
