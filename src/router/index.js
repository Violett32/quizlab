import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'
import HomePage from '../pages/HomePage.vue'
import RegisterPage from '../pages/RegisterPage.vue'
import StudentHomePage from '../pages/StudentHomePage.vue'
import StudentResultsPage from '../pages/StudentResultsPage.vue'
import StudentQuizzesPage from '../pages/StudentQuizzesPage.vue'
import TeacherHomePage from '../pages/TeacherHomePage.vue'
import TeacherResultsPage from '../pages/TeacherResultsPage.vue'
import TeacherQuizzesPage from '../pages/TeacherQuizzesPage.vue'
import CreateQuizPage from '../pages/CreateQuizPage.vue'
import TakeQuizPage from '../pages/TakeQuizPage.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterPage,
    meta: { hideChrome: true }
  },
  {
    path: '/student',
    name: 'student',
    component: StudentHomePage,
    meta: { role: 'student' }
  },
  {
    path: '/results',
    name: 'results',
    component: StudentResultsPage,
    meta: { role: 'student' }
  },
  {
    path: '/quizzes',
    name: 'quizzes',
    component: StudentQuizzesPage,
    meta: { role: 'student' }
  },
  {
    path: '/teacher',
    name: 'teacher',
    component: TeacherHomePage,
    meta: { role: 'teacher' }
  },
  {
    path: '/teacher/results',
    name: 'teacher-results',
    component: TeacherResultsPage,
    meta: { role: 'teacher' }
  },
  {
    path: '/teacher/quizzes',
    name: 'teacher-quizzes',
    component: TeacherQuizzesPage,
    meta: { role: 'teacher' }
  },
  {
    path: '/create',
    name: 'create-quiz',
    component: CreateQuizPage,
    meta: { role: 'teacher' }
  },
  {
    path: '/quiz/:id',
    name: 'take-quiz',
    component: TakeQuizPage,
    meta: { role: 'student' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// Глобальный гард: пускает на страницы с meta.role только нужную роль.
router.beforeEach(async (to) => {
  const requiredRole = to.meta?.role
  if (!requiredRole) return true // публичная страница — пропускаем всех

  const { user, loadCurrentUser } = useAuth()

  // На холодной загрузке user ещё не подтянут — даём шанс восстановить сессию.
  if (!user.value) {
    await loadCurrentUser()
  }

  if (!user.value) {
    // Не залогинен — на главную.
    return { path: '/' }
  }

  if (user.value.role !== requiredRole) {
    // Залогинен, но роль не та — отправляем на его собственную домашнюю.
    return { path: user.value.role === 'teacher' ? '/teacher' : '/student' }
  }

  return true
})

export default router
