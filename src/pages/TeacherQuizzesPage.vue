<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import QuizCard from '@/components/QuizCard.vue'
import PublishModal from '@/components/PublishModal.vue'

const router = useRouter()
const showPublish = ref(false)

const quizzes = ref([
  { id: 1, title: 'Знание языка Java', questions: 100, duration: '30 минут', openUntil: '10.08.26', status: 'open', code: '372937' },
  { id: 2, title: 'Алгоритмы и структуры данных', questions: 40, duration: '40 минут', openUntil: '22.12.26', status: 'open', code: '372937' },
  { id: 3, title: 'Знание языка Java', questions: 100, duration: '30 минут', openUntil: '10.08.26', status: 'open', code: '372937' },
  { id: 4, title: 'Алгоритмы и структуры данных', questions: 40, duration: '40 минут', openUntil: '22.12.26', status: 'open', code: '372937' },
  { id: 5, title: 'Операционные системы', questions: 20, duration: '20 минут', openUntil: '', status: 'closed', code: '' },
  { id: 6, title: 'Дискретная математика', questions: 30, duration: '30 минут', openUntil: '', status: 'unpublished', code: '' },
  { id: 7, title: 'Операционные системы', questions: 40, duration: '30 минут', openUntil: '', status: 'closed', code: '' },
  { id: 8, title: 'Дискретная математика', questions: 30, duration: '30 минут', openUntil: '', status: 'unpublished', code: '' }
])

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
      <h1 class="quizzes-page__title">Мои квизы</h1>
    </div>

    <div class="quizzes-page__grid">
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
        @publish="showPublish = true"
      />
    </div>

    <PublishModal v-if="showPublish" @close="showPublish = false" />
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
