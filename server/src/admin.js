import { Router } from 'express';
import { pool } from './db.js';
import { requireAdmin } from './auth.js';

export const adminRouter = Router();

// GET /api/admin/users — все пользователи.
adminRouter.get('/users', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT email, isu, name, role, is_blocked
       FROM users
       ORDER BY role, name`
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Admin list users failed:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/admin/quizzes — все квизы с автором и числом попыток.
adminRouter.get('/quizzes', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT q.id, q.title, q.status, q.time_limit, q.passing_score,
              q.share_code, q.deadline,
              q.teacher_email,
              u.name AS teacher_name,
              (SELECT COUNT(*)::int FROM questions WHERE quiz_id = q.id)    AS question_count,
              (SELECT COUNT(*)::int FROM attempts  WHERE quiz_id = q.id)    AS attempt_count
       FROM quizzes q
       JOIN users u ON u.email = q.teacher_email
       ORDER BY q.id DESC`
    );
    res.json({ quizzes: result.rows });
  } catch (err) {
    console.error('Admin list quizzes failed:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/admin/attempts — все завершённые попытки прохождения.
adminRouter.get('/attempts', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.score, a.started_at, a.finished_at, a.is_completed,
              q.id AS quiz_id, q.title AS quiz_title,
              u.email AS student_email, u.name AS student_name, u.isu AS student_isu
       FROM attempts a
       JOIN quizzes q ON q.id = a.quiz_id
       JOIN users   u ON u.email = a.student_email
       ORDER BY a.started_at DESC`
    );
    res.json({ attempts: result.rows });
  } catch (err) {
    console.error('Admin list attempts failed:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// DELETE /api/admin/quizzes/:id — удалить любой квиз вместе со всем содержимым.
adminRouter.delete('/quizzes/:id', requireAdmin, async (req, res) => {
  const quizId = Number(req.params.id);
  if (!Number.isFinite(quizId)) {
    return res.status(400).json({ error: 'Invalid quiz id' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `DELETE FROM selected_options
       WHERE student_answer_id IN (
         SELECT sa.id FROM student_answers sa
         JOIN attempts a ON a.id = sa.attempt_id
         WHERE a.quiz_id = $1
       )`,
      [quizId]
    );
    await client.query(
      `DELETE FROM student_answers
       WHERE attempt_id IN (SELECT id FROM attempts WHERE quiz_id = $1)`,
      [quizId]
    );
    await client.query('DELETE FROM attempts WHERE quiz_id = $1', [quizId]);
    await client.query(
      `DELETE FROM answer_options
       WHERE question_id IN (SELECT id FROM questions WHERE quiz_id = $1)`,
      [quizId]
    );
    await client.query('DELETE FROM questions WHERE quiz_id = $1', [quizId]);
    const result = await client.query(
      'DELETE FROM quizzes WHERE id = $1 RETURNING id',
      [quizId]
    );
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Quiz not found' });
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Admin delete quiz failed:', err);
    res.status(500).json({ error: 'Internal error' });
  } finally {
    client.release();
  }
});

// DELETE /api/admin/attempts/:id — удалить одну попытку с её ответами.
adminRouter.delete('/attempts/:id', requireAdmin, async (req, res) => {
  const attemptId = Number(req.params.id);
  if (!Number.isFinite(attemptId)) {
    return res.status(400).json({ error: 'Invalid attempt id' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `DELETE FROM selected_options
       WHERE student_answer_id IN (
         SELECT id FROM student_answers WHERE attempt_id = $1
       )`,
      [attemptId]
    );
    await client.query('DELETE FROM student_answers WHERE attempt_id = $1', [attemptId]);
    const result = await client.query(
      'DELETE FROM attempts WHERE id = $1 RETURNING id',
      [attemptId]
    );
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Attempt not found' });
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Admin delete attempt failed:', err);
    res.status(500).json({ error: 'Internal error' });
  } finally {
    client.release();
  }
});

// POST /api/admin/users/:email/block — заблокировать пользователя.
adminRouter.post('/users/:email/block', requireAdmin, async (req, res) => {
  const email = req.params.email;
  // Нельзя заблокировать самого себя — защита от случайной потери доступа.
  if (email === req.user.email) {
    return res.status(400).json({ error: 'Нельзя заблокировать самого себя' });
  }
  try {
    const result = await pool.query(
      'UPDATE users SET is_blocked = true WHERE email = $1 RETURNING email',
      [email]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin block user failed:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// DELETE /api/admin/users/:email — удалить пользователя со всеми его данными.
// Если это учитель — удаляются все его квизы (со всеми попытками других студентов в них).
// Если это студент — удаляются все его попытки прохождения.
adminRouter.delete('/users/:email', requireAdmin, async (req, res) => {
  const email = req.params.email;
  if (email === req.user.email) {
    return res.status(400).json({ error: 'Нельзя удалить самого себя' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Удаляем всё, связанное с попытками пользователя (как студента) или с квизами пользователя (как учителя).
    // selected_options зависят от student_answers — чистим в первую очередь.
    await client.query(
      `DELETE FROM selected_options
       WHERE student_answer_id IN (
         SELECT sa.id FROM student_answers sa
         JOIN attempts a ON a.id = sa.attempt_id
         WHERE a.student_email = $1
            OR a.quiz_id IN (SELECT id FROM quizzes WHERE teacher_email = $1)
       )`,
      [email]
    );
    await client.query(
      `DELETE FROM student_answers
       WHERE attempt_id IN (
         SELECT id FROM attempts
         WHERE student_email = $1
            OR quiz_id IN (SELECT id FROM quizzes WHERE teacher_email = $1)
       )`,
      [email]
    );
    await client.query(
      `DELETE FROM attempts
       WHERE student_email = $1
          OR quiz_id IN (SELECT id FROM quizzes WHERE teacher_email = $1)`,
      [email]
    );
    await client.query(
      `DELETE FROM answer_options
       WHERE question_id IN (
         SELECT id FROM questions
         WHERE quiz_id IN (SELECT id FROM quizzes WHERE teacher_email = $1)
       )`,
      [email]
    );
    await client.query(
      `DELETE FROM questions
       WHERE quiz_id IN (SELECT id FROM quizzes WHERE teacher_email = $1)`,
      [email]
    );
    await client.query('DELETE FROM quizzes WHERE teacher_email = $1', [email]);

    const result = await client.query(
      'DELETE FROM users WHERE email = $1 RETURNING email',
      [email]
    );
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Admin delete user failed:', err);
    res.status(500).json({ error: 'Internal error' });
  } finally {
    client.release();
  }
});

// POST /api/admin/users/:email/unblock — разблокировать пользователя.
adminRouter.post('/users/:email/unblock', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE users SET is_blocked = false WHERE email = $1 RETURNING email',
      [req.params.email]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin unblock user failed:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});
