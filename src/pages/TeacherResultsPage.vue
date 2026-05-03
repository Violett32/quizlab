<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import { loadTeacherResults } from '@/api/teacher.js'

const router = useRouter()

const quizResults = ref([])

onMounted(async () => {
  try {
    const data = await loadTeacherResults()
    quizResults.value = data.byQuiz
  } catch (err) {
    console.error('Failed to load teacher results:', err)
  }
})

const scoreColor = (score, passing) => {
  const got = Number(String(score).split('/')[0])
  if (!Number.isFinite(got)) return 'var(--color-accent1)'
  return got >= (passing ?? 50) ? 'var(--color-accent1)' : 'var(--color-accent2)'
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="teacher-results container">
    <div class="teacher-results__header">
      <button type="button" class="teacher-results__back" @click="goBack" aria-label="Назад">
        <img src="@/assets/icons/arrow.svg" alt="" class="teacher-results__back-icon">
      </button>
      <h1 class="teacher-results__title">Результаты</h1>
    </div>

    <div v-if="quizResults.length" class="teacher-results__columns">
      <div v-for="q in quizResults" :key="q.quizId" class="teacher-results__column">
        <h3 class="teacher-results__quiz-name">{{ q.quiz }}</h3>
        <div class="teacher-results__list">
          <div
            v-for="s in q.students"
            :key="s.attemptId"
            class="student-row"
          >
            <span class="student-row__name">{{ s.name }}</span>
            <span class="student-row__isu">{{ s.isu }}</span>
            <span class="student-row__score" :style="{ color: scoreColor(s.score, q.passingScore) }">{{ s.score }}</span>
          </div>
        </div>
      </div>
    </div>
    <EmptyState v-else text="У вас пока нет результатов" />
  </div>
</template>

<style scoped>
.teacher-results {
  padding-top: 140px;
}

.teacher-results__header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 28px;
}

.teacher-results__back {
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

.teacher-results__back:hover {
  opacity: 0.6;
}

.teacher-results__back-icon {
  width: 48px;
  height: 48px;
}

.teacher-results__title {
  font-size: var(--font-size-h1);
  font-weight: 400;
  color: var(--color-text);
  margin: 0;
}

.teacher-results__columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
}

.teacher-results__quiz-name {
  font-size: var(--font-size-h3);
  font-weight: 500;
  color: var(--color-text);
  text-align: center;
  margin: 0 0 16px;
}

.teacher-results__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.student-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  column-gap: 48px;
  align-items: center;
  padding: 18px 36px;
  background: var(--color-bg2);
  border: 1px solid var(--color-primary-light);
  border-radius: 10px;
}

.student-row__name {
  font-size: var(--font-size-body);
  color: var(--color-text);
}

.student-row__isu {
  font-size: var(--font-size-body);
  color: var(--color-text-light);
  margin-right: 48px;
}

.student-row__score {
  font-size: var(--font-size-h3);
  font-weight: 500;
}

/* Мобилка */
@media (max-width: 767px) {
  .teacher-results {
    padding-top: calc(75px + var(--padding-page-top-mob));
  }

  .teacher-results__header {
    gap: 4px;
    margin-bottom: 20px;
  }

  .teacher-results__back-icon {
    width: 32px;
    height: 32px;
  }

  .teacher-results__title {
    font-size: var(--font-size-h1-mob);
  }

  .teacher-results__columns {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .teacher-results__quiz-name {
    font-size: var(--font-size-h3-mob);
    margin-bottom: 12px;
  }

  .teacher-results__list {
    gap: 8px;
  }

  .student-row {
    grid-template-columns: auto auto;
    justify-content: center;
    column-gap: 16px;
    row-gap: 4px;
    padding: 14px 20px;
  }

  .student-row__name {
    grid-column: 1 / -1;
    grid-row: 1;
    font-size: var(--font-size-body-mob);
    text-align: center;
    font-weight: 700;
  }

  .student-row__score {
    grid-column: 1;
    grid-row: 2;
    font-size: var(--font-size-body-mob);
  }

  .student-row__isu {
    grid-column: 2;
    grid-row: 2;
    font-size: var(--font-size-body-mob);
    margin-right: 0;
    color: var(--color-text);
  }
}
</style>
