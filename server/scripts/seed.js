// Демо-данные для показа на дипломе.
// Запуск: node --env-file=../.env scripts/seed.js
import bcrypt from 'bcrypt';
import { pool } from '../src/db.js';

const TEACHER_EMAIL = 'violettaboreeva1@gmail.com';
const TEACHER_PASSWORD = 'Z.x,alsk10';
const TEACHER_NAME = 'Бореева В Ю';
const TEACHER_ISU = '281234';

const STUDENT_PASSWORD = 'Student1!';
const students = [
  { email: 'ivanov@itmo.ru',   name: 'Иванов Иван',     isu: '370001' },
  { email: 'petrova@itmo.ru',  name: 'Петрова Анна',    isu: '370002' },
  { email: 'kozlov@itmo.ru',   name: 'Козлов Максим',   isu: '370003' },
  { email: 'smirnova@itmo.ru', name: 'Смирнова Елена',  isu: '370004' },
  { email: 'volkov@itmo.ru',   name: 'Волков Артём',    isu: '370005' },
];

const quizzes = [
  {
    title: 'Основы JavaScript',
    time_limit: 20,
    passing_score: 60,
    show_answers: true,
    questions: [
      { type: 'single', text: 'Какой оператор объявляет переменную с блочной областью видимости?', options: [
        { text: 'var', correct: false },
        { text: 'let', correct: true },
        { text: 'function', correct: false },
        { text: 'def', correct: false },
      ]},
      { type: 'single', text: 'Какой тип данных у null?', options: [
        { text: 'null', correct: false },
        { text: 'undefined', correct: false },
        { text: 'object', correct: true },
        { text: 'string', correct: false },
      ]},
      { type: 'multi', text: 'Какие значения являются "falsy"?', options: [
        { text: '0', correct: true },
        { text: '"0"', correct: false },
        { text: 'null', correct: true },
        { text: '"false"', correct: false },
        { text: 'undefined', correct: true },
      ]},
      { type: 'multi', text: 'Какие методы возвращают новый массив?', options: [
        { text: 'map', correct: true },
        { text: 'filter', correct: true },
        { text: 'forEach', correct: false },
        { text: 'push', correct: false },
        { text: 'slice', correct: true },
      ]},
      { type: 'text', text: 'Метод массива, возвращающий индекс первого совпадающего элемента (одно слово)', options: [
        { text: 'indexOf', correct: true },
      ]},
      { type: 'text', text: 'Ключевое слово для создания экземпляра класса', options: [
        { text: 'new', correct: true },
      ]},
    ],
  },
  {
    title: 'Реляционные базы данных',
    time_limit: 25,
    passing_score: 70,
    show_answers: true,
    questions: [
      { type: 'single', text: 'Команда для удаления таблицы:', options: [
        { text: 'DELETE TABLE', correct: false },
        { text: 'DROP TABLE', correct: true },
        { text: 'REMOVE TABLE', correct: false },
        { text: 'TRUNCATE TABLE', correct: false },
      ]},
      { type: 'single', text: 'Что обеспечивает PRIMARY KEY?', options: [
        { text: 'Уникальность и NOT NULL', correct: true },
        { text: 'Только уникальность', correct: false },
        { text: 'Только индекс', correct: false },
        { text: 'Связь с другой таблицей', correct: false },
      ]},
      { type: 'multi', text: 'Какие команды относятся к DML?', options: [
        { text: 'SELECT', correct: true },
        { text: 'INSERT', correct: true },
        { text: 'CREATE', correct: false },
        { text: 'UPDATE', correct: true },
        { text: 'ALTER', correct: false },
      ]},
      { type: 'multi', text: 'Какие виды JOIN существуют в SQL?', options: [
        { text: 'INNER JOIN', correct: true },
        { text: 'LEFT JOIN', correct: true },
        { text: 'OUTER JOIN', correct: true },
        { text: 'EXTRA JOIN', correct: false },
      ]},
      { type: 'text', text: 'Свойство транзакций, гарантирующее "всё или ничего"', options: [
        { text: 'Атомарность', correct: true },
        { text: 'Atomicity', correct: true },
      ]},
      { type: 'text', text: 'Оператор группировки строк по значению столбца', options: [
        { text: 'GROUP BY', correct: true },
      ]},
    ],
  },
  {
    title: 'Алгоритмы и структуры данных',
    time_limit: 30,
    passing_score: 50,
    show_answers: false,
    questions: [
      { type: 'single', text: 'Асимптотика бинарного поиска в отсортированном массиве?', options: [
        { text: 'O(1)', correct: false },
        { text: 'O(log n)', correct: true },
        { text: 'O(n)', correct: false },
        { text: 'O(n log n)', correct: false },
      ]},
      { type: 'single', text: 'Какая структура работает по принципу LIFO?', options: [
        { text: 'Очередь', correct: false },
        { text: 'Стек', correct: true },
        { text: 'Связанный список', correct: false },
        { text: 'Хеш-таблица', correct: false },
      ]},
      { type: 'multi', text: 'Алгоритмы со средней сложностью O(n log n):', options: [
        { text: 'Быстрая сортировка', correct: true },
        { text: 'Пузырьковая сортировка', correct: false },
        { text: 'Сортировка слиянием', correct: true },
        { text: 'Сортировка вставками', correct: false },
        { text: 'Пирамидальная сортировка', correct: true },
      ]},
      { type: 'multi', text: 'Операции хеш-таблицы со средней сложностью O(1):', options: [
        { text: 'Вставка', correct: true },
        { text: 'Поиск', correct: true },
        { text: 'Удаление', correct: true },
        { text: 'Обход всех элементов', correct: false },
      ]},
      { type: 'text', text: 'Структура — иерархия узлов с одним корнем', options: [
        { text: 'Дерево', correct: true },
        { text: 'tree', correct: true },
      ]},
      { type: 'text', text: 'Алгоритм кратчайшего пути в графе без отрицательных весов', options: [
        { text: 'Дейкстры', correct: true },
        { text: 'Dijkstra', correct: true },
      ]},
    ],
  },
];

