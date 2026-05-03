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
