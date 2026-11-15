import { z } from 'zod';
import { pool } from '../config/db.js';
import { HttpError, toInt } from '../utils/http.js';
import { listMissions, findMission } from '../models/missionModel.js';
import { listSpots, findSpot } from '../models/spotModel.js';
import { getProfile } from '../models/profileModel.js';

const page = (req) => {
  const limit = Math.min(200, Math.max(1, toInt(req.query.limit) || 50));
  const offset = Math.max(0, toInt(req.query.offset) || 0);
  return { limit, offset };
};

export async function stats(_req, res) {
  const [[s]] = await pool.query(
    `SELECT (SELECT COUNT(*) FROM users WHERE account_type='player') AS players,
            (SELECT COUNT(*) FROM users WHERE role='local_resident' AND account_type='player') AS locals,
            (SELECT COUNT(*) FROM users WHERE role='tourist' AND account_type='player') AS tourists,
            (SELECT COUNT(*) FROM missions) AS missions,
            (SELECT COUNT(*) FROM mission_progress WHERE status='completed') AS completions,
            (SELECT COUNT(*) FROM mission_progress WHERE status='active') AS active,
            (SELECT COALESCE(SUM(cleanup_count),0) FROM cleanliness_records) AS trash,
            (SELECT COUNT(*) FROM marine_conservation_records) AS marine,
            (SELECT COUNT(*) FROM surfing_records) AS rides`
  );
  res.json({ stats: Object.fromEntries(Object.entries(s).map(([k, v]) => [k, Number(v)])), spots: await listSpots({ includeInactive: true }) });
}

