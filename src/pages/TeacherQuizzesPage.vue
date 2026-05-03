<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import QuizCard from '@/components/QuizCard.vue'
import PublishModal from '@/components/PublishModal.vue'
import DeleteQuizModal from '@/components/DeleteQuizModal.vue'
import CloseQuizModal from '@/components/CloseQuizModal.vue'
import EmptyState from '@/components/EmptyState.vue'
import { loadTeacherQuizzes } from '@/api/teacher.js'
import { apiFetch } from '@/api/client.js'

const router = useRouter()

const quizzes = ref([])

onMounted(async () => {
  try {
    quizzes.value = await loadTeacherQuizzes()
  } catch (err) {
    console.error('Failed to load quizzes:', err)
  }
})

// Состояние публикации: id публикуемого квиза + пропы для модалки.
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
    quizzes.value = await loadTeacherQuizzes()
  } catch (err) {
    publishError.value = err.message || 'Не удалось опубликовать квиз'
  } finally {
    isPublishLoading.value = false
  }
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

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="quizzes-page container">
    <div class="quizzes-page__header">
      <button type="button" class="quizzes-page__back" @click="goBack" aria-label="Назад">
        <img src="@/assets/icons/arrow.svg" alt="" class="quizzes-page__back-icon">
      </button>
      <h1 class="quizzes-page__title">Квизы</h1>
    </div>

    <div v-if="quizzes.length" class="quizzes-page__grid">
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
        @publish="startPublish(q.id)"
        @edit="router.push(`/create?edit=${q.id}`)"
        @delete="startDelete(q.id)"
        @close="startClose(q.id)"
      />
    </div>
    <EmptyState v-else text="У вас пока нет квизов" />

    <PublishModal
      v-if="publishingId"
      :share-code="publishShareCode"
      :is-loading="isPublishLoading"
      :error="publishError"
      @close="publishingId = null"
      @publish="onPublish"
    />

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
.quizzes-page {
  padding-top: 140px;
}

.quizzes-page__header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 28px;
}

.quizzes-page__back {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s ease;
  transform: rotate(180deg);
}

.quizzes-page__back:hover {
  opacity: 0.6;
}

.quizzes-page__back-icon {
  width: 48px;
  height: 48px;
}

.quizzes-page__title {
  font-size: var(--font-size-h1);
  font-weight: 400;
  color: var(--color-text);
  margin: 0;
}

.quizzes-page__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

/* Мобилка */
@media (max-width: 767px) {
  .quizzes-page {
    padding-top: calc(75px + var(--padding-page-top-mob));
  }

  .quizzes-page__header {
    gap: 4px;
    margin-bottom: 20px;
  }

  .quizzes-page__back-icon {
    width: 32px;
    height: 32px;
  }

  .quizzes-page__title {
    font-size: var(--font-size-h1-mob);
  }

  .quizzes-page__grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
