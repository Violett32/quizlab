<script setup>
import BaseModal from './BaseModal.vue'

defineProps({
  isLoading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['close', 'confirm', 'home'])
</script>

<template>
  <BaseModal @close="emit('close')">
    <div class="close-quiz">
      <h2 class="close-quiz__title">Закрыть квиз</h2>
      <p class="close-quiz__subtitle">Действительно ли вы хотите закрыть квиз?</p>

      <p v-if="error" class="close-quiz__error">{{ error }}</p>

      <div class="close-quiz__actions">
        <button
          type="button"
          class="btn btn-lg close-quiz__action"
          :disabled="isLoading"
          @click="emit('confirm')"
        >{{ isLoading ? 'Закрываем…' : 'Закрыть' }}</button>
        <button
          type="button"
          class="btn btn-lg close-quiz__action"
          @click="emit('home')"
        >Вернуться на главную</button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.close-quiz {
  width: 100%;
  min-width: 480px;
  text-align: center;
}

.close-quiz__title {
  font-size: var(--font-size-h1);
  font-weight: 400;
  color: var(--color-text);
  margin: 0 0 16px;
}

.close-quiz__subtitle {
  font-size: var(--font-size-h3);
  color: var(--color-text);
  margin: 0 0 32px;
}

.close-quiz__error {
  margin: 0 0 16px;
  font-size: var(--font-size-body);
  color: var(--color-accent2);
}

.close-quiz__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.close-quiz__action {
  width: 360px;
  max-width: 100%;
}

/* Мобилка */
@media (max-width: 767px) {
  .close-quiz {
    min-width: 0;
  }

  .close-quiz__title {
    font-size: var(--font-size-h2-mob);
    margin-bottom: 12px;
  }

  .close-quiz__subtitle {
    font-size: var(--font-size-body-mob);
    margin-bottom: 20px;
  }

  .close-quiz__actions {
    gap: 8px;
  }

  .close-quiz__action {
    width: 240px;
  }
}
</style>
