import { pool } from '../config/db.js';
import { listSpots } from '../models/spotModel.js';

/** Shared island conservation dashboard — computed only from validated records. */
export async function progress(_req, res) {
  const spots = await listSpots();
  const [[totals]] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM mission_progress mp JOIN missions m ON m.id = mp.mission_id
         WHERE mp.status = 'completed' AND m.mission_category IN ('beach_cleanup','environmental_protection')) AS cleanup_missions,
       (SELECT COUNT(*) FROM mission_progress WHERE status = 'completed') AS all_missions,
       (SELECT COALESCE(SUM(contribution_points),0) FROM cleanliness_records) AS contribution_points,
       (SELECT COALESCE(SUM(cleanup_count),0) FROM cleanliness_records WHERE source = 'pickup') AS trash_collected,
       (SELECT COUNT(*) FROM marine_conservation_records) AS marine_records,
       (SELECT COUNT(*) FROM cleanliness_records WHERE source = 'maintenance') AS maintenance_records,
       (SELECT COUNT(*) FROM users WHERE role = 'local_resident' AND account_type = 'player') AS locals,
       (SELECT COUNT(*) FROM users WHERE role = 'tourist' AND account_type = 'player') AS tourists`
  );
  const [byRole] = await pool.query(
    `SELECT u.role, COALESCE(SUM(cr.contribution_points),0) AS points
       FROM cleanliness_records cr JOIN users u ON u.id = cr.user_id GROUP BY u.role`
  );
  const [recent] = await pool.query(
    `SELECT cr.source, cr.cleanup_count, cr.contribution_points, cr.created_at, u.username, u.role, s.name AS spot, m.title AS mission
       FROM cleanliness_records cr
       JOIN users u ON u.id = cr.user_id
       JOIN tourist_spots s ON s.id = cr.tourist_spot_id
       LEFT JOIN missions m ON m.id = cr.mission_id
      WHERE cr.source IN ('mission','maintenance')
      ORDER BY cr.created_at DESC, cr.id DESC LIMIT 12`
  );
  const [topHelpers] = await pool.query(
    `SELECT u.username, u.role, p.eco_points FROM player_profiles p JOIN users u ON u.id = p.user_id
      WHERE u.account_type = 'player' AND p.eco_points > 0 ORDER BY p.eco_points DESC LIMIT 5`
  );
  const overall = spots.length ? spots.reduce((a, s) => a + s.cleanliness, 0) / spots.length : 0;
  res.json({
    overallCleanliness: Math.round(overall * 10) / 10,
    spots: spots.map((s) => ({ key: s.key, name: s.name, cleanliness: s.cleanliness })),
    totals: Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, Number(v)])),
    contributionByRole: Object.fromEntries(byRole.map((r) => [r.role, Number(r.points)])),
    recentMaintenance: recent,
    topHelpers,
  });
}

export async function cleanliness(_req, res) {
  const spots = await listSpots();
  const [rows] = await pool.query(
    `SELECT tourist_spot_id, COALESCE(SUM(cleanup_count),0) AS items, COALESCE(SUM(contribution_points),0) AS points, COUNT(DISTINCT user_id) AS helpers
       FROM cleanliness_records GROUP BY tourist_spot_id`
  );
  const by = new Map(rows.map((r) => [r.tourist_spot_id, r]));
  res.json({
    spots: spots.map((s) => ({
      key: s.key, name: s.name, cleanliness: s.cleanliness,
      itemsCollected: Number(by.get(s.id)?.items ?? 0),
      contributionPoints: Number(by.get(s.id)?.points ?? 0),
      helpers: Number(by.get(s.id)?.helpers ?? 0),
    })),
  });
}
