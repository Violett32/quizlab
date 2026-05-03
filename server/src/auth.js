import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = '7d'; // токен живёт 7 дней

// Создание JWT с email и ролью внутри.
function signToken(user) {
  return jwt.sign(
    { email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

// Лимит на аватар (исходный размер до base64).
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 МБ

// Превращает строку аватара из БД в data: URL для <img :src>.
// Возвращает null, если аватара нет.
function buildAvatarDataUrl(data, mime) {
  if (!data) return null;
  return `data:${mime || 'application/octet-stream'};base64,${data.toString('base64')}`;
}

// Middleware: проверяет токен в заголовке Authorization.
// Если ок — кладёт { email, role } в req.user. Если нет — отвечает 401.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' });
  }
  const token = header.slice('Bearer '.length);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Поверх requireAuth: пропускает только учителей.
export function requireTeacher(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Teacher role required' });
    }
    next();
  });
}

// Поверх requireAuth: пропускает только студентов.
export function requireStudent(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Student role required' });
    }
    next();
  });
}

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  const { email, password, isu, name, role } = req.body ?? {};

  // Минимальная валидация: всё обязательное на месте, роль из двух вариантов.
  if (!email || !password || !isu || !name || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (role !== 'teacher' && role !== 'student') {
    return res.status(400).json({ error: 'Role must be teacher or student' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password, isu, name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING email, isu, name, role`,
      [email, passwordHash, isu, name, role]
    );
    const user = result.rows[0];
    res.status(201).json({ user, token: signToken(user) });
  } catch (err) {
    if (err.code === '23505') {
      // нарушение UNIQUE — email уже занят
      return res.status(409).json({ error: 'Этот email уже зарегистрирован' });
    }
    console.error('Register failed:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const result = await pool.query(
      'SELECT email, password, isu, name, role, avatar_data, avatar_mime FROM users WHERE email = $1',
      [email]
    );
    const row = result.rows[0];
    if (!row) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const ok = await bcrypt.compare(password, row.password);
    if (!ok) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    // не отдаём хэш пароля наружу
    const user = {
      email: row.email,
      isu: row.isu,
      name: row.name,
      role: row.role,
      avatar: buildAvatarDataUrl(row.avatar_data, row.avatar_mime),
    };
    res.json({ user, token: signToken(user) });
  } catch (err) {
    console.error('Login failed:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/auth/me — текущий юзер по токену.
authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT email, isu, name, role, avatar_data, avatar_mime FROM users WHERE email = $1',
      [req.user.email]
    );
    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = {
      email: row.email,
      isu: row.isu,
      name: row.name,
      role: row.role,
      avatar: buildAvatarDataUrl(row.avatar_data, row.avatar_mime),
    };
    res.json({ user });
  } catch (err) {
    console.error('/me failed:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// POST /api/auth/avatar — загрузка/замена аватара.
// Принимает { base64, mime }. Mime должен начинаться с 'image/'. Лимит 2 МБ.
authRouter.post('/avatar', requireAuth, async (req, res) => {
  const { base64, mime } = req.body ?? {};
  if (!base64 || !mime) {
    return res.status(400).json({ error: 'Missing base64 or mime' });
  }
  if (!String(mime).startsWith('image/')) {
    return res.status(400).json({ error: 'Аватар должен быть изображением' });
  }
  const data = Buffer.from(base64, 'base64');
  if (data.length > MAX_AVATAR_BYTES) {
    return res.status(400).json({ error: 'Аватар больше 2 МБ' });
  }
  try {
    await pool.query(
      'UPDATE users SET avatar_data = $1, avatar_mime = $2 WHERE email = $3',
      [data, mime, req.user.email]
    );
    // Возвращаем готовый data URL, чтобы фронт сразу обновил <img :src>.
    res.json({ avatar: buildAvatarDataUrl(data, mime) });
  } catch (err) {
    console.error('Upload avatar failed:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});
