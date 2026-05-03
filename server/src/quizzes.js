import { Router } from 'express';
import { pool } from './db.js';
import { requireTeacher } from './auth.js';

export const teacherQuizzesRouter = Router();

// Маппинг типов вопросов: фронт → БД.
// На фронте: 'single' | 'multiple' | 'open'
// В БД (enum question_type): 'single' | 'multi' | 'text'
const TYPE_TO_DB = { single: 'single', multiple: 'multi', open: 'text' };
const TYPE_FROM_DB = { single: 'single', multi: 'multiple', text: 'open' };

// Проверка целостности вопросов: у каждого должен быть хотя бы один правильный ответ.
// Возвращает строку-ошибку (для отдачи в 400) или null, если всё ок.
function validateQuestions(questions) {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const answers = Array.isArray(q.answers) ? q.answers : [];
    const hasCorrect = q.type === 'open'
      ? answers.some((a) => a.correct && (a.text || '').trim())
      : answers.some((a) => a.correct);
    if (!hasCorrect) {
      return q.type === 'open'
        ? `Вопрос ${i + 1}: добавьте хотя бы один правильный ответ`
        : `Вопрос ${i + 1}: отметьте хотя бы один правильный ответ`;
    }
  }
  return null;
}

// Жёсткий лимит на размер прикреплённого файла. Бэк проверяет независимо от фронта.
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 МБ

// Раскладывает файл вопроса (если есть) в четвёрку для INSERT: [data, name, mime, size].
// Если файла нет или нет base64 — возвращает четыре null.
function unpackFile(file) {
  if (!file || !file.base64) return [null, null, null, null];
  const data = Buffer.from(file.base64, 'base64');
  if (data.length > MAX_FILE_BYTES) {
    const err = new Error('Файл больше 10 МБ');
    err.code = 'FILE_TOO_LARGE';
    throw err;
  }
  return [
    data,
    file.name || 'file',
    file.mime || 'application/octet-stream',
    data.length,
  ];
}

