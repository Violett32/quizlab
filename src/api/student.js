import { apiFetch } from './client.js'

// БД хранит status как 'draft'|'active'|'closed', а компонент QuizCard ждёт 'open'|'closed'|'unpublished'.
const STATUS_TO_UI = {
  draft: 'unpublished',
  active: 'open',
  closed: 'closed',
}

// '2026-12-31T20:59:00.000Z' → '31.12.26' (в локальной таймзоне)
function formatDeadlineDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(d.getFullYear()).slice(-2)}`
}

// Длительность попытки в "MM:SS" из двух ISO-строк.
function formatAttemptDuration(startedIso, finishedIso) {
  if (!startedIso || !finishedIso) return ''
  const totalSec = Math.max(0, Math.floor((new Date(finishedIso) - new Date(startedIso)) / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Считаем квиз "закрытым" для повторного прохождения, если статус closed либо дедлайн прошёл.
function isQuizClosed(attempt, now = Date.now()) {
  if (attempt.quiz_status === 'closed') return true
  if (attempt.quiz_deadline && new Date(attempt.quiz_deadline).getTime() < now) return true
  return false
}

export async function loadStudentAttempts() {
  const data = await apiFetch('/api/student/attempts')
  const attempts = data.attempts || []
  const now = Date.now()

  // Формат для ResultItem: каждая попытка — отдельная строка.
  const results = attempts.map((a) => {
    const closed = isQuizClosed(a, now)
    return {
      id: a.id,
      quizId: a.quiz_id,
      title: a.quiz_title,
      duration: formatAttemptDuration(a.started_at, a.finished_at),
      score: `${a.score ?? 0}/100`,
      actionLabel: closed ? 'Тест закрыт' : 'Пройти заново',
      actionDisabled: closed,
    }
  })

  // Формат для QuizCard: уникальные квизы по quiz_id, берём первое вхождение
  // (попытки уже отсортированы по started_at DESC — значит самая свежая).
  const seen = new Set()
  const quizzes = []
  for (const a of attempts) {
    if (seen.has(a.quiz_id)) continue
    seen.add(a.quiz_id)
    quizzes.push({
      id: a.quiz_id,
      title: a.quiz_title,
      questions: a.quiz_question_count,
      duration: `${a.quiz_time_limit} минут`,
      openUntil: formatDeadlineDate(a.quiz_deadline),
      status: STATUS_TO_UI[a.quiz_status] || 'open',
    })
  }

  return { results, quizzes }
}
