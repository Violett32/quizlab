import { apiFetch } from './client.js'

// БД хранит status как 'draft'|'active'|'closed', а компонент QuizCard ждёт 'open'|'closed'|'unpublished'.
const STATUS_TO_UI = {
  draft: 'unpublished',
  active: 'open',
  closed: 'closed',
}

// '2026-12-31T20:59:00.000Z' → '31.12.26, 23:59' (в локальной таймзоне браузера)
function formatDeadline(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return ''
  const pad = (n) => String(n).padStart(2, '0')
  const dd = pad(d.getDate())
  const mm = pad(d.getMonth() + 1)
  const yy = String(d.getFullYear()).slice(-2)
  const hh = pad(d.getHours())
  const mi = pad(d.getMinutes())
  return `${dd}.${mm}.${yy}, ${hh}:${mi}`
}

function transformQuiz(q) {
  return {
    id: q.id,
    title: q.title,
    questions: q.question_count,
    duration: `${q.time_limit} минут`,
    openUntil: formatDeadline(q.deadline),
    status: STATUS_TO_UI[q.status] || 'open',
    code: q.share_code || '',
  }
}

export async function loadTeacherQuizzes() {
  const data = await apiFetch('/api/teacher/quizzes')
  return data.quizzes.map(transformQuiz)
}

// Загружает все попытки по квизам учителя и собирает два формата:
// - summaries: для превью на TeacherHomePage (на квиз — средний балл и число студентов)
// - byQuiz:    для TeacherResultsPage (на квиз — список попыток с именем/ИСУ/баллом)
export async function loadTeacherResults() {
  const data = await apiFetch('/api/teacher/results')
  const attempts = data.attempts || []

  // Группируем по quiz_id, сохраняя порядок первого вхождения
  // (бэк уже отсортировал: новые квизы сверху, попытки внутри — по started_at DESC).
  const groups = new Map()
  for (const a of attempts) {
    if (!groups.has(a.quiz_id)) {
      groups.set(a.quiz_id, { quizId: a.quiz_id, title: a.quiz_title, attempts: [] })
    }
    groups.get(a.quiz_id).attempts.push(a)
  }

  const summaries = []
  const byQuiz = []
  for (const g of groups.values()) {
    const sumScores = g.attempts.reduce((acc, a) => acc + (a.score ?? 0), 0)
    const avg = Math.round(sumScores / g.attempts.length)
    // Уникальные студенты — считаем по email.
    const uniqueStudents = new Set(g.attempts.map((a) => a.student_email)).size

    summaries.push({
      quizId: g.quizId,
      title: g.title,
      avgScore: `${avg}/100`,
      people: uniqueStudents,
    })

    byQuiz.push({
      quizId: g.quizId,
      quiz: g.title,
      students: g.attempts.map((a) => ({
        attemptId: a.id,
        name: a.student_name,
        isu: a.student_isu,
        score: `${a.score ?? 0}/100`,
      })),
    })
  }

  return { summaries, byQuiz }
}
