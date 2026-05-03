<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ResultItem from '@/components/ResultItem.vue'
import EmptyState from '@/components/EmptyState.vue'
import { loadStudentAttempts } from '@/api/student.js'

const router = useRouter()
const route = useRoute()

const allResults = ref([])

// Если в URL есть ?quiz=N — показываем результаты только этого квиза.
const filterQuizId = computed(() => {
  const v = Number(route.query.quiz)
  return Number.isFinite(v) && v > 0 ? v : null
})

const results = computed(() =>
  filterQuizId.value
    ? allResults.value.filter((r) => r.quizId === filterQuizId.value)
    : allResults.value
)

onMounted(async () => {
  try {
    const data = await loadStudentAttempts()
    allResults.value = data.results
  } catch (err) {
    console.error('Failed to load student results:', err)
  }
})

const onAction = (quizId) => {
  router.push(`/quiz/${quizId}`)
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="results-page container">
    <div class="results-page__header">
      <button type="button" class="results-page__back" @click="goBack" aria-label="Назад">
        <img src="@/assets/icons/arrow.svg" alt="" class="results-page__back-icon">
      </button>
      <h1 class="results-page__title">Результаты</h1>
    </div>

    <div v-if="results.length" class="results-page__list">
      <ResultItem
        v-for="r in results"
        :key="r.id"
        :title="r.title"
        :duration="r.duration"
        :score="r.score"
        :truncate="false"
        :action-label="r.actionLabel"
        :action-disabled="r.actionDisabled"
        @action="onAction(r.quizId)"
      />
    </div>
    <EmptyState v-else text="У вас пока нет результатов" />
  </div>
</template>

<style scoped>
.results-page {
  padding-top: 140px;
}

.results-page__header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 28px;
}

.results-page__back {
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

.results-page__back:hover {
  opacity: 0.6;
}

.results-page__back-icon {
  width: 48px;
  height: 48px;
}

.results-page__title {
  font-size: var(--font-size-h1);
  font-weight: 400;
  color: var(--color-text);
  margin: 0;
}

.results-page__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Мобилка */
@media (max-width: 767px) {
  .results-page {
    padding-top: calc(75px + var(--padding-page-top-mob));
  }

  .results-page__header {
    gap: 4px;
    margin-bottom: 20px;
  }

  .results-page__back-icon {
    width: 32px;
    height: 32px;
  }

  .results-page__title {
    font-size: var(--font-size-h1-mob);
  }

  .results-page__list {
    gap: 8px;
  }
}
</style>
