import express from 'express';
import { pool } from './db.js';
import { authRouter } from './auth.js';
import { teacherQuizzesRouter } from './quizzes.js';
import { studentRouter } from './student.js';

const app = express();
app.use(express.json()); // понимаем JSON в теле POST/PUT-запросов

// Роуты авторизации.
app.use('/api/auth', authRouter);

// Роуты учителя для квизов.
app.use('/api/teacher/quizzes', teacherQuizzesRouter);

// Роуты студента.
app.use('/api/student', studentRouter);

// Проверка здоровья: пингуем базу и отвечаем, всё ли ок.
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1 AS ok');
    res.json({ ok: true, db: result.rows[0].ok === 1 });
  } catch (err) {
    console.error('DB query failed:', err.message);
    res.status(500).json({ ok: false, error: 'database unreachable' });
  }
});

const PORT = process.env.PORT || 3000;

// Перед стартом проверяем, что база отвечает — если нет, падаем сразу.
async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('Connected to Postgres');
  } catch (err) {
    console.error('Failed to connect to Postgres:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

start();
