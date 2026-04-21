<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  duration: { type: String, default: '' },
  score: { type: String, default: '' },
  date: { type: String, default: '' },
  people: { type: [String, Number], default: '' },
  truncate: { type: Boolean, default: true },
  actionLabel: { type: String, default: '' },
  actionDisabled: { type: Boolean, default: false }
})

const emit = defineEmits(['action'])

const scoreColor = computed(() => {
  const [got, total] = props.score.split('/').map(Number)
  if (!total) return 'var(--color-accent1)'
  return got / total >= 0.5 ? 'var(--color-accent1)' : 'var(--color-accent2)'
})

const displayTitle = computed(() => {
  if (!props.truncate) return props.title
  return props.title.length > 20 ? props.title.slice(0, 20) + '…' : props.title
})
</script>

<template>
  <div class="result-item" :class="{ 'result-item--full': actionLabel }">
    <div class="result-item__title">{{ displayTitle }}</div>
    <div class="result-item__score" :style="{ color: scoreColor }">{{ score }}</div>
    <div v-if="people !== ''" class="result-item__duration">
      <img src="@/assets/icons/person.svg" alt="" class="result-item__icon result-item__icon--person">
      <span>{{ people }}</span>
    </div>
    <div v-else class="result-item__duration">
      <img src="@/assets/icons/time.svg" alt="" class="result-item__icon">
      <span>{{ duration }}</span>
    </div>
    <button
      v-if="actionLabel"
      type="button"
      class="btn btn-lg result-item__action"
      :class="{ 'result-item__action--disabled': actionDisabled }"
      :disabled="actionDisabled"
      @click="emit('action')"
    >{{ actionLabel }}</button>
  </div>
</template>

<style scoped>
.result-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  column-gap: 48px;
  align-items: center;
  padding: 26px 36px;
  background: var(--color-bg2);
  border: 1px solid var(--color-primary-light);
  border-radius: 10px;
  font-size: var(--font-size-h3);
  color: var(--color-text);
  max-width: 593px;
  width: 100%;
}

.result-item--full {
  max-width: none;
  grid-template-columns: 1fr auto auto 1fr;
}

.result-item--full .result-item__duration {
  margin-left: 40px;
}

.result-item:hover {
  border-color: var(--color-primary);
}

.result-item__title {
  font-weight: 500;
  white-space: nowrap;
}

.result-item__score {
  font-weight: 500;
}

.result-item__duration {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text);
  font-size: var(--font-size-h3);
  font-weight: 500;
}

.result-item__icon {
  width: 30px;
  height: 30px;
}

.result-item__icon--person {
  width: 20px;
  height: 20px;
}

.result-item__action {
  justify-self: end;
}

.result-item__action--disabled {
  background: transparent;
  border: 1px solid var(--color-primary-light);
  color: var(--color-text-light);
}

/* Мобилка */
@media (max-width: 767px) {
  .result-item {
    grid-template-columns: auto auto;
    justify-content: center;
    row-gap: 8px;
    column-gap: 16px;
    padding: 16px 20px;
    max-width: none;
    font-size: var(--font-size-body-mob);
  }

  .result-item__title {
    grid-column: 1 / -1;
    text-align: center;
    white-space: normal;
    font-size: var(--font-size-body-mob);
    font-weight: 700;
  }

  .result-item__score {
    font-size: var(--font-size-body-mob);
    justify-self: end;
  }

  .result-item__duration {
    font-size: var(--font-size-body-mob);
    justify-self: start;
  }

  .result-item__icon {
    width: 20px;
    height: 20px;
  }

  .result-item__icon--person {
    width: 16px;
    height: 16px;
  }

  .result-item--full {
    grid-template-columns: auto auto;
  }

  .result-item--full .result-item__duration {
    margin-left: 0;
  }

  .result-item--full .result-item__action {
    grid-column: 1 / -1;
    justify-self: center;
  }
}
</style>
