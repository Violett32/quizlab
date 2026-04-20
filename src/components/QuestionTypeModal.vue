<script setup>
import { ref } from 'vue'
import BaseModal from './BaseModal.vue'

const emit = defineEmits(['close', 'select'])

const selected = ref('')

const types = [
  { id: 'single', label: 'С одним вариантом ответа' },
  { id: 'multiple', label: 'С несколькими вариантами ответа' },
  { id: 'open', label: 'Открытый ответ' }
]

const submit = () => {
  if (selected.value) {
    emit('select', selected.value)
  }
}
</script>

<template>
  <BaseModal @close="emit('close')">
    <div class="qtype">
      <h2 class="qtype__title">Выберите тип вопроса</h2>

      <div class="qtype__options">
        <button
          v-for="t in types"
          :key="t.id"
          type="button"
          class="qtype__option"
          :class="{ 'qtype__option--active': selected === t.id }"
          @click="selected = t.id"
        >{{ t.label }}</button>
      </div>

      <button type="button" class="btn btn-lg qtype__submit" :disabled="!selected" @click="submit">Перейти к вопросу</button>
    </div>
  </BaseModal>
</template>

<style scoped>
.qtype {
  width: 100%;
  min-width: 480px;
}

.qtype__title {
  font-size: var(--font-size-h1);
  font-weight: 400;
  color: var(--color-text);
  text-align: center;
  margin-bottom: 28px;
}

.qtype__options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.qtype__option {
  width: 100%;
  padding: 24px;
  border: 1px solid var(--color-primary);
  border-radius: 14px;
  background: var(--color-bg2);
  font-family: var(--font-family);
  font-size: var(--font-size-body);
  font-weight: 400;
  color: var(--color-text);
  text-align: center;
  cursor: pointer;
  transition: background 0.2s ease;
}

.qtype__option--active {
  background: var(--color-primary-light);
}

.qtype__submit {
  display: block;
  margin: 0 auto;
}
</style>
