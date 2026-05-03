<script setup>
import { ref, computed, watch } from 'vue'
import BaseModal from './BaseModal.vue'

const props = defineProps({
  // Родитель ставит true, когда квиз действительно сохранён на бэке.
  saved: { type: Boolean, default: false },
  isLoading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  // Начальные значения — для режима редактирования.
  initialDuration: { type: [Number, String], default: '' },
  initialPassingScore: { type: [Number, String], default: '' },
})
const emit = defineEmits(['close', 'save', 'publish', 'home'])

const step = ref('settings')
const duration = ref(props.initialDuration ?? '')
const passingScore = ref(props.initialPassingScore ?? '')
const submitted = ref(false)

// Подсветка пустых обязательных полей включается только после первой попытки сабмита.
const invalidDuration = computed(() => submitted.value && !String(duration.value).trim())
const invalidPassingScore = computed(() => submitted.value && !String(passingScore.value).trim())

// Если модалку открыли с предзаполненными значениями (редактирование) — показываем подсказку
// «(в минутах)» / «(из 100)» рядом с цифрой. При первом сохранении — нет.
const isEditMode = computed(() =>
  String(props.initialDuration ?? '') !== '' || String(props.initialPassingScore ?? '') !== ''
)
const showDurationHint = computed(() => isEditMode.value && !!String(duration.value).trim())
const showPassingScoreHint = computed(() => isEditMode.value && !!String(passingScore.value).trim())

// Когда родитель сообщает, что сохранение прошло — переключаемся на success.
watch(() => props.saved, (v) => {
  if (v) step.value = 'success'
})

const submit = () => {
  submitted.value = true

  // Пустое поле — стопим, пользователь увидит подсветку.
  if (!String(duration.value).trim() || !String(passingScore.value).trim()) {
    return
  }

  emit('save', {
    duration: Number(duration.value),
    passingScore: Number(passingScore.value),
  })
}

const goToPublish = () => {
  emit('publish')
}

const goHome = () => {
  emit('home')
}
</script>

<template>
  <BaseModal @close="emit('close')">
    <div v-if="step === 'settings'" class="save-quiz">
      <h2 class="save-quiz__title">Сохранить квиз</h2>

      <div class="save-quiz__fields">
        <div class="save-quiz__field">
          <input
            v-model="duration"
            type="text"
            :class="['save-quiz__input', { 'save-quiz__input--invalid': invalidDuration }]"
            placeholder="Время прохождения, мин"
          />
          <span v-if="showDurationHint" class="save-quiz__hint">(время в минутах)</span>
        </div>
        <div class="save-quiz__field">
          <input
            v-model="passingScore"
            type="text"
            :class="['save-quiz__input', { 'save-quiz__input--invalid': invalidPassingScore }]"
            placeholder="Проходной балл (из 100)"
          />
          <span v-if="showPassingScoreHint" class="save-quiz__hint">(проходной балл)</span>
        </div>
      </div>

      <p v-if="error" class="save-quiz__error">{{ error }}</p>

      <button type="button" class="btn btn-lg save-quiz__submit" @click="submit" :disabled="isLoading">
        {{ isLoading ? 'Сохраняем…' : 'Сохранить' }}
      </button>
    </div>

    <div v-else class="save-quiz">
      <h2 class="save-quiz__title">Квиз сохранен</h2>

      <div class="save-quiz__check">
        <svg width="200" height="200" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="54" stroke="var(--color-accent1)" stroke-width="4"/>
          <path d="M38 60L52 74L82 44" stroke="var(--color-accent1)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <div class="save-quiz__actions">
        <button type="button" class="btn btn-lg save-quiz__action" @click="goToPublish">Перейти к публикации</button>
        <button type="button" class="btn btn-lg save-quiz__action" @click="goHome">Вернуться на главную</button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.save-quiz {
  width: 100%;
  min-width: 480px;
}

.save-quiz__title {
  font-size: var(--font-size-h1);
  font-weight: 400;
  color: var(--color-text);
  text-align: center;
  margin-bottom: 28px;
}

.save-quiz__fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.save-quiz__input {
  width: 100%;
  height: 56px;
  padding: 0 24px;
  border: 1px solid var(--color-primary);
  border-radius: 14px;
  background: var(--color-bg2);
  font-family: var(--font-family);
  font-size: var(--font-size-body);
  color: var(--color-text);
  text-align: center;
}

.save-quiz__input::placeholder {
  color: var(--color-text);
  opacity: 0.7;
}

.save-quiz__input--invalid,
.save-quiz__input--invalid:focus {
  border-color: var(--color-accent2);
}

.save-quiz__field {
  position: relative;
  width: 100%;
}

.save-quiz__hint {
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-light);
  font-size: var(--font-size-body);
  pointer-events: none;
}

.save-quiz__submit {
  display: block;
  margin: 0 auto;
}

.save-quiz__error {
  color: var(--color-accent2);
  font-size: var(--font-size-body);
  text-align: center;
  margin: 0 0 12px;
}

.save-quiz__check {
  display: flex;
  justify-content: center;
  margin-bottom: 28px;
}

.save-quiz__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.save-quiz__action {
  width: 360px;
  max-width: 100%;
}

/* Мобилка */
@media (max-width: 767px) {
  .save-quiz {
    min-width: 0;
  }

  .save-quiz__title {
    font-size: var(--font-size-h2-mob);
    margin-bottom: 20px;
  }

  .save-quiz__fields {
    gap: 8px;
    margin-bottom: 16px;
  }

  .save-quiz__input {
    height: 48px;
    border-radius: 12px;
    font-size: var(--font-size-body-mob);
  }

  .save-quiz__check {
    margin-bottom: 20px;
  }

  .save-quiz__check svg {
    width: 140px;
    height: 140px;
  }

  .save-quiz__actions {
    gap: 8px;
  }

  .save-quiz__action {
    width: 200px;
  }
}
</style>
