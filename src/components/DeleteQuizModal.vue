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
    <div class="delete-quiz">
      <h2 class="delete-quiz__title">Удалить квиз</h2>
      <p class="delete-quiz__subtitle">Действительно ли вы хотите удалить квиз?</p>

      <p v-if="error" class="delete-quiz__error">{{ error }}</p>

      <div class="delete-quiz__actions">
        <button
          type="button"
          class="btn btn-lg delete-quiz__action"
          :disabled="isLoading"
          @click="emit('confirm')"
        >{{ isLoading ? 'Удаляем…' : 'Удалить' }}</button>
        <button
          type="button"
          class="btn btn-lg delete-quiz__action"
          @click="emit('home')"
        >Вернуться на главную</button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.delete-quiz {
  width: 100%;
  min-width: 480px;
  text-align: center;
}

.delete-quiz__title {
  font-size: var(--font-size-h1);
  font-weight: 400;
  color: var(--color-text);
  margin: 0 0 16px;
}

.delete-quiz__subtitle {
  font-size: var(--font-size-h3);
  color: var(--color-text);
  margin: 0 0 32px;
}

.delete-quiz__error {
  margin: 0 0 16px;
  font-size: var(--font-size-body);
  color: var(--color-accent2);
}

.delete-quiz__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.delete-quiz__action {
  width: 360px;
  max-width: 100%;
}

/* Мобилка */
@media (max-width: 767px) {
  .delete-quiz {
    min-width: 0;
  }

  .delete-quiz__title {
    font-size: var(--font-size-h2-mob);
    margin-bottom: 12px;
  }

  .delete-quiz__subtitle {
    font-size: var(--font-size-body-mob);
    margin-bottom: 20px;
  }

  .delete-quiz__actions {
    gap: 8px;
  }

  .delete-quiz__action {
    width: 240px;
  }
}
</style>
