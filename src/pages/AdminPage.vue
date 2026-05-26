<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'
import ConfirmModal from '@/components/ConfirmModal.vue'
import {
  loadAdminUsers,
  loadAdminQuizzes,
  loadAdminAttempts,
  deleteAdminQuiz,
  deleteAdminAttempt,
  blockUser,
  unblockUser,
  deleteUser,
} from '@/api/admin.js'

const router = useRouter()
const { user, logout: authLogout } = useAuth()

const users = ref([])
const quizzes = ref([])
const attempts = ref([])
const error = ref('')

// Запрошенное действие, ожидающее подтверждения в модалке.
// Каждый объект описывает: что показывать (title/subtitle/confirmLabel/loadingLabel) и что вызвать при подтверждении.
const pendingAction = ref(null)
const isActionLoading = ref(false)
const actionError = ref('')

const refresh = async () => {
  try {
    const [u, q, a] = await Promise.all([
      loadAdminUsers(),
      loadAdminQuizzes(),
      loadAdminAttempts(),
    ])
    users.value = u
    quizzes.value = q
    attempts.value = a
  } catch (err) {
    error.value = err.message || 'Не удалось загрузить данные'
  }
}

onMounted(refresh)

const askDeleteQuiz = (id) => {
  pendingAction.value = {
    title: 'Удалить квиз',
    subtitle: 'Действительно ли вы хотите удалить квиз?',
    confirmLabel: 'Удалить',
    loadingLabel: 'Удаляем…',
    run: () => deleteAdminQuiz(id),
  }
}

const askDeleteAttempt = (id) => {
  pendingAction.value = {
    title: 'Удалить результат',
    subtitle: 'Действительно ли вы хотите удалить результат прохождения?',
    confirmLabel: 'Удалить',
    loadingLabel: 'Удаляем…',
    run: () => deleteAdminAttempt(id),
  }
}

const askDeleteUser = (u) => {
  const who = u.role === 'teacher' ? 'преподавателя' : 'студента'
  pendingAction.value = {
    title: 'Удалить пользователя',
    subtitle: `Действительно ли вы хотите удалить ${who} вместе со всеми его данными?`,
    confirmLabel: 'Удалить',
    loadingLabel: 'Удаляем…',
    run: () => deleteUser(u.email),
  }
}

const askToggleBlock = (u) => {
  pendingAction.value = u.isBlocked
    ? {
        title: 'Разблокировать пользователя',
        subtitle: 'Действительно ли вы хотите разблокировать этого пользователя?',
        confirmLabel: 'Разблокировать',
        loadingLabel: 'Разблокируем…',
        run: () => unblockUser(u.email),
      }
    : {
        title: 'Заблокировать пользователя',
        subtitle: 'Действительно ли вы хотите заблокировать этого пользователя?',
        confirmLabel: 'Заблокировать',
        loadingLabel: 'Блокируем…',
        run: () => blockUser(u.email),
      }
}

const cancelAction = () => {
  pendingAction.value = null
  actionError.value = ''
}

const confirmAction = async () => {
  if (!pendingAction.value) return
  isActionLoading.value = true
  actionError.value = ''
  try {
    await pendingAction.value.run()
    pendingAction.value = null
    await refresh()
  } catch (err) {
    actionError.value = err.message || 'Не удалось выполнить действие'
  } finally {
    isActionLoading.value = false
  }
}

const logout = () => {
  authLogout()
  router.push('/')
}
</script>

