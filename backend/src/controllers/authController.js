import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { withTransaction } from '../config/db.js';
import { HttpError } from '../utils/http.js';
import { signToken } from '../middleware/auth.js';
import { createUserWithProfile, existsUsernameOrEmail, findByLogin, touchLogin } from '../models/userModel.js';
import { getProfile } from '../models/profileModel.js';

export const registerSchema = z
  .object({
    username: z.string().trim().min(3, 'Username must be at least 3 characters').max(32)
      .regex(/^[A-Za-z0-9_]+$/, 'Username may only contain letters, numbers and underscores'),
    email: z.string().trim().toLowerCase().email('Enter a valid email').max(255),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128)
      .regex(/[A-Za-z]/, 'Password needs a letter').regex(/[0-9]/, 'Password needs a number'),
    confirmPassword: z.string(),
    role: z.enum(['local_resident', 'tourist'], { message: 'Choose Local Resident or Tourist' }),
  })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export const loginSchema = z.object({
  login: z.string().trim().min(1, 'Enter your username or email').max(255),
  password: z.string().min(1, 'Enter your password').max(128),
});

export async function register(req, res) {
  const { username, email, password, role } = req.body;
  const clash = await existsUsernameOrEmail(username, email);
  if (clash.some((r) => r.username.toLowerCase() === username.toLowerCase())) throw new HttpError(409, 'Username is already taken');
  if (clash.some((r) => r.email.toLowerCase() === email)) throw new HttpError(409, 'Email is already registered');

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = await withTransaction((conn) => createUserWithProfile(conn, { username, email, passwordHash, role }));
  const profile = await getProfile(userId);
  res.status(201).json({ token: signToken({ id: userId }), profile });
}

// Equalise timing between unknown users and wrong passwords.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-password', 12);

export async function login(req, res) {
  const { login: loginId, password } = req.body;
  const user = await findByLogin(loginId);
  const ok = await bcrypt.compare(password, user?.password_hash || DUMMY_HASH);
  if (!user || !ok) throw new HttpError(401, 'Invalid username/email or password');
  await touchLogin(user.id);
  const profile = await getProfile(user.id);
  res.json({ token: signToken(user), profile });
}

export async function me(req, res) {
  res.json({ profile: await getProfile(req.user.id) });
}
