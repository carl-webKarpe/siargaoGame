/**
 * Create an admin account, or promote an existing user.
 *   npm run create-admin -- <username> <email> <password>
 *   npm run create-admin -- --promote <username>
 */
import bcrypt from 'bcryptjs';
import { pool, withTransaction } from '../src/config/db.js';
import { createUserWithProfile } from '../src/models/userModel.js';

const args = process.argv.slice(2);
try {
  if (args[0] === '--promote' && args[1]) {
    const [r] = await pool.query("UPDATE users SET account_type = 'admin' WHERE username = ?", [args[1]]);
    console.log(r.affectedRows ? `Promoted ${args[1]} to admin.` : `User ${args[1]} not found.`);
  } else {
    const [username, email, password] = args;
    if (!username || !email || !password || password.length < 8) {
      console.error('Usage: npm run create-admin -- <username> <email> <password(min 8 chars)>');
      process.exitCode = 1;
    } else {
      const passwordHash = await bcrypt.hash(password, 12);
      await withTransaction((conn) => createUserWithProfile(conn, { username, email, passwordHash, role: 'local_resident', accountType: 'admin' }));
      console.log(`Admin ${username} created.`);
    }
  }
} finally {
  await pool.end();
}