async function clean(client) {
  const allEmails = [TEACHER_EMAIL, ...students.map((s) => s.email)];
  // Удаляем выбранные варианты, ответы и попытки — и тех, кого "обслуживал" учитель, и наших студентов.
  await client.query(
    `DELETE FROM selected_options WHERE student_answer_id IN (
       SELECT sa.id FROM student_answers sa
       JOIN attempts a ON a.id = sa.attempt_id
       WHERE a.student_email = ANY($1)
          OR a.quiz_id IN (SELECT id FROM quizzes WHERE teacher_email = $2)
     )`,
    [allEmails, TEACHER_EMAIL]
  );
  await client.query(
    `DELETE FROM student_answers WHERE attempt_id IN (
       SELECT id FROM attempts
       WHERE student_email = ANY($1)
          OR quiz_id IN (SELECT id FROM quizzes WHERE teacher_email = $2)
     )`,
    [allEmails, TEACHER_EMAIL]
  );
  await client.query(
    `DELETE FROM attempts
     WHERE student_email = ANY($1)
        OR quiz_id IN (SELECT id FROM quizzes WHERE teacher_email = $2)`,
    [allEmails, TEACHER_EMAIL]
  );
  await client.query(
    `DELETE FROM answer_options WHERE question_id IN (
       SELECT id FROM questions
       WHERE quiz_id IN (SELECT id FROM quizzes WHERE teacher_email = $1)
     )`,
    [TEACHER_EMAIL]
  );
  await client.query(
    `DELETE FROM questions WHERE quiz_id IN (SELECT id FROM quizzes WHERE teacher_email = $1)`,
    [TEACHER_EMAIL]
  );
  await client.query('DELETE FROM quizzes WHERE teacher_email = $1', [TEACHER_EMAIL]);
  await client.query('DELETE FROM users WHERE email = ANY($1)', [allEmails]);
}

