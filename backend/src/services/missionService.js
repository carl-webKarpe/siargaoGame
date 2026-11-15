import { pool, withTransaction } from '../config/db.js';
import { HttpError, parseJson } from '../utils/http.js';
import { findMission, serializeMission } from '../models/missionModel.js';
import { grant } from '../models/profileModel.js';
import { addUniqueReward } from '../models/rewardModel.js';
import { adjustCleanliness } from '../models/spotModel.js';

const MAX_ACTIVE = 6;
const CLEANUP_CATEGORIES = new Set(['beach_cleanup', 'environmental_protection']);

/** Build an empty progress object for a mission's objectives. */
const emptyProgress = (objectives) => Object.fromEntries(objectives.map((o) => [o.id, { count: 0, seen: [] }]));

export const objectivesDone = (objectives, progress) =>
  objectives.every((o) => (progress[o.id]?.count ?? 0) >= o.count);

/**
 * Apply a validated gameplay event to every active mission of the user at
 * that destination. Events are only ever emitted by backend controllers after
 * they have validated the underlying action.
 *
 * @param conn  transaction connection
 * @param event { type, spotId, target?, uniqueKey? }
 * @returns list of mission updates for UI feedback
 */
export async function applyEvent(conn, userId, event) {
  const [rows] = await conn.query(
    `SELECT mp.id AS progress_id, mp.progress, m.id, m.title, m.objectives
       FROM mission_progress mp JOIN missions m ON m.id = mp.mission_id
      WHERE mp.user_id = ? AND mp.status = 'active' AND m.tourist_spot_id = ?
      FOR UPDATE`,
    [userId, event.spotId]
  );
  const updates = [];
  for (const row of rows) {
    const objectives = parseJson(row.objectives, []);
    const progress = { ...emptyProgress(objectives), ...parseJson(row.progress, {}) };
    let changed = false;
    for (const obj of objectives) {
      if (obj.type !== event.type) continue;
      if (obj.target && obj.target !== event.target) continue;
      const p = progress[obj.id] || { count: 0, seen: [] };
      if (p.count >= obj.count) continue;
      if (event.uniqueKey !== undefined) {
        const k = String(event.uniqueKey);
        if (p.seen.includes(k)) continue;
        p.seen.push(k);
      }
      p.count += 1;
      progress[obj.id] = p;
      changed = true;
      updates.push({
        missionId: row.id,
        missionTitle: row.title,
        objective: obj.label,
        count: p.count,
        required: obj.count,
      });
    }
    if (changed) {
      await conn.query('UPDATE mission_progress SET progress = ? WHERE id = ?', [JSON.stringify(progress), row.progress_id]);
      if (objectivesDone(objectives, progress)) {
        updates.push({ missionId: row.id, missionTitle: row.title, readyToComplete: true });
      }
    }
  }
  return updates;
}

export async function startMission(userId, missionId) {
  return withTransaction(async (conn) => {
    const mission = await findMission(missionId, conn);
    if (!mission || !mission.isActive) throw new HttpError(404, 'Mission not found');

    const [existing] = await conn.query(
      `SELECT id, status, completed_at FROM mission_progress
        WHERE user_id = ? AND mission_id = ? AND status <> 'abandoned' ORDER BY id DESC FOR UPDATE`,
      [userId, missionId]
    );
    if (existing.some((r) => r.status === 'active')) throw new HttpError(409, 'Mission already active');
    const lastDone = existing.find((r) => r.status === 'completed');
    if (lastDone && !mission.repeatable) throw new HttpError(409, 'Mission already completed');
    if (lastDone && mission.repeatable) {
      const readyAt = new Date(new Date(lastDone.completed_at).getTime() + mission.cooldownHours * 3600e3);
      if (readyAt > new Date()) {
        throw new HttpError(409, `This cleanup can be repeated after ${readyAt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}`);
      }
    }

    const [[{ n }]] = await conn.query("SELECT COUNT(*) AS n FROM mission_progress WHERE user_id = ? AND status = 'active'", [userId]);
    if (n >= MAX_ACTIVE) throw new HttpError(409, `You can have at most ${MAX_ACTIVE} active missions`);

    const progress = emptyProgress(mission.objectives);
    // Visit objectives are satisfied immediately when the player is already at the destination.
    const [[prof]] = await conn.query('SELECT current_spot_id FROM player_profiles WHERE user_id = ?', [userId]);
    for (const o of mission.objectives) {
      if (o.type === 'visit' && prof?.current_spot_id === mission.spotId) progress[o.id].count = o.count;
    }
    const [res] = await conn.query('INSERT INTO mission_progress (user_id, mission_id, progress) VALUES (?, ?, ?)', [
      userId,
      missionId,
      JSON.stringify(progress),
    ]);
    return { progressId: res.insertId, mission, progress, status: 'active' };
  });
}

