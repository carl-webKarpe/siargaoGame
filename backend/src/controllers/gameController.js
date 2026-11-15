/** NPC talks, quizzes and cleanup pickups. */
import { z } from 'zod';
import { pool, withTransaction } from '../config/db.js';
import { HttpError, parseJson } from '../utils/http.js';
import { getProfile, grant } from '../models/profileModel.js';
import { applyEvent } from '../services/missionService.js';
import { collectTrash } from '../services/cleanupService.js';

export async function talkToNpc(req, res) {
  const [[npc]] = await pool.query(
    'SELECT n.*, s.spot_key FROM npcs n JOIN tourist_spots s ON s.id = n.tourist_spot_id WHERE n.npc_key = ?',
    [req.params.key]
  );
  if (!npc) throw new HttpError(404, 'NPC not found');
  const missionUpdates = await withTransaction((conn) =>
    applyEvent(conn, req.user.id, { type: 'talk_npc', spotId: npc.tourist_spot_id, target: npc.npc_key, uniqueKey: 'talk' })
  );
  res.json({
    npc: { key: npc.npc_key, name: npc.name, role: npc.npc_role, dialogue: parseJson(npc.dialogue, []), info: npc.info, spotKey: npc.spot_key },
    missionUpdates,
  });
}

/** Quiz questions without the answers. */
export async function getQuiz(req, res) {
  const [[quiz]] = await pool.query(
    'SELECT q.*, s.spot_key FROM quizzes q JOIN tourist_spots s ON s.id = q.tourist_spot_id WHERE q.quiz_key = ?',
    [req.params.key]
  );
  if (!quiz) throw new HttpError(404, 'Quiz not found');
  const [questions] = await pool.query('SELECT id, question, options FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order, id', [quiz.id]);
  res.json({
    quiz: {
      key: quiz.quiz_key, title: quiz.title, category: quiz.category, spotKey: quiz.spot_key, passRatio: Number(quiz.pass_ratio),
      questions: questions.map((q) => ({ id: q.id, question: q.question, options: parseJson(q.options, []) })),
    },
  });
}

export const quizSubmitSchema = z.object({ answers: z.array(z.number().int().min(0).max(9)).min(1).max(30) });

/** Grade a quiz on the server. */
export async function submitQuiz(req, res) {
  const userId = req.user.id;
  const [[quiz]] = await pool.query('SELECT * FROM quizzes WHERE quiz_key = ?', [req.params.key]);
  if (!quiz) throw new HttpError(404, 'Quiz not found');
  const [questions] = await pool.query(
    'SELECT id, correct_index, explanation FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order, id',
    [quiz.id]
  );
  const { answers } = req.body;
  if (answers.length !== questions.length) throw new HttpError(400, 'Answer every question');

  const results = questions.map((q, i) => ({ correct: answers[i] === q.correct_index, correctIndex: q.correct_index, explanation: q.explanation }));
  const score = results.filter((r) => r.correct).length;
  const passed = score / questions.length >= Number(quiz.pass_ratio);

  const out = await withTransaction(async (conn) => {
    const [[prev]] = await conn.query('SELECT COUNT(*) AS n FROM quiz_attempts WHERE user_id = ? AND quiz_id = ? AND passed = 1', [userId, quiz.id]);
    await conn.query('INSERT INTO quiz_attempts (user_id, quiz_id, score, total, passed) VALUES (?, ?, ?, ?, ?)', [
      userId, quiz.id, score, questions.length, passed,
    ]);
    let rewards = null;
    let missionUpdates = [];
    if (passed) {
      // First pass only grants XP, so quizzes cannot be farmed.
      if (!Number(prev.n)) rewards = await grant(conn, userId, { xp: 20 * score, coins: 10 * score, eco: quiz.category === 'marine' ? 3 : 1 });
      if (quiz.category === 'marine') {
        await conn.query(
          'INSERT INTO marine_conservation_records (user_id, tourist_spot_id, activity_type, details) VALUES (?, ?, ?, ?)',
          [userId, quiz.tourist_spot_id, 'quiz', `${quiz.title}: ${score}/${questions.length}`]
        );
      }
      missionUpdates = await applyEvent(conn, userId, { type: 'quiz', spotId: quiz.tourist_spot_id, target: quiz.quiz_key, uniqueKey: 'quiz' });
    }
    return { rewards, missionUpdates };
  });
  res.json({ score, total: questions.length, passed, results, ...out, profile: await getProfile(userId) });
}

export const collectSchema = z.object({
  spotId: z.union([z.number().int().positive(), z.string().min(1).max(40)]),
  trashIndex: z.number().int().min(0).max(500),
});

export async function collect(req, res) {
  const result = await collectTrash(req.user.id, req.body.spotId, req.body.trashIndex);
  res.json({ ...result, profile: await getProfile(req.user.id) });
}
