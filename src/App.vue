<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import QuestionTypeModal from './components/QuestionTypeModal.vue'

const appRouter = useRouter()
const showCreateQuestion = ref(false)

const onQuestionTypeSelect = (type) => {
  showCreateQuestion.value = false
  appRouter.push({ path: '/create', query: { type } })
}

const route = useRoute()
const hideChrome = computed(() => route.meta?.hideChrome)

// Потом заменим на реальную авторизацию
const userRole = computed(() => route.meta?.role || 'guest')

// Параметры кругов
const START_Y = 120          // первый круг под хедером
const STEP_Y = 500           // шаг по вертикали
const MIN_COUNT = 3          // минимальное количество кругов
const LEFT_OFFSET = -241
const RIGHT_OFFSET = -225

const circles = ref([])

const updateCircles = () => {
  const pageHeight = document.documentElement.scrollHeight
  const list = []
  let y = START_Y
  let i = 0
  while (list.length < MIN_COUNT || y < pageHeight - 300) {
    const isLeft = i % 2 === 0
    list.push({
      top: y,
      side: isLeft ? 'left' : 'right',
      offset: isLeft ? LEFT_OFFSET : RIGHT_OFFSET,
    })
    y += STEP_Y
    i++
  }
  circles.value = list
}

let observer
onMounted(() => {
  updateCircles()
  observer = new ResizeObserver(updateCircles)
  observer.observe(document.body)
})
onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <div class="app">
    <div
      v-for="(c, i) in circles"
      :key="i"
      class="bg-circle"
      :style="{ top: c.top + 'px', [c.side]: c.offset + 'px' }"
    ></div>
    <div class="app__content">
      <AppHeader v-if="!hideChrome" :role="userRole" @create="showCreateQuestion = true" />
      <router-view />
      <AppFooter v-if="!hideChrome" :role="userRole" />
    </div>
    <QuestionTypeModal v-if="showCreateQuestion" @close="showCreateQuestion = false" @select="onQuestionTypeSelect" />

    <div class="app__too-small">
      <div class="app__too-small-inner">
        <h1 class="app__too-small-title">КвизЛаб</h1>
        <p class="app__too-small-text">
          К сожалению, разрешение вашего устройства не поддерживается. Для корректной работы сервиса откройте КвизЛаб на устройстве с шириной экрана не менее&nbsp;360&nbsp;пикселей или воспользуйтесь компьютером.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  position: relative;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  width: 430px;
  height: 430px;
  border-radius: 50%;
  background: #6896FF;
  filter: blur(600px);
  pointer-events: none;
  z-index: 0;
}

@media (max-width: 767px) {
  .bg-circle {
    width: 280px;
    height: 280px;
  }
}

.app__content {
  position: relative;
  z-index: 1;
}

.app__too-small {
  display: none;
}

@media (max-width: 359px) {
  .app__content,
  .bg-circle {
    display: none !important;
  }

  .app__too-small {
    display: flex;
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: var(--color-bg);
    align-items: center;
    justify-content: center;
    padding: 24px;
    text-align: center;
  }

  .app__too-small-inner {
    max-width: 320px;
  }

  .app__too-small-title {
    font-size: var(--font-size-h1-mob);
    font-weight: 400;
    color: var(--color-primary);
    margin: 0 0 16px;
  }

  .app__too-small-text {
    font-size: var(--font-size-body-mob);
    color: var(--color-text);
    margin: 0;
    line-height: 1.4;
  }
}
</style>
