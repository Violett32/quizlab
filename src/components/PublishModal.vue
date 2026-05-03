<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from './BaseModal.vue'

const props = defineProps({
  // Код, полученный от бэка после публикации. Пока null — мы ещё не опубликовали.
  shareCode: { type: String, default: null },
  isLoading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
const emit = defineEmits(['close', 'publish'])
const router = useRouter()

const step = ref('settings') // 'settings' | 'success'
const answerType = ref('open') // 'open' | 'closed'
const closeDate = ref('')
const submitted = ref(false)
const codeCopied = ref(false)
let copyResetTimer
// До первого клика держим input как text — чтобы показать наш placeholder
// (у datetime-local placeholder игнорируется, всегда видны "дд.мм.гггг --:--").
const inputType = ref('text')

const onDateFocus = () => {
  inputType.value = 'datetime-local'
}
const onDateBlur = () => {
  if (!closeDate.value) inputType.value = 'text'
}

// Минимальный момент для пикера — текущая локальная дата+время. Прошедшее выбрать нельзя.
function localNowForInput() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}
const minDateTime = localNowForInput()

// Подсветка пустого поля включается только после первой попытки публикации.
const invalidCloseDate = computed(() => submitted.value && !closeDate.value)

// Когда родитель прислал код — публикация прошла, переключаемся на success.
watch(() => props.shareCode, (v) => {
  if (v) step.value = 'success'
})

const publish = () => {
  submitted.value = true
  if (!closeDate.value) return
  // datetime-local отдаёт строку без TZ ("2026-12-31T23:59") — Date парсит как локальное время,
  // toISOString() конвертирует в UTC. Бэк сохранит корректно с таймзоной.
  const iso = new Date(closeDate.value).toISOString()
  // 'open' = студенту разрешено видеть правильные ответы после прохождения.
  emit('publish', { deadline: iso, show_answers: answerType.value === 'open' })
}

const copyCode = () => {
  if (!props.shareCode) return
  navigator.clipboard.writeText(props.shareCode)
  codeCopied.value = true
  clearTimeout(copyResetTimer)
  copyResetTimer = setTimeout(() => { codeCopied.value = false }, 2000)
}

const goHome = () => {
  emit('close')
  router.push('/teacher')
}
</script>

<template>
  <BaseModal @close="emit('close')">
    <div class="publish" v-if="step === 'settings'">
      <h2 class="publish__title">Опубликовать квиз</h2>

      <div class="publish__tabs">
        <button
          type="button"
          class="publish__tab"
          :class="{ 'publish__tab--active': answerType === 'open' }"
          @click="answerType = 'open'"
        >Открытые ответы</button>
        <button
          type="button"
          class="publish__tab"
          :class="{ 'publish__tab--active': answerType === 'closed' }"
          @click="answerType = 'closed'"
        >Закрытые ответы</button>
      </div>

      <div class="publish__field">
        <input
          v-model="closeDate"
          :type="inputType"
          :min="minDateTime"
          :readonly="inputType === 'text'"
          :class="['publish__input', { 'publish__input--invalid': invalidCloseDate }]"
          placeholder="Дата и время закрытия квиза"
          @focus="onDateFocus"
          @blur="onDateBlur"
        />
      </div>

      <p v-if="error" class="publish__error">{{ error }}</p>

      <button type="button" class="btn btn-lg publish__submit" @click="publish" :disabled="isLoading">
        {{ isLoading ? 'Публикуем…' : 'Опубликовать' }}
      </button>
    </div>

    <div class="publish" v-else>
      <h2 class="publish__title">Квиз опубликован</h2>

      <div class="publish__check">
        <svg width="200" height="200" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="54" stroke="var(--color-accent1)" stroke-width="4"/>
          <path d="M38 60L52 74L82 44" stroke="var(--color-accent1)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <button type="button" class="btn btn-sm publish__code-btn" @click="copyCode">
        <template v-if="codeCopied">Скопировано</template>
        <template v-else>
          Код: {{ shareCode }}
          <img src="@/assets/icons/copy.svg" alt="" class="publish__copy-icon">
        </template>
      </button>

      <button type="button" class="btn btn-lg publish__submit" @click="goHome">Вернуться на главную</button>
    </div>
  </BaseModal>
</template>

<style scoped>
.publish {
  width: 100%;
  min-width: 480px;
}

.publish__title {
  font-size: var(--font-size-h1);
  font-weight: 400;
  color: var(--color-text);
  text-align: center;
  margin-bottom: 28px;
}

.publish__tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--color-primary-light);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 20px;
}

.publish__tab {
  background: none;
  border: none;
  padding: 12px 16px;
  font-family: var(--font-family);
  font-size: var(--font-size-body);
  color: var(--color-text);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.publish__tab--active {
  background: var(--color-accent);
  color: var(--color-primary-dark);
}

.publish__field {
  margin-bottom: 20px;
}

.publish__input {
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

.publish__input::placeholder {
  color: var(--color-text);
  opacity: 0.7;
}

.publish__input--invalid,
.publish__input--invalid:focus {
  border-color: var(--color-accent2);
}

/* Когда дата ещё не выбрана — type=date в WebKit не отдаёт placeholder, делаем подсказку плейсхолдером сами. */
.publish__input[type='date']:invalid::-webkit-datetime-edit {
  color: var(--color-text);
  opacity: 0.7;
}

.publish__submit {
  display: block;
  margin: 0 auto;
}

.publish__error {
  color: var(--color-accent2);
  font-size: var(--font-size-body);
  text-align: center;
  margin: 0 0 12px;
}

.publish__check {
  display: flex;
  justify-content: center;
  margin-bottom: 28px;
}

.publish__code-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 auto 20px;
  font-family: var(--font-family-btn);
  font-weight: var(--font-weight-btn);
  font-size: var(--font-size-btn);
}

.publish__copy-icon {
  width: 24px;
  height: 24px;
}

/* Мобилка */
@media (max-width: 767px) {
  .publish {
    min-width: 0;
  }

  .publish__title {
    font-size: var(--font-size-h2-mob);
    margin-bottom: 20px;
  }

  .publish__tabs {
    margin-bottom: 16px;
  }

  .publish__tab {
    font-size: var(--font-size-body-mob);
    padding: 8px 12px;
  }

  .publish__field {
    margin-bottom: 16px;
  }

  .publish__input {
    height: 48px;
    border-radius: 12px;
    font-size: var(--font-size-body-mob);
  }

  .publish__check {
    margin-bottom: 20px;
  }

  .publish__check svg {
    width: 140px;
    height: 140px;
  }

  .publish__code-btn {
    font-size: var(--font-size-btn-mob);
    margin-bottom: 12px;
  }

  .publish__copy-icon {
    width: 18px;
    height: 18px;
  }
}
</style>
