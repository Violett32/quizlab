<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from './BaseModal.vue'

const emit = defineEmits(['close'])
const router = useRouter()

const step = ref('settings') // 'settings' | 'success'
const answerType = ref('open') // 'open' | 'closed'
const closeDate = ref('')
const generatedCode = ref('372937')

const publish = () => {
  // TODO: реальная публикация
  step.value = 'success'
}

const copyCode = () => {
  navigator.clipboard.writeText(generatedCode.value)
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
          type="text"
          class="publish__input"
          placeholder="Дата и время закрытия квиза"
        />
      </div>

      <button type="button" class="btn btn-lg publish__submit" @click="publish">Опубликовать</button>
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
        Код: {{ generatedCode }}
        <img src="@/assets/icons/copy.svg" alt="" class="publish__copy-icon">
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

.publish__submit {
  display: block;
  margin: 0 auto;
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
</style>
