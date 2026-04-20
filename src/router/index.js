import { createRouter, createWebHistory } from 'vue-router'
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
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
