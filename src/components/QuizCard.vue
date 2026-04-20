<script setup>
const props = defineProps({
  title: { type: String, required: true },
  questions: { type: [String, Number], default: '' },
  duration: { type: String, default: '' },
  openUntil: { type: String, default: '' },
  status: { type: String, default: 'open' }, // 'open' | 'closed' | 'unpublished'
  mode: { type: String, default: 'student' }, // 'student' | 'teacher'
  code: { type: String, default: '' }
})

const emit = defineEmits(['start', 'results', 'edit', 'publish'])

const copyCode = () => {
  navigator.clipboard.writeText(props.code)
}
</script>

<template>
  <div class="quiz-card">
    <h4 class="quiz-card__title">{{ title }}</h4>

    <div class="quiz-card__meta">
      <span class="quiz-card__meta-item">
        <img src="@/assets/icons/question.svg" alt="" class="quiz-card__icon quiz-card__icon--question">
        {{ questions }}
      </span>
      <span class="quiz-card__meta-item quiz-card__meta-item--time">
        <img src="@/assets/icons/time2.svg" alt="" class="quiz-card__icon quiz-card__icon--time">
        {{ duration }}
      </span>
    </div>

    <p v-if="mode === 'teacher' && status === 'unpublished'" class="quiz-card__status">Не опубликован</p>
    <p v-else-if="mode === 'teacher' && status === 'closed'" class="quiz-card__status">Тест закрыт</p>
    <p v-else class="quiz-card__until">Открыт до: {{ openUntil }}</p>

    <div class="quiz-card__actions">
      <template v-if="mode === 'teacher'">
        <button
          v-if="code"
          type="button"
          class="btn btn-sm quiz-card__btn quiz-card__btn--code"
          @click.stop="copyCode"
        >
          Код: {{ code }}
          <img src="@/assets/icons/copy.svg" alt="" class="quiz-card__copy-icon">
        </button>
        <button
          v-else
          type="button"
          class="btn btn-sm quiz-card__btn"
          @click.stop="emit('publish')"
        >Опубликовать</button>
        <button type="button" class="btn btn-sm quiz-card__btn" @click.stop="emit('edit')">Редактировать</button>
      </template>
      <template v-else>
        <button
          v-if="status === 'open'"
          type="button"
          class="btn btn-sm quiz-card__btn"
          @click.stop="emit('start')"
        >Пройти</button>
        <button
          v-else
          type="button"
          class="btn btn-sm quiz-card__btn quiz-card__btn--closed"
          disabled
        >Тест закрыт</button>
        <button type="button" class="btn btn-sm quiz-card__btn" @click.stop="emit('results')">Результат</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.quiz-card {
  width: 298px;
  height: 286px;
  background: var(--color-bg2);
  border: 1px solid var(--color-primary-light);
  border-radius: 16px;
  padding: 24px 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}

.quiz-card:hover {
  border-color: var(--color-primary);
}

.quiz-card__title {
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.quiz-card__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: var(--font-size-body);
  color: var(--color-text);
}

.quiz-card__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0;
}

.quiz-card__meta-item--time {
  gap: 2px;
}

.quiz-card__icon--question {
  width: 24px;
  height: 24px;
}

.quiz-card__icon--time {
  width: 20px;
  height: 20px;
}

.quiz-card__until {
  font-size: var(--font-size-body);
  color: var(--color-text);
  margin: 0;
}

.quiz-card__status {
  font-size: var(--font-size-body);
  color: var(--color-text);
  margin: 0;
}

.quiz-card__actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  margin-top: auto;
  align-items: center;
}

.quiz-card__btn {
  width: 100%;
  max-width: 260px;
  font-family: var(--font-family-btn);
  font-weight: var(--font-weight-btn);
  font-size: var(--font-size-btn);
}

.quiz-card__btn--code {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.quiz-card__copy-icon {
  width: 24px;
  height: 24px;
}

.quiz-card__btn--closed {
  background: transparent;
  border: 1px solid var(--color-primary-light);
  color: var(--color-text-light);
  cursor: not-allowed;
}
</style>
