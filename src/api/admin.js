import { apiFetch } from './client.js'

// Маппинг статусов БД на UI.
const STATUS_LABEL = {
  draft: 'Черновик',
  active: 'Активный',
  closed: 'Закрытый',
}

const ROLE_LABEL = {
  admin: 'Администратор',
  teacher: 'Преподаватель',
  student: 'Студент',
}

function formatDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(d.getFullYear()).slice(-2)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDuration(startIso, finishIso) {
  if (!startIso || !finishIso) return ''
  const sec = Math.max(0, Math.floor((new Date(finishIso) - new Date(startIso)) / 1000))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export async function loadAdminUsers() {
  const data = await apiFetch('/api/admin/users')
  return (data.users || []).map((u) => ({
    email: u.email,
    name: u.name,
    isu: u.isu,
    role: u.role,
    roleLabel: ROLE_LABEL[u.role] || u.role,
    isBlocked: u.is_blocked,
  }))
}

export async function loadAdminQuizzes() {
  const data = await apiFetch('/api/admin/quizzes')
  return (data.quizzes || []).map((q) => ({
    id: q.id,
    title: q.title,
    statusLabel: STATUS_LABEL[q.status] || q.status,
    teacherName: q.teacher_name,
    teacherEmail: q.teacher_email,
    questionCount: q.question_count,
    attemptCount: q.attempt_count,
  }))
}

export async function loadAdminAttempts() {
  const data = await apiFetch('/api/admin/attempts')
  return (data.attempts || []).map((a) => ({
    id: a.id,
    quizTitle: a.quiz_title,
    studentName: a.student_name,
    studentIsu: a.student_isu,
    score: `${a.score ?? 0}/100`,
    duration: formatDuration(a.started_at, a.finished_at),
    startedAt: formatDateTime(a.started_at),
  }))
}

export function deleteAdminQuiz(id) {
  return apiFetch(`/api/admin/quizzes/${id}`, { method: 'DELETE' })
}

export function deleteAdminAttempt(id) {
  return apiFetch(`/api/admin/attempts/${id}`, { method: 'DELETE' })
}

export function blockUser(email) {
  return apiFetch(`/api/admin/users/${encodeURIComponent(email)}/block`, { method: 'POST' })
}

export function unblockUser(email) {
  return apiFetch(`/api/admin/users/${encodeURIComponent(email)}/unblock`, { method: 'POST' })
}

export function deleteUser(email) {
  return apiFetch(`/api/admin/users/${encodeURIComponent(email)}`, { method: 'DELETE' })
}
