<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ResultItem from '@/components/ResultItem.vue'
import QuizCard from '@/components/QuizCard.vue'
import PublishModal from '@/components/PublishModal.vue'
import QuestionTypeModal from '@/components/QuestionTypeModal.vue'
import DeleteQuizModal from '@/components/DeleteQuizModal.vue'
import CloseQuizModal from '@/components/CloseQuizModal.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useAuth } from '@/composables/useAuth.js'
import { loadTeacherQuizzes, loadTeacherResults } from '@/api/teacher.js'
import { apiFetch } from '@/api/client.js'

const router = useRouter()
const showCreateQuestion = ref(false)

// Состояние публикации: какой квиз публикуем + пропы для модалки.
const publishingId = ref(null)
const publishShareCode = ref(null)
const isPublishLoading = ref(false)
const publishError = ref('')

const startPublish = (id) => {
  publishingId.value = id
  publishShareCode.value = null
  publishError.value = ''
}

// Состояние удаления.
const deletingId = ref(null)
const isDeleteLoading = ref(false)
const deleteError = ref('')

const startDelete = (id) => {
  deletingId.value = id
  deleteError.value = ''
}

const cancelDelete = () => {
  deletingId.value = null
  deleteError.value = ''
}

const confirmDelete = async () => {
  if (!deletingId.value) return
  isDeleteLoading.value = true
  deleteError.value = ''
  try {
    await apiFetch(`/api/teacher/quizzes/${deletingId.value}`, { method: 'DELETE' })
    deletingId.value = null
    quizzes.value = await loadTeacherQuizzes()
  } catch (err) {
    deleteError.value = err.message || 'Не удалось удалить квиз'
  } finally {
    isDeleteLoading.value = false
  }
}

// Состояние закрытия (досрочное закрытие активного квиза).
const closingId = ref(null)
const isCloseLoading = ref(false)
const closeError = ref('')

const startClose = (id) => {
  closingId.value = id
  closeError.value = ''
}

const cancelClose = () => {
  closingId.value = null
  closeError.value = ''
}

const confirmClose = async () => {
  if (!closingId.value) return
  isCloseLoading.value = true
  closeError.value = ''
  try {
    await apiFetch(`/api/teacher/quizzes/${closingId.value}/close`, { method: 'POST' })
    closingId.value = null
    quizzes.value = await loadTeacherQuizzes()
  } catch (err) {
    closeError.value = err.message || 'Не удалось закрыть квиз'
  } finally {
    isCloseLoading.value = false
  }
}

const onPublish = async ({ deadline }) => {
  publishError.value = ''
  isPublishLoading.value = true
  try {
    const data = await apiFetch(
      `/api/teacher/quizzes/${publishingId.value}/publish`,
      { method: 'POST', body: { deadline: deadline || null } }
    )
    publishShareCode.value = data.share_code
    // Обновляем список — на карточке появится свеже-выданный код.
    quizzes.value = await loadTeacherQuizzes()
  } catch (err) {
    publishError.value = err.message || 'Не удалось опубликовать квиз'
  } finally {
    isPublishLoading.value = false
  }
}

const { user, logout: authLogout, uploadAvatar } = useAuth()

const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2 МБ
const avatarInputRef = ref(null)
const avatarError = ref('')

const openAvatarPicker = () => {
  avatarError.value = ''
  avatarInputRef.value?.click()
}

const onAvatarSelected = async (e) => {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    avatarError.value = 'Файл должен быть изображением'
    return
  }
  if (file.size > MAX_AVATAR_BYTES) {
    avatarError.value = 'Аватар больше 2 МБ'
    return
  }
  try {
    await uploadAvatar(file)
  } catch (err) {
    avatarError.value = err.message || 'Не удалось загрузить'
  }
}

// Превью — берём первые несколько. Полные списки на /teacher/results и /teacher/quizzes.
const RESULTS_PREVIEW = 6

const results = ref([])
const quizzes = ref([])