<template>
  <div class="admin container">
    <header class="admin__header">
      <h1 class="admin__title">Администрирование</h1>
      <div class="admin__me">
        <span>{{ user?.name }}</span>
        <button type="button" class="btn btn-sm" @click="logout">Выйти</button>
      </div>
    </header>

    <p v-if="error" class="admin__error">{{ error }}</p>

    <section class="admin__section">
      <h2 class="admin__section-title">Пользователи</h2>
      <div class="admin__table-wrap">
        <table class="admin__table">
          <thead>
            <tr>
              <th>Имя</th>
              <th>Email</th>
              <th>ИСУ</th>
              <th>Роль</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.email" :class="{ 'admin__row--blocked': u.isBlocked }">
              <td>{{ u.name }}</td>
              <td>{{ u.email }}</td>
              <td>{{ u.isu }}</td>
              <td>{{ u.roleLabel }}</td>
              <td>{{ u.isBlocked ? 'Заблокирован' : 'Активен' }}</td>
              <td>
                <div v-if="u.role !== 'admin'" class="admin__row-actions">
                  <button
                    type="button"
                    class="btn btn-sm admin__btn"
                    @click="askToggleBlock(u)"
                  >{{ u.isBlocked ? 'Разблокировать' : 'Заблокировать' }}</button>
                  <button
                    type="button"
                    class="btn btn-sm admin__btn admin__btn--danger"
                    @click="askDeleteUser(u)"
                  >Удалить</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="admin__section">
      <h2 class="admin__section-title">Квизы</h2>
      <div class="admin__table-wrap">
        <table class="admin__table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Автор</th>
              <th>Статус</th>
              <th>Вопросов</th>
              <th>Попыток</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="q in quizzes" :key="q.id">
              <td>{{ q.title }}</td>
              <td>{{ q.teacherName }}</td>
              <td>{{ q.statusLabel }}</td>
              <td>{{ q.questionCount }}</td>
              <td>{{ q.attemptCount }}</td>
              <td>
                <button type="button" class="btn btn-sm admin__btn admin__btn--danger" @click="askDeleteQuiz(q.id)">Удалить</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="admin__section">
      <h2 class="admin__section-title">Результаты прохождений</h2>
      <div class="admin__table-wrap">
        <table class="admin__table">
          <thead>
            <tr>
              <th>Студент</th>
              <th>ИСУ</th>
              <th>Квиз</th>
              <th>Балл</th>
              <th>Время</th>
              <th>Дата</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in attempts" :key="a.id">
              <td>{{ a.studentName }}</td>
              <td>{{ a.studentIsu }}</td>
              <td>{{ a.quizTitle }}</td>
              <td>{{ a.score }}</td>
              <td>{{ a.duration }}</td>
              <td>{{ a.startedAt }}</td>
              <td>
                <button type="button" class="btn btn-sm admin__btn admin__btn--danger" @click="askDeleteAttempt(a.id)">Удалить</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <ConfirmModal
      v-if="pendingAction"
      :title="pendingAction.title"
      :subtitle="pendingAction.subtitle"
      :confirm-label="pendingAction.confirmLabel"
      :loading-label="pendingAction.loadingLabel"
      :is-loading="isActionLoading"
      :error="actionError"
      @close="cancelAction"
      @home="cancelAction"
      @confirm="confirmAction"
    />
  </div>
</template>

<style scoped>
.admin {
  padding-top: 120px;
  padding-bottom: var(--padding-section);
}

.admin__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.admin__title {
  font-size: var(--font-size-h1);
  font-weight: 400;
  color: var(--color-text);
  margin: 0;
}

.admin__me {
  display: flex;
  align-items: center;
  gap: 16px;
  color: var(--color-text);
}

.admin__error {
  color: var(--color-accent2);
  text-align: center;
  margin: 0 0 16px;
}

.admin__section {
  margin-bottom: 40px;
}

.admin__section-title {
  font-size: var(--font-size-h2);
  font-weight: 400;
  color: var(--color-text);
  margin: 0 0 16px;
}

.admin__table-wrap {
  background: var(--color-bg2);
  border: 1px solid var(--color-primary-light);
  border-radius: 12px;
  overflow-x: auto;
}

.admin__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-body);
  color: var(--color-text);
}

.admin__table th,
.admin__table td {
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-primary-light);
  white-space: nowrap;
}

.admin__table th {
  background: var(--color-primary-light);
  font-weight: 500;
}

.admin__table tbody tr:last-child td {
  border-bottom: none;
}

.admin__row--blocked {
  opacity: 0.55;
}

.admin__btn {
  font-family: var(--font-family-btn);
  font-size: var(--font-size-btn);
}

.admin__row-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.admin__btn--danger {
  background: var(--color-accent2);
  color: var(--color-bg2);
}

/* Мобилка */
@media (max-width: 767px) {
  .admin {
    padding-top: calc(75px + var(--padding-page-top-mob));
  }

  .admin__header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
    margin-bottom: 20px;
  }

  .admin__title {
    font-size: var(--font-size-h1-mob);
  }

  .admin__section-title {
    font-size: var(--font-size-h2-mob);
  }

  .admin__table {
    font-size: var(--font-size-body-mob);
  }

  .admin__table th,
  .admin__table td {
    padding: 8px 10px;
  }
}
</style>
