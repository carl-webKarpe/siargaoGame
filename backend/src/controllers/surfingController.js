import { z } from 'zod';
import { pool, withTransaction } from '../config/db.js';
import { HttpError } from '../utils/http.js';
import { findSpot } from '../models/spotModel.js';
import { getProfile, grant } from '../models/profileModel.js';
import { addUniqueReward, hasReward } from '../models/rewardModel.js';
import { applyEvent } from '../services/missionService.js';

export const surfScoreSchema = z.object({
  spotId: z.union([z.number().int().positive(), z.string().min(1).max(40)]),
  challenge: z.enum(['tutorial', 'beginner', 'intermediate', 'free']),
  boardKey: z.string().min(1).max(60),
  score: z.number().int().min(0).max(100000),
  duration: z.number().min(0).max(120),
  waves: z.number().int().min(1).max(10).default(1),
  carves: z.number().int().min(0).max(500),
});

/** Challenge rules live on the server; the client cannot claim a pass. */
export const CHALLENGES = {
  tutorial: (s) => s.duration >= 3,
  beginner: (s) => s.duration >= 8 && s.score >= 500,
  intermediate: (s) => s.duration >= 15 && s.carves >= 4 && s.score >= 1800,
  free: () => false,
};
const CHALLENGE_BADGES = {
  beginner: ['surf_beginner', 'Beginner Surfer'],
  intermediate: ['surf_intermediate', 'Wave Rider'],
};

/** Upper bound on what a real ride of this length could score (see frontend surf scoring). */
const maxPlausibleScore = (s) => 400 + s.duration * 160 + s.carves * 120;

export async function submitScore(req, res) {
  const userId = req.user.id;
  const s = req.body;
  const spot = await findSpot(s.spotId);
  if (!spot || !spot.environment.surf) throw new HttpError(422, 'This destination has no surf break');
  if (!(await hasReward(pool, userId, 'surfboard', s.boardKey))) throw new HttpError(403, 'You do not own that surfboard');
  if (s.score > maxPlausibleScore(s)) throw new HttpError(422, 'Score rejected: not plausible for this ride');
  if (s.carves > Math.ceil(s.duration * 2)) throw new HttpError(422, 'Score rejected: too many carves for this ride');

  // A ride cannot be submitted faster than it could be surfed.
  const [[last]] = await pool.query(
    'SELECT TIMESTAMPDIFF(SECOND, MAX(completed_at), NOW()) AS secs FROM surfing_records WHERE user_id = ?',
    [userId]
  );
  if (last.secs !== null && Number(last.secs) < Math.max(2, s.duration * 0.8)) {
    throw new HttpError(429, 'Score rejected: rides are being submitted too quickly');
  }

  const passed = CHALLENGES[s.challenge](s);
  const result = await withTransaction(async (conn) => {
    await conn.query(
      `INSERT INTO surfing_records (user_id, tourist_spot_id, challenge, board_key, score, duration, waves, carves, passed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, spot.id, s.challenge, s.boardKey, s.score, s.duration, s.waves, s.carves, passed]
    );
    const rewards = await grant(conn, userId, {
      xp: Math.min(150, Math.floor(s.score / 20)) + (passed ? 30 : 0),
      coins: Math.min(80, Math.floor(s.score / 50)),
      surf: passed ? 3 : s.duration >= 3 ? 1 : 0,
    });
    let badge = null;
    let missionUpdates = [];
    if (passed) {
      const b = CHALLENGE_BADGES[s.challenge];
      if (b && (await addUniqueReward(conn, userId, 'badge', b[0], b[1]))) badge = b[1];
      // An intermediate pass also satisfies beginner objectives.
      const levels = s.challenge === 'intermediate' ? ['intermediate', 'beginner'] : [s.challenge];
      for (const target of levels) {
        missionUpdates.push(...(await applyEvent(conn, userId, { type: 'surf', spotId: spot.id, target, uniqueKey: 'surf' })));
      }
    }
    return { rewards: { ...rewards, badge }, missionUpdates };
  });
  res.json({ passed, ...result, profile: await getProfile(userId) });
}

export async function leaderboard(req, res) {
  const params = [];
  let where = '';
  if (req.query.spot) {
    const spot = await findSpot(String(req.query.spot));
    if (!spot) throw new HttpError(404, 'Destination not found');
    where = 'WHERE sr.tourist_spot_id = ?';
    params.push(spot.id);
  }
  const [rows] = await pool.query(
    `SELECT u.username, u.role, MAX(sr.score) AS best, COUNT(*) AS rides
       FROM surfing_records sr JOIN users u ON u.id = sr.user_id ${where}
      GROUP BY u.id ORDER BY best DESC LIMIT 10`,
    params
  );
  res.json({ leaderboard: rows.map((r, i) => ({ rank: i + 1, username: r.username, role: r.role, best: Number(r.best), rides: Number(r.rides) })) });
}