onMounted(async () => {
  try {
    const [quizList, resultsData] = await Promise.all([
      loadTeacherQuizzes(),
      loadTeacherResults(),
    ])
    quizzes.value = quizList
    results.value = resultsData.summaries.slice(0, RESULTS_PREVIEW)
  } catch (err) {
    console.error('Failed to load teacher home data:', err)
  }
})

const logout = () => {
  authLogout()
  router.push('/')
}

const onQuestionTypeSelect = (type) => {
  showCreateQuestion.value = false
  router.push({ path: '/create', query: { type } })
}
</script>

<template>
  <div class="teacher">
    <section class="create-bar">
      <div class="create-bar__inner">
        <button type="button" class="btn btn-lg create-bar__btn" @click="showCreateQuestion = true">Создать квиз</button>
      </div>
    </section>

    <section class="profile-hero">
      <img src="@/assets/images/hero-bg.png" alt="" class="profile-hero__bg">
      <div class="profile-hero__content">
        <div class="profile__photo" @click="openAvatarPicker" role="button" tabindex="0">
          <img v-if="user.avatar" :src="user.avatar" alt="" class="profile__photo-img">
          <img v-else src="@/assets/icons/add.svg" alt="" class="profile__photo-add">
          <input
            ref="avatarInputRef"
            type="file"
            accept="image/*"
            class="profile__photo-input"
            @change="onAvatarSelected"
          />
        </div>
        <p v-if="avatarError" class="profile__avatar-error">{{ avatarError }}</p>
        <h2 class="profile__name">{{ user.name }}</h2>
        <p class="profile__email">{{ user.email }}</p>
        <div class="profile__role-id">
          <span>Преподаватель</span>
          <span>{{ user.isu }}</span>
        </div>
        <button type="button" class="btn btn-lg profile__logout" @click="logout">Выйти</button>
      </div>
    </section>

    <section class="columns container">
      <div class="column">
        <h3 class="column__title">Результаты</h3>
        <p class="column__desc">Отслеживайте успеваемость студентов в одном месте: средний балл<br>и количество прошедших по каждому квизу.</p>
        <template v-if="results.length">
          <div class="column__list">
            <ResultItem
              v-for="r in results"
              :key="r.quizId"
              :title="r.title"
              :score="r.avgScore"
              :passing-score="r.passingScore"
              :people="r.people"
              class="column__result-link"
              @click="router.push('/teacher/results')"
            />
          </div>
          <button type="button" class="btn btn-lg column__more" @click="router.push('/teacher/results')">Посмотреть все</button>
        </template>
        <EmptyState v-else text="У вас пока нет результатов" />
      </div>

      <div class="column">
        <h3 class="column__title">Квизы</h3>
        <p class="column__desc">Управляйте своими квизами: редактирование, настройка доступа<br>и отслеживание статуса.</p>
        <template v-if="quizzes.length">
          <div class="column__grid">
            <QuizCard
              v-for="q in quizzes"
              :key="q.id"
              :title="q.title"
              :questions="q.questions"
              :duration="q.duration"
              :open-until="q.openUntil"
              :status="q.status"
              :mode="'teacher'"
              :code="q.code"
              class="column__quiz-link"
              @click="router.push('/teacher/quizzes')"
              @publish="startPublish(q.id)"
              @edit="router.push(`/create?edit=${q.id}`)"
              @delete="startDelete(q.id)"
              @close="startClose(q.id)"
            />
          </div>
          <button type="button" class="btn btn-lg column__more" @click="router.push('/teacher/quizzes')">Посмотреть все</button>
        </template>
        <EmptyState v-else text="У вас пока нет квизов" />
      </div>
    </section>

    <PublishModal
      v-if="publishingId"
      :share-code="publishShareCode"
      :is-loading="isPublishLoading"
      :error="publishError"
      @close="publishingId = null"
      @publish="onPublish"
    />
    <QuestionTypeModal v-if="showCreateQuestion" @close="showCreateQuestion = false" @select="onQuestionTypeSelect" />

    <DeleteQuizModal
      v-if="deletingId"
      :is-loading="isDeleteLoading"
      :error="deleteError"
      @close="cancelDelete"
      @home="cancelDelete"
      @confirm="confirmDelete"
    />

    <CloseQuizModal
      v-if="closingId"
      :is-loading="isCloseLoading"
      :error="closeError"
      @close="cancelClose"
      @home="cancelClose"
      @confirm="confirmClose"
    />
  </div>
