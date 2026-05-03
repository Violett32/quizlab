<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ResultItem from '@/components/ResultItem.vue'
import QuizCard from '@/components/QuizCard.vue'
import PublishModal from '@/components/PublishModal.vue'
import QuestionTypeModal from '@/components/QuestionTypeModal.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useAuth } from '@/composables/useAuth.js'
import { loadTeacherQuizzes } from '@/api/teacher.js'
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

const { user, logout: authLogout } = useAuth()

const results = ref([
  { title: 'Знание языка Java', score: '78/100', people: 24 },
  { title: 'Алгоритмы и структуры данных', score: '77/100', people: 18 },
  { title: 'Информационная безопасность', score: '10/100', people: 31 },
  { title: 'Операционные системы', score: '80/100', people: 12 },
  { title: 'Дискретная математика', score: '18/100', people: 9 },
  { title: 'Основы веб-разработки', score: '20/100', people: 15 }
])

const quizzes = ref([])

onMounted(async () => {
  try {
    quizzes.value = await loadTeacherQuizzes()
  } catch (err) {
    console.error('Failed to load quizzes:', err)
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
        <div class="profile__photo">
          <img v-if="user.avatar" :src="user.avatar" alt="" class="profile__photo-img">
          <img v-else src="@/assets/icons/add.svg" alt="" class="profile__photo-add">
        </div>
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
        <h3 class="column__title">Результаты студентов</h3>
        <p class="column__desc">Отслеживайте успеваемость студентов в одном месте: средний балл<br>и количество прошедших по каждому квизу.</p>
        <template v-if="results.length">
          <div class="column__list">
            <ResultItem
              v-for="(r, i) in results"
              :key="i"
              :title="r.title"
              :score="r.score"
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
        <h3 class="column__title">Созданные квизы</h3>
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
