import { Router } from 'express';
import { pool } from './db.js';
import { requireStudent } from './auth.js';

export const studentRouter = Router();

const TYPE_FROM_DB = { single: 'single', multi: 'multiple', text: 'open' };

// GET /api/student/attempts — список завершённых попыток студента.
// Для секций "Мои результаты" и "Пройденные квизы" на странице студента.
// Джоинит quizzes (для title/time_limit/deadline/status) и считает question_count.
studentRouter.get('/attempts', requireStudent, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.score, a.started_at, a.finished_at,
              q.id            AS quiz_id,
              q.title         AS quiz_title,
              q.time_limit    AS quiz_time_limit,
              q.deadline      AS quiz_deadline,
              q.status        AS quiz_status,
              (SELECT COUNT(*)::int FROM questions WHERE quiz_id = q.id) AS quiz_question_count
       FROM attempts a
       JOIN quizzes q ON q.id = a.quiz_id
       WHERE a.student_email = $1 AND a.is_completed = true
       ORDER BY a.started_at DESC`,
      [req.user.email]
    );
    res.json({ attempts: result.rows });
  } catch (err) {
    console.error('List student attempts failed:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// POST /api/student/join — вход в квиз по коду.
// Проверяет: квиз существует, опубликован (status='active'), дедлайн не прошёл.
studentRouter.post('/join', requireStudent, async (req, res) => {
  const code = String(req.body?.code || '').trim();
  if (!code) {
    return res.status(400).json({ error: 'Введите код квиза' });
  }

  try {
    const result = await pool.query(
      `SELECT id, deadline
       FROM quizzes
       WHERE share_code = $1 AND status = 'active'`,
      [code]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Квиз не найден или закрыт' });
    }

    const quiz = result.rows[0];
    if (quiz.deadline && new Date(quiz.deadline) < new Date()) {
      return res.status(400).json({ error: 'Квиз закрыт' });
    }

    res.json({ quiz_id: quiz.id });
  } catch (err) {
    console.error('Join quiz failed:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/student/quizzes/:id — квиз для прохождения. ВАЖНО: без is_correct у вариантов,
// и без вариантов вообще для открытых вопросов — фронт никогда не должен видеть ответы.
studentRouter.get('/quizzes/:id', requireStudent, async (req, res) => {
  const quizId = Number(req.params.id);
  if (!Number.isFinite(quizId)) {
    return res.status(400).json({ error: 'Invalid quiz id' });
  }

  try {
    const quizResult = await pool.query(
      `SELECT id, title, time_limit, passing_score, deadline
       FROM quizzes
       WHERE id = $1 AND status = 'active'`,
      [quizId]
    );
    if (quizResult.rowCount === 0) {
      return res.status(404).json({ error: 'Квиз не найден или не открыт' });
    }
    const quiz = quizResult.rows[0];
    if (quiz.deadline && new Date(quiz.deadline) < new Date()) {
      return res.status(400).json({ error: 'Квиз закрыт' });
    }

    const questionsResult = await pool.query(
      `SELECT id, type, text, order_index, points,
              file_name, file_mime, file_size
       FROM questions WHERE quiz_id = $1 ORDER BY order_index`,
      [quizId]
    );
    const questionIds = questionsResult.rows.map((q) => q.id);

    const optionsResult = questionIds.length
      ? await pool.query(
          `SELECT id, text, order_index, question_id
           FROM answer_options
           WHERE question_id = ANY($1::int[])
           ORDER BY question_id, order_index`,
          [questionIds]
        )
      : { rows: [] };

    const optionsByQuestion = new Map();
    for (const o of optionsResult.rows) {
      if (!optionsByQuestion.has(o.question_id)) optionsByQuestion.set(o.question_id, []);
      // Возвращаем только id и text — никаких is_correct.
      optionsByQuestion.get(o.question_id).push({ id: o.id, text: o.text });
    }

    const questions = questionsResult.rows.map((q) => {
      const uiType = TYPE_FROM_DB[q.type] || q.type;
      return {
        id: q.id,
        type: uiType,
        text: q.text,
        points: q.points,
        // Для open-вопросов варианты — это правильные ответы учителя, их фронту не отдаём.
        answers: uiType === 'open' ? [] : (optionsByQuestion.get(q.id) || []),
        // Метаданные файла, если он прикреплён. Сами байты — только через /api/files.
        file: q.file_name ? {
          name: q.file_name,
          mime: q.file_mime,
          size: q.file_size,
          url: `/api/files/question/${q.id}`,
        } : null,
      };
    });

    res.json({
      id: quiz.id,
      title: quiz.title,
      time_limit: quiz.time_limit,
      passing_score: quiz.passing_score,
      questions,
    });
  } catch (err) {
    console.error('Get student quiz failed:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// POST /api/student/attempts body {quiz_id} — старт попытки, фиксация started_at.
studentRouter.post('/attempts', requireStudent, async (req, res) => {
  const quizId = Number(req.body?.quiz_id);
  if (!Number.isFinite(quizId)) {
    return res.status(400).json({ error: 'Invalid quiz id' });
  }

  try {
    const quizResult = await pool.query(
      `SELECT id, time_limit, deadline
       FROM quizzes WHERE id = $1 AND status = 'active'`,
      [quizId]
    );
    if (quizResult.rowCount === 0) {
      return res.status(404).json({ error: 'Квиз не найден или не открыт' });
    }
    const quiz = quizResult.rows[0];
    if (quiz.deadline && new Date(quiz.deadline) < new Date()) {
      return res.status(400).json({ error: 'Квиз закрыт' });
    }

    const result = await pool.query(
      `INSERT INTO attempts (started_at, is_completed, quiz_id, student_email)
       VALUES (now(), false, $1, $2)
       RETURNING id, started_at`,
      [quizId, req.user.email]
    );

    res.status(201).json({
      id: result.rows[0].id,
      started_at: result.rows[0].started_at,
      time_limit: quiz.time_limit,
    });
  } catch (err) {
    console.error('Start attempt failed:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// POST /api/student/attempts/:id/submit — отправка ответов, проверка таймера, грейдинг.
studentRouter.post('/attempts/:id/submit', requireStudent, async (req, res) => {
  const attemptId = Number(req.params.id);
  if (!Number.isFinite(attemptId)) {
    return res.status(400).json({ error: 'Invalid attempt id' });
  }
  const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Проверка владения и статуса попытки.
    const attemptResult = await client.query(
      `SELECT a.id, a.started_at, a.is_completed, a.quiz_id,
              q.time_limit, q.show_answers
       FROM attempts a JOIN quizzes q ON q.id = a.quiz_id
       WHERE a.id = $1 AND a.student_email = $2`,
      [attemptId, req.user.email]
    );
    if (attemptResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Попытка не найдена' });
    }
    const attempt = attemptResult.rows[0];
    if (attempt.is_completed) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Попытка уже завершена' });
    }

    // Проверка таймера: если истёк — не принимаем ответы, фиксируем 0.
    const elapsedSec = (Date.now() - new Date(attempt.started_at).getTime()) / 1000;
    if (elapsedSec > attempt.time_limit * 60) {
      await client.query(
        `UPDATE attempts SET is_completed = true, finished_at = now(), score = 0
         WHERE id = $1`,
        [attemptId]
      );
      await client.query('COMMIT');
      return res.status(400).json({ error: 'Время вышло' });
    }

    // Загружаем все вопросы и варианты квиза для грейдинга.
    const questionsResult = await client.query(
      `SELECT id, type, points FROM questions WHERE quiz_id = $1`,
      [attempt.quiz_id]
    );
    const questionIds = questionsResult.rows.map((q) => q.id);
    const optionsResult = questionIds.length
      ? await client.query(
          `SELECT id, is_correct, text, question_id FROM answer_options
           WHERE question_id = ANY($1::int[])`,
          [questionIds]
        )
      : { rows: [] };
    const optionsByQuestion = new Map();
    for (const o of optionsResult.rows) {
      if (!optionsByQuestion.has(o.question_id)) optionsByQuestion.set(o.question_id, []);
      optionsByQuestion.get(o.question_id).push(o);
    }
    const answersMap = new Map(answers.map((a) => [Number(a.question_id), a]));

    let totalPoints = 0;
    let earnedPoints = 0; // float, копится с дробями для multi
    let correctCount = 0; // число вопросов, отвеченных полностью правильно

    // Идём по каждому вопросу квиза, оцениваем ответ студента, пишем в БД.
    for (const q of questionsResult.rows) {
      totalPoints += q.points;
      const userAnswer = answersMap.get(q.id);
      const options = optionsByQuestion.get(q.id) || [];
      let ratio = 0; // доля заработанного балла за вопрос (0..1)
      let textAnswer = null;

      if (userAnswer) {
        if (q.type === 'single') {
          const selected = userAnswer.selected_option_ids || [];
          const correctIds = options.filter((o) => o.is_correct).map((o) => o.id);
          ratio = selected.length === 1 && correctIds.includes(selected[0]) ? 1 : 0;
        } else if (q.type === 'multi') {
          // Частичный балл со штрафом за лишнее: max(0, верных - лишних) / всего верных.
          const selected = userAnswer.selected_option_ids || [];
          const correctIds = options.filter((o) => o.is_correct).map((o) => o.id);
          if (correctIds.length > 0) {
            let correctSelected = 0;
            let wrongSelected = 0;
            for (const id of selected) {
              if (correctIds.includes(id)) correctSelected++;
              else wrongSelected++;
            }
            const balance = Math.max(0, correctSelected - wrongSelected);
            ratio = balance / correctIds.length;
          }
        } else if (q.type === 'text') {
          textAnswer = String(userAnswer.text_answer || '').trim();
          const userNorm = textAnswer.toLowerCase();
          const correctTexts = options
            .filter((o) => o.is_correct)
            .map((o) => o.text.trim().toLowerCase());
          ratio = !!userNorm && correctTexts.includes(userNorm) ? 1 : 0;
        }
      }

      earnedPoints += q.points * ratio;
      // is_correct в БД пишем только если вопрос отвечен идеально (для разбора и совместимости).
      const isCorrect = ratio === 1;
      if (isCorrect) correctCount++;

      // Сохраняем ответ студента и его выбранные варианты.
      const saRes = await client.query(
        `INSERT INTO student_answers (text_answer, is_correct, attempt_id, question_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [textAnswer, isCorrect, attemptId, q.id]
      );
      const studentAnswerId = saRes.rows[0].id;

      if ((q.type === 'single' || q.type === 'multi') && userAnswer?.selected_option_ids) {
        for (const optionId of userAnswer.selected_option_ids) {
          await client.query(
            `INSERT INTO selected_options (student_answer_id, option_id)
             VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [studentAnswerId, optionId]
          );
        }
      }
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    await client.query(
      `UPDATE attempts SET finished_at = now(), is_completed = true, score = $1
       WHERE id = $2`,
      [score, attemptId]
    );

    await client.query('COMMIT');

    // Если учитель разрешил — отдаём правильные ответы по каждому вопросу,
    // чтобы фронт мог показать разбор. Иначе ничего не отдаём.
    const response = {
      score,
      total_questions: questionsResult.rows.length,
      correct_count: correctCount,
      show_answers: attempt.show_answers,
    };
    if (attempt.show_answers) {
      response.answers = questionsResult.rows.map((q) => {
        const opts = optionsByQuestion.get(q.id) || [];
        if (q.type === 'text') {
          return {
            question_id: q.id,
            correct_texts: opts.filter((o) => o.is_correct).map((o) => o.text),
          };
        }
        return {
          question_id: q.id,
          correct_option_ids: opts.filter((o) => o.is_correct).map((o) => o.id),
        };
      });
    }
    res.json(response);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Submit attempt failed:', err);
    res.status(500).json({ error: 'Internal error' });
  } finally {
    client.release();
  }
});
