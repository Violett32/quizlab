<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ResultItem from '@/components/ResultItem.vue'

const router = useRouter()

//заменить на данные из БД
const results = ref([
  { title: 'Знание языка Java', duration: '10:34', score: '78/100', action: 'Пройти заново' },
  { title: 'Алгоритмы и структуры данных', duration: '15:55', score: '77/100', action: 'Тест закрыт', disabled: true },
  { title: 'Информационная безопасность', duration: '45:52', score: '10/100', action: 'Пройти заново' },
  { title: 'Дискретная математика', duration: '43:16', score: '20/100', action: 'Пройти заново' },
  { title: 'Основы веб-разработки', duration: '05:55', score: '100/100', action: 'Тест закрыт', disabled: true },
  { title: 'Знание языка Java', duration: '30:44', score: '0/100', action: 'Пройти заново' },
  { title: 'Информационная безопасность', duration: '45:52', score: '10/100', action: 'Пройти заново' },
  { title: 'Дискретная математика', duration: '43:16', score: '20/100', action: 'Пройти заново' }
])

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

    <div class="results-page__list">
      <ResultItem
        v-for="(r, i) in results"
        :key="i"
        :title="r.title"
        :duration="r.duration"
        :score="r.score"
        :truncate="false"
        :action-label="r.action"
        :action-disabled="r.disabled"
      />
    </div>
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
</style>