export async function players(req, res) {
  const { limit, offset } = page(req);
  const params = [];
  const where = ["u.account_type = 'player'"];
  if (['local_resident', 'tourist'].includes(req.query.role)) {
    where.push('u.role = ?');
    params.push(req.query.role);
  }
  if (req.query.q) {
    where.push('(u.username LIKE ? OR u.email LIKE ?)');
    params.push(`%${req.query.q}%`, `%${req.query.q}%`);
  }
  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.email, u.role, u.created_at, u.last_login_at, p.level, p.experience, p.coins, p.surfing_skill, p.eco_points,
            (SELECT COUNT(*) FROM mission_progress mp WHERE mp.user_id = u.id AND mp.status='completed') AS completed
       FROM users u JOIN player_profiles p ON p.user_id = u.id
      WHERE ${where.join(' AND ')} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM users u WHERE ${where.join(' AND ')}`, params);
  res.json({ players: rows, total: Number(total) });
}

export async function playerDetail(req, res) {
  const profile = await getProfile(toInt(req.params.id));
  if (!profile) throw new HttpError(404, 'Player not found');
  const [missions] = await pool.query(
    `SELECT m.title, mp.status, mp.started_at, mp.completed_at FROM mission_progress mp JOIN missions m ON m.id = mp.mission_id
      WHERE mp.user_id = ? ORDER BY mp.id DESC LIMIT 50`,
    [profile.userId]
  );
  res.json({ profile, missions });
}

// ---------- Destinations ----------
export const spotSchema = z.object({
  key: z.string().regex(/^[a-z0-9_]{2,40}$/).optional(),
  name: z.string().trim().min(2).max(120),
  municipality: z.string().trim().max(120).default(''),
  description: z.string().trim().min(5).max(2000),
  locationType: z.string().trim().min(2).max(40),
  isActive: z.boolean().default(true),
  environment: z.object({
    theme: z.string().max(40),
    trashCount: z.number().int().min(3).max(40),
    surf: z.boolean(),
    mapPos: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }),
    facts: z.array(z.string().max(300)).max(10),
  }),
});

export async function listAllSpots(_req, res) {
  res.json({ spots: await listSpots({ includeInactive: true }) });
}

export async function createSpot(req, res) {
  const b = req.body;
  if (!b.key) throw new HttpError(400, 'Key is required for new destinations');
  if (await findSpot(b.key)) throw new HttpError(409, 'Key already exists');
  const [r] = await pool.query(
    'INSERT INTO tourist_spots (spot_key, name, municipality, description, location_type, environment_data, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [b.key, b.name, b.municipality, b.description, b.locationType, JSON.stringify(b.environment), b.isActive]
  );
  res.status(201).json({ spot: await findSpot(r.insertId) });
}

/** Cleanliness is intentionally not editable: it only changes through validated gameplay records. */
export async function updateSpot(req, res) {
  const spot = await findSpot(toInt(req.params.id));
  if (!spot) throw new HttpError(404, 'Destination not found');
  const b = req.body;
  await pool.query(
    'UPDATE tourist_spots SET name = ?, municipality = ?, description = ?, location_type = ?, environment_data = ?, is_active = ? WHERE id = ?',
    [b.name, b.municipality, b.description, b.locationType, JSON.stringify(b.environment), b.isActive, spot.id]
  );
  res.json({ spot: await findSpot(spot.id) });
}

// ---------- Missions ----------
const objectiveSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]{1,30}$/),
  type: z.enum(['collect_trash', 'talk_npc', 'quiz', 'activity', 'surf', 'visit']),
  target: z.string().max(60).optional(),
  count: z.number().int().min(1).max(100),
  label: z.string().min(2).max(160),
});

export const missionSchema = z.object({
  key: z.string().regex(/^[a-z0-9_]{2,60}$/).optional(),
  spotId: z.number().int().positive(),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(5).max(2000),
  category: z.enum(['environmental_protection', 'beach_cleanup', 'marine_conservation', 'surfing', 'responsible_tourism', 'community_service', 'local_culture', 'exploration']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  recommendedRole: z.enum(['local_resident', 'tourist', 'both']),
  objectives: z.array(objectiveSchema).min(1).max(10),
  rewardXp: z.number().int().min(0).max(5000),
  rewardCoins: z.number().int().min(0).max(5000),
  rewardBadge: z.string().trim().max(120).nullable().optional(),
  repeatable: z.boolean().default(false),
  cooldownHours: z.number().int().min(1).max(168).default(6),
  isActive: z.boolean().default(true),
});

/** Make sure objective targets refer to real content at that destination. */
async function validateObjectives(spotId, objectives) {
  const ids = new Set();
  for (const o of objectives) {
    if (ids.has(o.id)) throw new HttpError(400, `Duplicate objective id "${o.id}"`);
    ids.add(o.id);
    const need = { talk_npc: 'npcs', quiz: 'quizzes', activity: 'activities' }[o.type];
    if (need) {
      if (!o.target) throw new HttpError(400, `Objective "${o.id}" needs a target`);
      const col = { npcs: 'npc_key', quizzes: 'quiz_key', activities: 'activity_key' }[need];
      const [rows] = await pool.query(`SELECT id FROM ${need} WHERE ${col} = ? AND tourist_spot_id = ?`, [o.target, spotId]);
      if (!rows.length) throw new HttpError(400, `Objective "${o.id}": "${o.target}" does not exist at this destination`);
    }
    if (o.type === 'surf' && !['tutorial', 'beginner', 'intermediate'].includes(o.target)) {
      throw new HttpError(400, 'Surf objectives need target tutorial, beginner or intermediate');
    }
  }
}

export async function listAllMissions(_req, res) {
  res.json({ missions: await listMissions({ includeInactive: true }) });
}

export async function createMission(req, res) {
  const b = req.body;
  if (!(await findSpot(b.spotId))) throw new HttpError(400, 'Unknown destination');
  await validateObjectives(b.spotId, b.objectives);
  const key = b.key || `custom_${Date.now().toString(36)}`;
  const [r] = await pool.query(
    `INSERT INTO missions (mission_key, tourist_spot_id, title, description, mission_category, difficulty, recommended_role,
       objectives, reward_xp, reward_coins, reward_badge, is_repeatable, cooldown_hours, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [key, b.spotId, b.title, b.description, b.category, b.difficulty, b.recommendedRole, JSON.stringify(b.objectives),
      b.rewardXp, b.rewardCoins, b.rewardBadge || null, b.repeatable, b.cooldownHours, b.isActive]
  ).catch((e) => {
    if (e.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Mission key already exists');
    throw e;
  });
  res.status(201).json({ mission: await findMission(r.insertId) });
}

export async function updateMission(req, res) {
  const id = toInt(req.params.id);
  if (!(await findMission(id))) throw new HttpError(404, 'Mission not found');
  const b = req.body;
  if (!(await findSpot(b.spotId))) throw new HttpError(400, 'Unknown destination');
  await validateObjectives(b.spotId, b.objectives);
  await pool.query(
    `UPDATE missions SET tourist_spot_id=?, title=?, description=?, mission_category=?, difficulty=?, recommended_role=?, objectives=?,
       reward_xp=?, reward_coins=?, reward_badge=?, is_repeatable=?, cooldown_hours=?, is_active=? WHERE id=?`,
    [b.spotId, b.title, b.description, b.category, b.difficulty, b.recommendedRole, JSON.stringify(b.objectives),
      b.rewardXp, b.rewardCoins, b.rewardBadge || null, b.repeatable, b.cooldownHours, b.isActive, id]
  );
  res.json({ mission: await findMission(id) });
}

// ---------- Activities ----------
export const activitySchema = z.object({
  key: z.string().regex(/^[a-z0-9_]{2,60}$/).optional(),
  spotId: z.number().int().positive(),
  name: z.string().trim().min(2).max(120),
  type: z.enum(['cleanup', 'maintenance', 'surf', 'explore', 'kayak', 'community', 'quiz']),
  description: z.string().trim().min(2).max(2000),
  config: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])).default({}),
  isActive: z.boolean().default(true),
});