// Вспомогалка: вставляет вопросы и варианты в открытом транзакционном клиенте.
async function insertQuestions(client, quizId, questions) {
  for (let qi = 0; qi < questions.length; qi++) {
    const q = questions[qi];
    const dbType = TYPE_TO_DB[q.type];
    if (!dbType) throw new Error(`Unknown question type: ${q.type}`);

    const [fileData, fileName, fileMime, fileSize] = unpackFile(q.file);

    const qRes = await client.query(
      `INSERT INTO questions
         (type, text, order_index, points, quiz_id,
          file_data, file_name, file_mime, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [dbType, q.text || '', qi, q.points ?? 1, quizId,
       fileData, fileName, fileMime, fileSize]
    );
    const questionId = qRes.rows[0].id;

    const answers = Array.isArray(q.answers) ? q.answers : [];
    for (let ai = 0; ai < answers.length; ai++) {
      const a = answers[ai];
      await client.query(
        `INSERT INTO answer_options (text, is_correct, order_index, question_id)
         VALUES ($1, $2, $3, $4)`,
        [a.text || '', !!a.correct, ai, questionId]
      );
    }
  }
}

// Генерация случайного 6-значного кода (как строки, чтобы лидирующий ноль не терялся).
function generateShareCode() {
  return Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
}

// POST /api/teacher/quizzes — создание черновика со всеми вопросами и вариантами.
// Всё в одной транзакции: либо весь квиз сохранён, либо ничего.
teacherQuizzesRouter.post('/', requireTeacher, async (req, res) => {
  const { title, time_limit, passing_score, questions } = req.body ?? {};

  if (!title || !time_limit || passing_score == null || !Array.isArray(questions)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (questions.length === 0) {
    return res.status(400).json({ error: 'Quiz must have at least one question' });
  }
  const validationError = validateQuestions(questions);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Сам квиз — пока черновик, без кода и дедлайна.
    const quizResult = await client.query(
      `INSERT INTO quizzes (title, time_limit, status, passing_score, teacher_email)
       VALUES ($1, $2, 'draft', $3, $4)
       RETURNING id`,
      [title, time_limit, passing_score, req.user.email]
    );
    const quizId = quizResult.rows[0].id;

    await insertQuestions(client, quizId, questions);

    await client.query('COMMIT');
    res.status(201).json({ id: quizId });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ error: err.message });
    }
    console.error('Create quiz failed:', err);
    res.status(500).json({ error: 'Internal error' });
  } finally {
    client.release();
  }
});

// GET /api/teacher/quizzes/:id — полная карточка с вопросами и вариантами (для редактирования).
teacherQuizzesRouter.get('/:id', requireTeacher, async (req, res) => {
  const quizId = Number(req.params.id);
  if (!Number.isFinite(quizId)) {
    return res.status(400).json({ error: 'Invalid quiz id' });
  }

  try {
    const quizResult = await pool.query(
      `SELECT id, title, time_limit, status, share_code, deadline, passing_score
       FROM quizzes
       WHERE id = $1 AND teacher_email = $2`,
      [quizId, req.user.email]
    );
    if (quizResult.rowCount === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const questionsResult = await pool.query(
      `SELECT id, type, text, order_index, points,
              file_name, file_mime, file_size
       FROM questions
       WHERE quiz_id = $1
       ORDER BY order_index`,
      [quizId]
    );

    // Достаём варианты ответов одним запросом — без N+1.
    const questionIds = questionsResult.rows.map((q) => q.id);
    const optionsResult = questionIds.length
      ? await pool.query(
          `SELECT id, text, is_correct, order_index, question_id
           FROM answer_options
           WHERE question_id = ANY($1::int[])
           ORDER BY question_id, order_index`,
          [questionIds]
        )
      : { rows: [] };

    const optionsByQuestion = new Map();
    for (const o of optionsResult.rows) {
      if (!optionsByQuestion.has(o.question_id)) optionsByQuestion.set(o.question_id, []);
      optionsByQuestion.get(o.question_id).push({
        id: o.id,
        text: o.text,
        correct: o.is_correct,
      });
    }

    const questions = questionsResult.rows.map((q) => ({
      id: q.id,
      type: TYPE_FROM_DB[q.type] || q.type,
      text: q.text,
      points: q.points,
      answers: optionsByQuestion.get(q.id) || [],
      // Метаданные файла, если он прикреплён. Сами байты — только через /api/files.
      file: q.file_name ? {
        name: q.file_name,
        mime: q.file_mime,
        size: q.file_size,
        url: `/api/files/question/${q.id}`,
      } : null,
    }));

    res.json({ ...quizResult.rows[0], questions });
  } catch (err) {
    console.error('Get quiz failed:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// PUT /api/teacher/quizzes/:id — обновление черновика (только статуса draft).
// Заменяет вопросы и варианты целиком.
teacherQuizzesRouter.put('/:id', requireTeacher, async (req, res) => {
  const quizId = Number(req.params.id);
  if (!Number.isFinite(quizId)) {
    return res.status(400).json({ error: 'Invalid quiz id' });
  }

  const { title, time_limit, passing_score, questions } = req.body ?? {};
  if (!title || !time_limit || passing_score == null || !Array.isArray(questions)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (questions.length === 0) {
    return res.status(400).json({ error: 'Quiz must have at least one question' });
  }
  const validationError = validateQuestions(questions);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  // Проверяем владение и что квиз ещё черновик.
  const check = await pool.query(
    'SELECT status FROM quizzes WHERE id = $1 AND teacher_email = $2',
    [quizId, req.user.email]
  );
  if (check.rowCount === 0) {
    return res.status(404).json({ error: 'Quiz not found' });
  }
  if (check.rows[0].status !== 'draft') {
    return res.status(400).json({ error: 'Можно редактировать только черновик' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE quizzes SET title = $1, time_limit = $2, passing_score = $3 WHERE id = $4`,
      [title, time_limit, passing_score, quizId]
    );

    // Удаляем старые варианты, потом старые вопросы (порядок важен из-за FK).
    await client.query(
      `DELETE FROM answer_options
       WHERE question_id IN (SELECT id FROM questions WHERE quiz_id = $1)`,
      [quizId]
    );
    await client.query('DELETE FROM questions WHERE quiz_id = $1', [quizId]);

    await insertQuestions(client, quizId, questions);

    await client.query('COMMIT');
    res.json({ id: quizId });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ error: err.message });
    }
    console.error('Update quiz failed:', err);
    res.status(500).json({ error: 'Internal error' });
  } finally {
    client.release();
  }
});