export async function abandonMission(userId, missionId) {
  const [res] = await pool.query(
    "UPDATE mission_progress SET status = 'abandoned' WHERE user_id = ? AND mission_id = ? AND status = 'active'",
    [userId, missionId]
  );
  if (!res.affectedRows) throw new HttpError(404, 'No active mission to abandon');
}

/**
 * Complete a mission. The backend checks that every objective was satisfied
 * by validated events, then grants the rewards defined in the database.
 */
export async function completeMission(userId, missionId) {
  return withTransaction(async (conn) => {
    const [[row]] = await conn.query(
      `SELECT mp.id AS progress_id, mp.progress, m.*, s.spot_key, s.name AS spot_name
         FROM mission_progress mp
         JOIN missions m ON m.id = mp.mission_id
         JOIN tourist_spots s ON s.id = m.tourist_spot_id
        WHERE mp.user_id = ? AND mp.mission_id = ? AND mp.status = 'active'
        FOR UPDATE`,
      [userId, missionId]
    );
    if (!row) throw new HttpError(404, 'No active progress for this mission');
    const mission = serializeMission(row);
    const progress = parseJson(row.progress, {});
    if (!objectivesDone(mission.objectives, progress)) {
      throw new HttpError(422, 'Not all objectives are complete yet');
    }

    await conn.query("UPDATE mission_progress SET status = 'completed', completed_at = NOW() WHERE id = ?", [row.progress_id]);

    const trashObjective = mission.objectives.find((o) => o.type === 'collect_trash');
    const isCleanup = CLEANUP_CATEGORIES.has(mission.category) || !!trashObjective;
    const ecoBonus = isCleanup ? 10 : mission.category === 'community_service' ? 8 : 3;
    const granted = await grant(conn, userId, { xp: mission.rewardXp, coins: mission.rewardCoins, eco: ecoBonus });

    let cleanliness = null;
    if (isCleanup) {
      cleanliness = await adjustCleanliness(conn, mission.spotId, 3);
      await conn.query(
        "INSERT INTO cleanliness_records (user_id, tourist_spot_id, mission_id, source, cleanup_count, contribution_points) VALUES (?, ?, ?, 'mission', ?, ?)",
        [userId, mission.spotId, mission.id, trashObjective?.count ?? 0, ecoBonus]
      );
    }
    if (mission.category === 'marine_conservation' || mission.objectives.some((o) => o.type === 'quiz')) {
      await conn.query(
        'INSERT INTO marine_conservation_records (user_id, tourist_spot_id, activity_type, details) VALUES (?, ?, ?, ?)',
        [userId, mission.spotId, 'mission', mission.title]
      );
    }

    let badge = null;
    if (mission.rewardBadge) {
      const type = /certificate/i.test(mission.rewardBadge) ? 'certificate' : 'badge';
      const added = await addUniqueReward(conn, userId, type, `mission_${mission.key}`, mission.rewardBadge);
      if (added) badge = { name: mission.rewardBadge, type };
    }

    // Achievement milestones
    const achievements = [];
    const [[{ done }]] = await conn.query("SELECT COUNT(*) AS done FROM mission_progress WHERE user_id = ? AND status = 'completed'", [userId]);
    const milestones = [
      [1, 'first_mission', 'First Steps for Siargao'],
      [5, 'five_missions', 'Island Helper'],
      [10, 'ten_missions', 'Ocean Protector'],
      [20, 'twenty_missions', 'Hero of Siargao'],
    ];
    for (const [n, key, name] of milestones) {
      if (done >= n && (await addUniqueReward(conn, userId, 'achievement', key, name))) achievements.push(name);
    }

    return { mission, rewards: { ...granted, badge, achievements }, cleanliness };
  });
}
