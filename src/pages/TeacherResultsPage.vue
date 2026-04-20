<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const quizResults = ref([
  {
    quiz: 'Знание языка Java',
    students: [
      { name: 'Иванов Дмитрий', isu: '341205', score: '78/100' },
      { name: 'Петрова Анна', isu: '356821', score: '45/100' },
      { name: 'Козлов Максим', isu: '312490', score: '92/100' },
      { name: 'Смирнова Елена', isu: '367412', score: '30/100' },
      { name: 'Волков Артём', isu: '389201', score: '61/100' },
      { name: 'Новикова Мария', isu: '345678', score: '88/100' },
      { name: 'Морозов Кирилл', isu: '378345', score: '15/100' },
      { name: 'Фёдорова Дарья', isu: '390112', score: '54/100' },
      { name: 'Иванов Дмитрий', isu: '341205', score: '78/100' },
      { name: 'Петрова Анна', isu: '356821', score: '45/100' },
      { name: 'Козлов Максим', isu: '312490', score: '92/100' },
      { name: 'Смирнова Елена', isu: '367412', score: '30/100' },
      { name: 'Волков Артём', isu: '389201', score: '61/100' },
      { name: 'Новикова Мария', isu: '345678', score: '88/100' },
      { name: 'Морозов Кирилл', isu: '378345', score: '15/100' },
      { name: 'Фёдорова Дарья', isu: '390112', score: '54/100' }
    ]
  },
  {
    quiz: 'Алгоритмы и структуры данных',
    students: [
      { name: 'Горелова Виктория', isu: '367910', score: '30/100' },
      { name: 'Лебедев Никита', isu: '354201', score: '67/100' },
      { name: 'Соколова Полина', isu: '321087', score: '78/100' },
      { name: 'Кузнецов Иван', isu: '398456', score: '42/100' },
      { name: 'Попова Алиса', isu: '310234', score: '91/100' },
      { name: 'Михайлов Егор', isu: '375690', score: '28/100' },
      { name: 'Андреева Софья', isu: '362178', score: '55/100' },
      { name: 'Орлов Роман', isu: '348901', score: '73/100' },
      { name: 'Горелова Виктория', isu: '367910', score: '30/100' },
      { name: 'Лебедев Никита', isu: '354201', score: '67/100' },
      { name: 'Соколова Полина', isu: '321087', score: '78/100' },
      { name: 'Кузнецов Иван', isu: '398456', score: '42/100' },
      { name: 'Попова Алиса', isu: '310234', score: '91/100' },
      { name: 'Михайлов Егор', isu: '375690', score: '28/100' },
      { name: 'Андреева Софья', isu: '362178', score: '55/100' },
      { name: 'Орлов Роман', isu: '348901', score: '73/100' }
    ]
  }
])

const scoreColor = (score) => {
  const [got, total] = score.split('/').map(Number)
  if (!total) return 'var(--color-accent1)'
  return got / total >= 0.5 ? 'var(--color-accent1)' : 'var(--color-accent2)'
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

    <div class="teacher-results__columns">
      <div v-for="(q, qi) in quizResults" :key="qi" class="teacher-results__column">
        <h3 class="teacher-results__quiz-name">{{ q.quiz }}</h3>
        <div class="teacher-results__list">
          <div
            v-for="(s, si) in q.students"
            :key="si"
            class="student-row"
          >
            <span class="student-row__name">{{ s.name }}</span>
            <span class="student-row__isu">{{ s.isu }}</span>
            <span class="student-row__score" :style="{ color: scoreColor(s.score) }">{{ s.score }}</span>
          </div>
        </div>
      </div>
    </div>
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
</style>