function randomShareCode() {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('[1/4] Чистим старые данные…');
    await clean(client);

    console.log('[2/4] Создаём учителя и студентов…');
    const teacherHash = await bcrypt.hash(TEACHER_PASSWORD, 10);
    await client.query(
      `INSERT INTO users (email, password, isu, name, role) VALUES ($1, $2, $3, $4, 'teacher')`,
      [TEACHER_EMAIL, teacherHash, TEACHER_ISU, TEACHER_NAME]
    );
    const studentHash = await bcrypt.hash(STUDENT_PASSWORD, 10);
    for (const s of students) {
      await client.query(
        `INSERT INTO users (email, password, isu, name, role) VALUES ($1, $2, $3, $4, 'student')`,
        [s.email, studentHash, s.isu, s.name]
      );
    }

    console.log('[3/4] Создаём квизы и вопросы…');
    const createdQuizzes = [];
    for (const q of quizzes) {
      const deadline = new Date(Date.now() + 30 * 24 * 3600 * 1000);
      const r = await client.query(
        `INSERT INTO quizzes (title, time_limit, status, share_code, deadline, teacher_email, passing_score, show_answers)
         VALUES ($1, $2, 'active', $3, $4, $5, $6, $7) RETURNING id`,
        [q.title, q.time_limit, randomShareCode(), deadline, TEACHER_EMAIL, q.passing_score, q.show_answers]
      );
      const quizId = r.rows[0].id;
      const questionsInfo = [];
      for (let i = 0; i < q.questions.length; i++) {
        const qq = q.questions[i];
        const qr = await client.query(
          `INSERT INTO questions (type, text, order_index, points, quiz_id)
           VALUES ($1, $2, $3, 1, $4) RETURNING id`,
          [qq.type, qq.text, i, quizId]
        );
        const qid = qr.rows[0].id;
        const optionIds = [];
        for (let j = 0; j < qq.options.length; j++) {
          const o = qq.options[j];
          const or = await client.query(
            `INSERT INTO answer_options (text, is_correct, order_index, question_id)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [o.text, o.correct, j, qid]
          );
          optionIds.push({ id: or.rows[0].id, correct: o.correct, text: o.text });
        }
        questionsInfo.push({ id: qid, type: qq.type, options: optionIds });
      }
      createdQuizzes.push({ id: quizId, questions: questionsInfo });
    }

    console.log('[4/4] Создаём попытки прохождения…');
    for (const s of students) {
      for (const quiz of createdQuizzes) {
        // Случайный балл от 30 до 100% — для разнообразия.
        const targetRatio = 0.3 + Math.random() * 0.7;
        const total = quiz.questions.length;
        const correctCount = Math.round(total * targetRatio);
        const score = Math.round((correctCount / total) * 100);

        const minutesAgo = Math.random() * 60 * 24 * 7; // в последнюю неделю
        const durationMin = 5 + Math.random() * 20;
        const startedAt = new Date(Date.now() - minutesAgo * 60_000);
        const finishedAt = new Date(startedAt.getTime() + durationMin * 60_000);

        const ar = await client.query(
          `INSERT INTO attempts (started_at, finished_at, score, is_completed, quiz_id, student_email)
           VALUES ($1, $2, $3, true, $4, $5) RETURNING id`,
          [startedAt, finishedAt, score, quiz.id, s.email]
        );
        const attemptId = ar.rows[0].id;

        // Перемешиваем вопросы и первые `correctCount` отмечаем как правильные.
        const order = [...quiz.questions].sort(() => Math.random() - 0.5);
        for (let i = 0; i < order.length; i++) {
          const qq = order[i];
          const isCorrect = i < correctCount;
          let textAnswer = null;
          let selected = [];

          if (qq.type === 'text') {
            const correctTexts = qq.options.filter((o) => o.correct).map((o) => o.text);
            textAnswer = isCorrect ? correctTexts[0] : 'неверный ответ';
          } else if (isCorrect) {
            selected = qq.options.filter((o) => o.correct).map((o) => o.id);
          } else {
            const wrong = qq.options.filter((o) => !o.correct);
            if (wrong.length) selected = [wrong[0].id];
          }

          const sar = await client.query(
            `INSERT INTO student_answers (text_answer, is_correct, attempt_id, question_id)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [textAnswer, isCorrect, attemptId, qq.id]
          );
          const studentAnswerId = sar.rows[0].id;
          for (const optId of selected) {
            await client.query(
              `INSERT INTO selected_options (student_answer_id, option_id) VALUES ($1, $2)
               ON CONFLICT DO NOTHING`,
              [studentAnswerId, optId]
            );
          }
        }
      }
    }

    await client.query('COMMIT');
    console.log('\nГотово! Создано:');
    console.log(`  учитель: ${TEACHER_EMAIL} / ${TEACHER_PASSWORD}`);
    console.log(`  студенты (${students.length}): пароль для всех "${STUDENT_PASSWORD}"`);
    students.forEach((s) => console.log(`    - ${s.email} (${s.name})`));
    console.log(`  квизы: ${createdQuizzes.length}`);
    console.log(`  попыток: ${students.length * createdQuizzes.length}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();




