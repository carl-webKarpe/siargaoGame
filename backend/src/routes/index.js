import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler as h } from '../utils/http.js';
import { optionalAuth, requireAdmin, requireAuth } from '../middleware/auth.js';
import { validateBody as v } from '../middleware/validate.js';
import * as auth from '../controllers/authController.js';
import * as player from '../controllers/playerController.js';
import * as spots from '../controllers/spotController.js';
import * as missions from '../controllers/missionController.js';
import * as activities from '../controllers/activityController.js';
import * as game from '../controllers/gameController.js';
import * as surfing from '../controllers/surfingController.js';
import * as shop from '../controllers/shopController.js';
import * as community from '../controllers/communityController.js';
import * as admin from '../controllers/adminController.js';

const router = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' } });
const gameLimiter = rateLimit({ windowMs: 60 * 1000, limit: 240, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' } });

router.get('/health', (_req, res) => res.json({ ok: true }));

// Authentication
router.post('/auth/register', authLimiter, v(auth.registerSchema), h(auth.register));
router.post('/auth/login', authLimiter, v(auth.loginSchema), h(auth.login));
router.get('/auth/me', requireAuth, h(auth.me));

// Players
router.get('/players/profile', requireAuth, h(player.profile));
router.put('/players/profile', requireAuth, v(player.updateProfileSchema), h(player.updateProfile));
router.get('/players/missions', requireAuth, h(player.myMissions));
router.get('/players/inventory', requireAuth, h(player.inventory));

// Tourist destinations
router.get('/tourist-spots', h(spots.list));
router.get('/tourist-spots/:id', h(spots.detail));
router.get('/tourist-spots/:id/trash', requireAuth, h(spots.trash));
router.post('/tourist-spots/:id/visit', requireAuth, gameLimiter, h(spots.visit));

// Missions
router.get('/missions', optionalAuth, h(missions.list));
router.get('/missions/:id', h(missions.detail));
router.post('/missions/:id/start', requireAuth, gameLimiter, h(missions.start));
router.post('/missions/:id/complete', requireAuth, gameLimiter, h(missions.complete));
router.post('/missions/:id/abandon', requireAuth, gameLimiter, h(missions.abandon));

// Activities & gameplay events
router.get('/activities', h(activities.list));
router.post('/activities/:id/complete', requireAuth, gameLimiter, v(activities.completeActivitySchema), h(activities.complete));
router.post('/npcs/:key/talk', requireAuth, gameLimiter, h(game.talkToNpc));
router.get('/quizzes/:key', h(game.getQuiz));
router.post('/quizzes/:key/submit', requireAuth, gameLimiter, v(game.quizSubmitSchema), h(game.submitQuiz));
router.post('/cleanup/collect', requireAuth, gameLimiter, v(game.collectSchema), h(game.collect));

// Shop
router.get('/shop/items', optionalAuth, h(shop.items));
router.post('/shop/buy', requireAuth, gameLimiter, v(shop.buySchema), h(shop.buy));

// Community progress
router.get('/community/progress', h(community.progress));
router.get('/community/cleanliness', h(community.cleanliness));

// Surfing
router.post('/surfing/submit-score', requireAuth, gameLimiter, v(surfing.surfScoreSchema), h(surfing.submitScore));
router.get('/surfing/leaderboard', h(surfing.leaderboard));

// Admin (role-based)
const a = Router();
a.use(requireAuth, requireAdmin);
a.get('/stats', h(admin.stats));
a.get('/lookups', h(admin.lookups));
a.get('/players', h(admin.players));
a.get('/players/:id', h(admin.playerDetail));
a.get('/tourist-spots', h(admin.listAllSpots));
a.post('/tourist-spots', v(admin.spotSchema), h(admin.createSpot));
a.put('/tourist-spots/:id', v(admin.spotSchema), h(admin.updateSpot));
a.get('/missions', h(admin.listAllMissions));
a.post('/missions', v(admin.missionSchema), h(admin.createMission));
a.put('/missions/:id', v(admin.missionSchema), h(admin.updateMission));
a.get('/activities', h(admin.listAllActivities));
a.post('/activities', v(admin.activitySchema), h(admin.createActivity));
a.put('/activities/:id', v(admin.activitySchema), h(admin.updateActivity));
a.get('/records/:type', h(admin.records));
router.use('/admin', a);

export default router;