</template>

<style scoped>
.teacher {
  padding-top: 0;
}

/* Оранжевая полоса с кнопкой создания */
.create-bar {
  height: 170px;
  background: var(--color-accent);
  display: flex;
  align-items: flex-end;
}

.create-bar__inner {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 1237px;
  margin: 0 auto;
  padding: 0 24px 20px;
  width: 100%;
}

/* Секция профиля с hero-bg */
.profile-hero {
  position: relative;
  width: 1237px;
  margin: 40px auto 60px;
  border-radius: 20px;
  overflow: hidden;
}

.profile-hero__bg {
  width: 100%;
  height: 580px;
  object-fit: cover;
  display: block;
}

.profile-hero__content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
}

.profile__photo {
  width: 320px;
  height: 320px;
  border-radius: 20px;
  background: var(--color-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  cursor: pointer;
  overflow: hidden;
  transition: opacity 0.2s ease;
}

.profile__photo:hover {
  opacity: 0.85;
}

.profile__photo-input {
  display: none;
}

.profile__avatar-error {
  margin: 0 0 8px;
  font-size: var(--font-size-body);
  color: var(--color-accent2);
}

.profile__photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 20px;
}

.profile__photo-add {
  width: 210px;
  height: 210px;
  color: var(--color-primary-dark);
}

.profile__name {
  font-size: var(--font-size-h1);
  font-weight: 400;
  color: var(--color-bg2);
  margin: 0;
}

.profile__email {
  font-size: var(--font-size-body);
  color: var(--color-bg2);
  margin: 0;
}

.profile__role-id {
  display: flex;
  gap: 12px;
  font-size: var(--font-size-body);
  color: var(--color-bg2);
}

.profile__logout {
  margin-top: 12px;
}

/* Две колонки */
.columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  padding-bottom: var(--padding-section);
}

.column {
  display: flex;
  flex-direction: column;
}

.column__title {
  font-size: var(--font-size-h2);
  font-weight: 400;
  color: var(--color-text);
  text-align: center;
  margin: 0 0 12px;
}

.column__desc {
  font-size: var(--font-size-body);
  color: var(--color-text-light);
  text-align: center;
  margin: 0 0 20px;
}

.column__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.column__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.column__more {
  align-self: center;
}

.column__result-link,
.column__quiz-link {
  cursor: pointer;
}

@media (max-width: 900px) {
  .columns {
    grid-template-columns: 1fr;
  }
  .column__grid {
    grid-template-columns: 1fr;
  }
}

/* Мобилка */
@media (max-width: 767px) {
  .create-bar {
    height: auto;
    padding: calc(75px + var(--padding-page-top-mob)) 20px 20px;
    align-items: stretch;
  }

  .create-bar__inner {
    padding: 0;
    max-width: none;
  }

  .profile-hero {
    width: auto;
    margin: 20px 20px 32px;
  }

  .profile-hero__content {
    padding: 24px 20px;
    gap: 4px;
    position: relative;
    inset: auto;
    z-index: 1;
  }

  .profile-hero__bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
  }

  .profile__photo {
    width: 220px;
    height: 220px;
  }

  .profile__photo-add {
    width: 120px;
    height: 120px;
  }

  .profile__name {
    font-size: var(--font-size-h2-mob);
  }

  .profile__email,
  .profile__role-id {
    font-size: var(--font-size-body-mob);
  }

  .profile__logout {
    margin-top: 16px;
  }

  .columns {
    padding: 0 20px var(--padding-section-mob);
    gap: 32px;
  }

  .column__title {
    font-size: var(--font-size-h1-mob);
  }

  .column__desc {
    font-size: var(--font-size-body-mob);
  }

  .column__desc br {
    display: none;
  }

  .column__list,
  .column__grid {
    gap: 8px;
  }
}
</style>
