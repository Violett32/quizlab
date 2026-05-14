<script setup>
import BaseModal from './BaseModal.vue'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Подтвердить' },
  loadingLabel: { type: String, default: 'Загружаем…' },
  isLoading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['close', 'confirm', 'home'])
</script>

<template>
  <BaseModal @close="emit('close')">
    <div class="confirm">
      <h2 class="confirm__title">{{ title }}</h2>
      <p v-if="subtitle" class="confirm__subtitle">{{ subtitle }}</p>

      <p v-if="error" class="confirm__error">{{ error }}</p>

      <div class="confirm__actions">
        <button
          type="button"
          class="btn btn-lg confirm__action"
          :disabled="isLoading"
          @click="emit('confirm')"
        >{{ isLoading ? loadingLabel : confirmLabel }}</button>
        <button
          type="button"
          class="btn btn-lg confirm__action"
          @click="emit('home')"
        >Вернуться на главную</button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.confirm {
  width: 100%;
  min-width: 480px;
  text-align: center;
}

.confirm__title {
  font-size: var(--font-size-h1);
  font-weight: 400;
  color: var(--color-text);
  margin: 0 0 16px;
}

.confirm__subtitle {
  font-size: var(--font-size-h3);
  color: var(--color-text);
  margin: 0 0 32px;
}

.confirm__error {
  margin: 0 0 16px;
  font-size: var(--font-size-body);
  color: var(--color-accent2);
}

.confirm__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.confirm__action {
  width: 360px;
  max-width: 100%;
}

/* Мобилка */
@media (max-width: 767px) {
  .confirm {
    min-width: 0;
  }

  .confirm__title {
    font-size: var(--font-size-h2-mob);
    margin-bottom: 12px;
  }

  .confirm__subtitle {
    font-size: var(--font-size-body-mob);
    margin-bottom: 20px;
  }

  .confirm__actions {
    gap: 8px;
  }

  .confirm__action {
    width: 240px;
  }
}
</style>
