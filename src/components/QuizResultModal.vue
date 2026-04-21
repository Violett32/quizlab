<script setup>
import BaseModal from './BaseModal.vue'

defineProps({
  score: {
    type: [String, Number],
    default: '80/100'
  }
})

const emit = defineEmits(['close', 'home', 'review'])
</script>

<template>
  <BaseModal @close="emit('close')">
    <div class="result">
      <h2 class="result__title">Результат</h2>
      <p class="result__score">{{ score }}</p>

      <div class="result__actions">
        <button type="button" class="btn btn-lg result__action" @click="emit('home')">Перейти на главную</button>
        <button type="button" class="btn btn-lg result__action" @click="emit('review')">Посмотреть ответы</button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.result {
  width: 100%;
  min-width: 480px;
  text-align: center;
}

.result__title {
  font-size: var(--font-size-h1);
  font-weight: 400;
  color: var(--color-text);
  margin: 0 0 16px;
}

.result__score {
  font-size: var(--font-size-h1);
  font-weight: 400;
  color: var(--color-accent1);
  margin: 0 0 32px;
}

.result__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.result__action {
  width: 360px;
  max-width: 100%;
}

/* Мобилка */
@media (max-width: 767px) {
  .result {
    min-width: 0;
  }

  .result__title {
    font-size: var(--font-size-h2-mob);
    margin-bottom: 12px;
  }

  .result__score {
    font-size: var(--font-size-h1-mob);
    margin-bottom: 20px;
  }

  .result__actions {
    gap: 8px;
  }

  .result__action {
    width: 200px;
  }
}
</style>
