import { Router } from 'express';
import { pool } from './db.js';
import { requireTeacher } from './auth.js';

export const teacherRouter = Router();

// GET /api/teacher/results — все завершённые попытки по квизам этого учителя.
// Фронт сам группирует по квизам и считает агрегаты (средний балл, число студентов).
// Сортировка: сначала по quiz_id (DESC — свежие квизы сверху), потом по started_at (DESC).
teacherRouter.get('/results', requireTeacher, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.score, a.started_at, a.finished_at,
              q.id            AS quiz_id,
              q.title         AS quiz_title,
              q.passing_score AS quiz_passing_score,
              u.email         AS student_email,
              u.name          AS student_name,
              u.isu           AS student_isu
       FROM attempts a
       JOIN quizzes q ON q.id = a.quiz_id
       JOIN users u   ON u.email = a.student_email
       WHERE q.teacher_email = $1 AND a.is_completed = true
       ORDER BY q.id DESC, a.started_at DESC`,
      [req.user.email]
    );
    res.json({ attempts: result.rows });
  } catch (err) {
    console.error('List teacher results failed:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});