// POST /api/teacher/quizzes/:id/publish — публикация: генерим код, переводим в active.
teacherQuizzesRouter.post('/:id/publish', requireTeacher, async (req, res) => {
  const quizId = Number(req.params.id);
  const { deadline, show_answers } = req.body ?? {};
  // Приводим к boolean: фронт может прислать undefined — тогда считаем false.
  const showAnswers = Boolean(show_answers);

  if (!Number.isFinite(quizId)) {
    return res.status(400).json({ error: 'Invalid quiz id' });
  }

  // Цикл с защитой от коллизии: если случайно сгенерировали уже существующий код —
  // ловим ошибку UNIQUE (23505) и пробуем ещё раз. На 6 цифрах это почти невозможно.
  const MAX_TRIES = 5;
  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    const code = generateShareCode();
    try {
      const result = await pool.query(
        `UPDATE quizzes
         SET status = 'active', share_code = $1, deadline = $2, show_answers = $3
         WHERE id = $4 AND teacher_email = $5
         RETURNING id, share_code, deadline, status, show_answers`,
        [code, deadline || null, showAnswers, quizId, req.user.email]
      );
      if (result.rowCount === 0) {
        // Либо квиза нет, либо он чужой — намеренно не различаем.
        return res.status(404).json({ error: 'Quiz not found' });
      }
      return res.json(result.rows[0]);
    } catch (err) {
      if (err.code === '23505') {
        // Код уже занят — пробуем сгенерить другой.
        continue;
      }
      console.error('Publish quiz failed:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  res.status(500).json({ error: 'Failed to generate unique code' });
});

// POST /api/teacher/quizzes/:id/close — досрочное закрытие активного квиза.
// Меняет статус 'active' → 'closed'. Применимо только к опубликованным.
teacherQuizzesRouter.post('/:id/close', requireTeacher, async (req, res) => {
  const quizId = Number(req.params.id);
  if (!Number.isFinite(quizId)) {
    return res.status(400).json({ error: 'Invalid quiz id' });
  }
  try {
    const result = await pool.query(
      `UPDATE quizzes
       SET status = 'closed'
       WHERE id = $1 AND teacher_email = $2 AND status = 'active'
       RETURNING id, status`,
      [quizId, req.user.email]
    );
    if (result.rowCount === 0) {
      // Либо чужой/несуществующий, либо уже не active — намеренно не различаем.
      return res.status(404).json({ error: 'Quiz not found or not active' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Close quiz failed:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// DELETE /api/teacher/quizzes/:id — удаление квиза и всего связанного.
// Каскад вручную: схема без ON DELETE, поэтому проходим по таблицам в правильном порядке.
teacherQuizzesRouter.delete('/:id', requireTeacher, async (req, res) => {
  const quizId = Number(req.params.id);
  if (!Number.isFinite(quizId)) {
    return res.status(400).json({ error: 'Invalid quiz id' });
  }

  // Сначала проверим владение, чтобы не удалять чужое и отвечать 404 правильно.
  const check = await pool.query(
    'SELECT id FROM quizzes WHERE id = $1 AND teacher_email = $2',
    [quizId, req.user.email]
  );
  if (check.rowCount === 0) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Удаляем глубже — selected_options зависят от student_answers.
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
    await client.query('DELETE FROM quizzes WHERE id = $1', [quizId]);

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete quiz failed:', err);
    res.status(500).json({ error: 'Internal error' });
  } finally {
    client.release();
  }
});

// GET /api/teacher/quizzes — список своих квизов с числом вопросов.
teacherQuizzesRouter.get('/', requireTeacher, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT q.id, q.title, q.time_limit, q.status, q.share_code, q.deadline,
              q.passing_score,
              COUNT(qs.id)::int AS question_count
       FROM quizzes q
       LEFT JOIN questions qs ON qs.quiz_id = q.id
       WHERE q.teacher_email = $1
       GROUP BY q.id
       ORDER BY q.id DESC`,
      [req.user.email]
    );
    res.json({ quizzes: result.rows });
  } catch (err) {
    console.error('List quizzes failed:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});
