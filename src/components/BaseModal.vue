<script setup>
import { onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['close'])

const handleEsc = (e) => {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', handleEsc)
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEsc)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="modal" @mousedown.self="emit('close')">
    <div class="modal__box" @mousedown.stop>
      <div class="modal__circle modal__circle--tl"></div>
      <div class="modal__circle modal__circle--br"></div>
      <button class="modal__close" @click="emit('close')" aria-label="Закрыть">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="modal__content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  background: rgba(45, 55, 72, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
}

.modal__box {
  position: relative;
  overflow: hidden;
  background: var(--color-bg2);
  border-radius: 24px;
  padding: 56px 80px;
  width: 100%;
  max-width: 640px;
  box-shadow: 0 20px 60px rgba(45, 55, 72, 0.15);
}

.modal__circle {
  position: absolute;
  width: 430px;
  height: 430px;
  border-radius: 50%;
  background: #6896FF;
  filter: blur(600px);
  pointer-events: none;
  z-index: 0;
}

.modal__circle--tl {
  top: -375px;
  left: -215px;
}

.modal__circle--br {
  bottom: -375px;
  right: -215px;
}

.modal__content {
  position: relative;
  z-index: 1;
}

.modal__close {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 2;
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s ease;
}

.modal__close:hover {
  opacity: 0.6;
}

/* Мобилка */
@media (max-width: 767px) {
  .modal {
    padding: 20px;
  }

  .modal__box {
    padding: 48px 24px 32px;
    border-radius: 20px;
  }

  .modal__close {
    top: 16px;
    right: 16px;
    padding: 4px;
  }

  .modal__close svg {
    width: 20px;
    height: 20px;
  }
}
</style>