export async function listAllActivities(_req, res) {
  const [rows] = await pool.query(
    'SELECT a.*, s.name AS spot_name FROM activities a JOIN tourist_spots s ON s.id = a.tourist_spot_id ORDER BY a.tourist_spot_id, a.id'
  );
  res.json({
    activities: rows.map((a) => ({
      id: a.id, key: a.activity_key, spotId: a.tourist_spot_id, spotName: a.spot_name, name: a.activity_name, type: a.activity_type,
      description: a.description, config: typeof a.config === 'string' ? JSON.parse(a.config) : a.config || {}, isActive: !!a.is_active,
    })),
  });
}

export async function createActivity(req, res) {
  const b = req.body;
  const key = b.key || `act_${Date.now().toString(36)}`;
  const [r] = await pool.query(
    'INSERT INTO activities (activity_key, tourist_spot_id, activity_name, activity_type, description, config, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [key, b.spotId, b.name, b.type, b.description, JSON.stringify(b.config), b.isActive]
  ).catch((e) => {
    if (e.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Activity key already exists');
    if (e.code === 'ER_NO_REFERENCED_ROW_2') throw new HttpError(400, 'Unknown destination');
    throw e;
  });
  res.status(201).json({ id: r.insertId });
}

export async function updateActivity(req, res) {
  const b = req.body;
  const [r] = await pool.query(
    'UPDATE activities SET tourist_spot_id=?, activity_name=?, activity_type=?, description=?, config=?, is_active=? WHERE id=?',
    [b.spotId, b.name, b.type, b.description, JSON.stringify(b.config), b.isActive, toInt(req.params.id)]
  );
  if (!r.affectedRows) throw new HttpError(404, 'Activity not found');
  res.json({ ok: true });
}

// ---------- Records ----------
const recordQueries = {
  missions: `SELECT mp.id, u.username, u.role, m.title, s.name AS spot, mp.status, mp.started_at, mp.completed_at
               FROM mission_progress mp JOIN users u ON u.id = mp.user_id JOIN missions m ON m.id = mp.mission_id
               JOIN tourist_spots s ON s.id = m.tourist_spot_id ORDER BY mp.id DESC LIMIT ? OFFSET ?`,
  cleanliness: `SELECT cr.id, u.username, u.role, s.name AS spot, cr.source, cr.cleanup_count, cr.contribution_points, m.title AS mission, cr.created_at
               FROM cleanliness_records cr JOIN users u ON u.id = cr.user_id JOIN tourist_spots s ON s.id = cr.tourist_spot_id
               LEFT JOIN missions m ON m.id = cr.mission_id ORDER BY cr.id DESC LIMIT ? OFFSET ?`,
  marine: `SELECT mc.id, u.username, u.role, s.name AS spot, mc.activity_type, mc.details, mc.completed_at
               FROM marine_conservation_records mc JOIN users u ON u.id = mc.user_id JOIN tourist_spots s ON s.id = mc.tourist_spot_id
               ORDER BY mc.id DESC LIMIT ? OFFSET ?`,
  surfing: `SELECT sr.id, u.username, s.name AS spot, sr.challenge, sr.board_key, sr.score, sr.duration, sr.carves, sr.passed, sr.completed_at
               FROM surfing_records sr JOIN users u ON u.id = sr.user_id JOIN tourist_spots s ON s.id = sr.tourist_spot_id
               ORDER BY sr.id DESC LIMIT ? OFFSET ?`,
};

export async function records(req, res) {
  const sql = recordQueries[req.params.type];
  if (!sql) throw new HttpError(404, 'Unknown record type');
  const { limit, offset } = page(req);
  const [rows] = await pool.query(sql, [limit, offset]);
  res.json({ records: rows });
}

export async function lookups(_req, res) {
  const [npcs] = await pool.query('SELECT npc_key AS `key`, name, tourist_spot_id AS spotId FROM npcs ORDER BY tourist_spot_id');
  const [quizzes] = await pool.query('SELECT quiz_key AS `key`, title AS name, tourist_spot_id AS spotId FROM quizzes ORDER BY tourist_spot_id');
  const [acts] = await pool.query('SELECT activity_key AS `key`, activity_name AS name, tourist_spot_id AS spotId FROM activities ORDER BY tourist_spot_id');
  res.json({ npcs, quizzes, activities: acts });
}
