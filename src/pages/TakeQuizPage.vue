<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import QuizResultModal from '@/components/QuizResultModal.vue'
import { apiFetch } from '@/api/client.js'

const router = useRouter()
const route = useRoute()
const showResultModal = ref(false)
const isReviewMode = ref(false)
const resultScore = ref('')
const loadError = ref('')
// Учитель при публикации решает, можно ли студенту смотреть правильные ответы.
// Узнаём это только из ответа submit — до этого момента false.
const canShowAnswers = ref(false)

// "1234567" -> "1.2 МБ" / "12 КБ"
function formatBytes(n) {
  if (!n) return ''
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} МБ`
  if (n >= 1024) return `${Math.round(n / 1024)} КБ`
  return `${n} Б`
}

// Открыть файл вопроса в новой вкладке. fetch с токеном → blob → URL.createObjectURL,
// потому что <a href> не передаёт Authorization-заголовок.
async function openQuestionFile() {
  const url = currentQuestion.value?.file?.url
  if (!url) return
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem('quizlab_token')}` },
    })
    if (!res.ok) throw new Error(`Failed to load file: ${res.status}`)
    const blob = await res.blob()
    window.open(URL.createObjectURL(blob), '_blank')
  } catch (err) {
    console.error('Failed to open question file:', err)
  }
}

// Пустой каркас, чтобы шаблон рендерился до загрузки данных без ошибок.
const quiz = ref({ title: '', questions: [] })
const attemptId = ref(null)

const currentIndex = ref(0)
const currentQuestion = computed(() => quiz.value.questions[currentIndex.value])
const selected = ref({})

const toggleAnswer = (answerId) => {
  if (isReviewMode.value) return
  const q = currentQuestion.value
  const qId = q.id
  const arr = selected.value[qId] ? [...selected.value[qId]] : []
  if (q.type === 'multiple') {
    if (arr.includes(answerId)) {
      selected.value = { ...selected.value, [qId]: arr.filter(id => id !== answerId) }
    } else {
      selected.value = { ...selected.value, [qId]: [...arr, answerId] }
    }
  } else {
    selected.value = { ...selected.value, [qId]: [answerId] }
  }
}

const isSelected = (answerId) => {
  if (isReviewMode.value) {
    const a = currentQuestion.value.answers.find(x => x.id === answerId)
    return !!(a && a.correct)
  }
  const qId = currentQuestion.value.id
  return (selected.value[qId] || []).includes(answerId)
}

const reviewOpenAnswers = computed(() =>
  currentQuestion.value.answers.filter(a => a.correct).map(a => a.text)
)

const hintText = computed(() => {
  const t = currentQuestion.value.type
  if (t === 'open') return 'Введите ответ'
  if (t === 'multiple') return 'Отметьте правильный или несколько'
  return 'Отметьте правильный'
})

const openAnswers = ref({})
const newOpenAnswer = ref('')

const confirmOpenAnswer = () => {
  const t = newOpenAnswer.value.trim()
  if (!t) return
  const qId = currentQuestion.value.id
  const arr = openAnswers.value[qId] || []
  openAnswers.value = { ...openAnswers.value, [qId]: [...arr, t] }
  newOpenAnswer.value = ''
}

const removeOpenAnswerAt = (qId, idx) => {
  const arr = openAnswers.value[qId] || []
  openAnswers.value = {
    ...openAnswers.value,
    [qId]: arr.filter((_, i) => i !== idx)
  }
}

watch(currentIndex, () => {
  newOpenAnswer.value = ''
})

// Собираем ответы студента в формат, который ждёт бэк.
const buildAnswersPayload = () =>
  quiz.value.questions.map((q) => {
    if (q.type === 'open') {
      const chips = openAnswers.value[q.id] || []
      // Берём первую непустую введённую запись.
      const text = chips.find((t) => t && t.trim()) || ''
      return { question_id: q.id, text_answer: text }
    }
    return {
      question_id: q.id,
      selected_option_ids: selected.value[q.id] || [],
    }
  })

const isSubmitting = ref(false)

async function submitAttempt() {
  if (isSubmitting.value || !attemptId.value) return
  isSubmitting.value = true
  try {
    const data = await apiFetch(`/api/student/attempts/${attemptId.value}/submit`, {
      method: 'POST',
      body: { answers: buildAnswersPayload() },
    })
    resultScore.value = `${data.score}/100`
    canShowAnswers.value = !!data.show_answers
    // Если разрешено — подмешиваем правильные ответы в загруженный квиз,
    // чтобы шаблон в режиме review их подсветил.
    if (data.show_answers && Array.isArray(data.answers)) {
      const byQuestion = new Map(data.answers.map((a) => [a.question_id, a]))
      quiz.value.questions = quiz.value.questions.map((q) => {
        const info = byQuestion.get(q.id)
        if (!info) return q
        if (q.type === 'open') {
          // Open-вопрос приходит с пустым answers — заполняем "правильными" псевдо-вариантами.
          return {
            ...q,
            answers: (info.correct_texts || []).map((text, i) => ({ id: i, text, correct: true })),
          }
        }
        const correctIds = new Set(info.correct_option_ids || [])
        return {
          ...q,
          answers: q.answers.map((a) => ({ ...a, correct: correctIds.has(a.id) })),
        }
      })
    }
    showResultModal.value = true
    if (timerId) clearInterval(timerId)
  } catch (err) {
    // Если бэк сказал "Время вышло" — всё равно показываем модалку с 0.
    resultScore.value = '0/100'
    showResultModal.value = true
    console.error('Submit failed:', err)
  } finally {
    isSubmitting.value = false
  }
}

const next = () => {
  if (currentIndex.value < quiz.value.questions.length - 1) {
    currentIndex.value++
  } else if (isReviewMode.value) {
    router.push('/student')
  } else {
    submitAttempt()
  }
}

const onResultHome = () => {
  showResultModal.value = false
  router.push('/student')
}

const onResultReview = () => {
  showResultModal.value = false
  isReviewMode.value = true
  currentIndex.value = 0
}

const remainingSec = ref(0)
const timerDisplay = computed(() => {
  const m = Math.floor(remainingSec.value / 60)
  const s = remainingSec.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

let timerId
let endTimestamp = 0 // когда заканчивается попытка (мс)

function tickTimer() {
  const remaining = Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000))
  remainingSec.value = remaining
  if (remaining <= 0) {
    if (timerId) clearInterval(timerId)
    submitAttempt() // авто-сабмит при истечении таймера
  }
}

onMounted(async () => {
  const quizId = Number(route.params.id)
  if (!Number.isFinite(quizId)) {
    loadError.value = 'Неверный id квиза'
    return
  }

  try {
    // 1. Загружаем квиз (без правильных ответов).
    const data = await apiFetch(`/api/student/quizzes/${quizId}`)
    quiz.value = data

    // 2. Стартуем попытку — фиксируется started_at.
    const attempt = await apiFetch('/api/student/attempts', {
      method: 'POST',
      body: { quiz_id: quizId },
    })
    attemptId.value = attempt.id

    // 3. Запускаем таймер: дедлайн = started_at + time_limit минут.
    endTimestamp =
      new Date(attempt.started_at).getTime() + attempt.time_limit * 60 * 1000
    tickTimer()
    timerId = setInterval(tickTimer, 1000)
  } catch (err) {
    loadError.value = err.message || 'Не удалось загрузить квиз'
  }
})
onUnmounted(() => {
  if (timerId) clearInterval(timerId)
})
</script>

<template>
  <div class="take-quiz">
    <p v-if="loadError" class="take-quiz__load-error">{{ loadError }}</p>
    <template v-else-if="quiz.questions.length">
    <section class="take-quiz__top-bar">
      <h2 class="take-quiz__top-title">{{ quiz.title }}</h2>
    </section>

    <div class="take-quiz__q-nav">
      <div class="take-quiz__pills">
        <button
          v-for="(q, i) in quiz.questions"
          :key="q.id"
          type="button"
          class="take-quiz__pill"
          :class="{ 'take-quiz__pill--active': i === currentIndex }"
          @click="currentIndex = i"
        >{{ i + 1 }}</button>
      </div>
      <div v-if="!isReviewMode" class="take-quiz__timer-badge">
        <img src="@/assets/icons/time.svg" alt="" class="take-quiz__timer-badge-icon">
        {{ timerDisplay }}
      </div>
    </div>

    <section class="take-quiz__banner">
      <img src="@/assets/images/hero-bg.png" alt="" class="take-quiz__banner-bg">
      <div class="take-quiz__banner-content">
        <div class="take-quiz__header">
          <div class="take-quiz__badge">
            <img src="@/assets/icons/question.svg" alt="" class="take-quiz__badge-icon">
            {{ currentIndex + 1 }}
          </div>

          <div class="take-quiz__q-card">
            <p class="take-quiz__q-text">{{ currentQuestion.text }}</p>
          </div>

          <div v-if="!isReviewMode" class="take-quiz__badge">
            <img src="@/assets/icons/time.svg" alt="" class="take-quiz__badge-icon">
            {{ timerDisplay }}
          </div>
          <div v-else class="take-quiz__badge take-quiz__badge--placeholder" aria-hidden="true"></div>
        </div>

        <a v-if="currentQuestion.file" href="#" class="take-quiz__file" @click.prevent="openQuestionFile">
          {{ currentQuestion.file.name }} ({{ formatBytes(currentQuestion.file.size) }})
        </a>

        <p class="take-quiz__hint">{{ hintText }}</p>

        <div v-if="currentQuestion.type === 'open'" class="take-quiz__open">
          <div class="take-quiz__open-chips">
            <template v-if="isReviewMode">
              <span
                v-for="(a, i) in reviewOpenAnswers"
                :key="i"
                class="take-quiz__open-chip take-quiz__open-chip--static"
              >{{ a }}</span>
            </template>
            <template v-else>
              <span
                v-for="(a, i) in openAnswers[currentQuestion.id] || []"
                :key="i"
                class="take-quiz__open-chip"
                @click="removeOpenAnswerAt(currentQuestion.id, i)"
              >{{ a }}</span>
              <input
                v-model="newOpenAnswer"
                type="text"
                class="take-quiz__open-chip take-quiz__open-chip--input"
                placeholder="Ответ"
                @keydown.enter.prevent="confirmOpenAnswer"
                @blur="confirmOpenAnswer"
              />
            </template>
          </div>
        </div>

        <div v-else class="take-quiz__answers">
          <button
            v-for="a in currentQuestion.answers"
            :key="a.id"
            type="button"
            class="take-quiz__answer"
            @click="toggleAnswer(a.id)"
          >
            <span
              class="take-quiz__radio"
              :class="{
                'take-quiz__radio--active': isSelected(a.id),
                'take-quiz__radio--square': currentQuestion.type === 'multiple'
              }"
            >
              <svg
                v-if="isSelected(a.id)"
                class="take-quiz__radio-check"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="5 12 10 17 19 8"/>
              </svg>
            </span>
            <span class="take-quiz__answer-text">{{ a.text }}</span>
          </button>
        </div>

        <button type="button" class="btn btn-lg take-quiz__next" @click="next">
          {{ currentIndex === quiz.questions.length - 1
            ? (isReviewMode ? 'Вернуться на главную' : 'Завершить тест')
            : 'Далее' }}
        </button>
      </div>
    </section>

    </template>

    <QuizResultModal
      v-if="showResultModal"
      :score="resultScore"
      :show-answers="canShowAnswers"
      @close="showResultModal = false"
      @home="onResultHome"
      @review="onResultReview"
    />
  </div>
</template>

<style scoped>
.take-quiz {
  padding-top: 0;
}

.take-quiz__load-error {
  text-align: center;
  padding: 80px 24px;
  color: var(--color-accent2);
  font-size: var(--font-size-h3);
}

.take-quiz__top-bar {
  height: 170px;
  background: var(--color-accent);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 24px;
}

.take-quiz__top-title {
  font-size: var(--font-size-h1);
  font-weight: 400;
  color: var(--color-text);
  margin: 0;
}

.take-quiz__banner {
  position: relative;
  max-width: 1235px;
  width: 100%;
  margin: 40px auto 60px;
  border-radius: 20px;
  overflow: hidden;
}

.take-quiz__banner-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.take-quiz__banner-content {
  position: relative;
  padding: 40px 60px 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.take-quiz__header {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: 24px;
}

.take-quiz__badge {
  align-self: start;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--color-accent);
  border-radius: 10px;
  font-family: var(--font-family-btn);
  font-size: var(--font-size-h2);
  font-weight: 400;
  color: var(--color-text);
  min-width: 80px;
  justify-content: center;
}

.take-quiz__badge-icon {
  width: 32px;
  height: 32px;
}

.take-quiz__badge--placeholder {
  background: transparent;
  visibility: hidden;
}

.take-quiz__q-card {
  width: 100%;
  max-width: 650px;
  justify-self: center;
  background: var(--color-bg2);
  border-radius: 12px;
  padding: 24px 28px;
  min-height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.take-quiz__q-text {
  margin: 0;
  font-size: var(--font-size-h3);
  color: var(--color-text);
  text-align: center;
  white-space: pre-line;
}

.take-quiz__file {
  margin-top: 16px;
  font-size: var(--font-size-body);
  color: var(--color-accent);
  text-align: center;
  text-decoration: none;
}

.take-quiz__file:hover {
  opacity: 0.7;
}

.take-quiz__hint {
  margin-top: 64px;
  font-size: var(--font-size-body);
  color: var(--color-text-light);
  text-align: center;
}

.take-quiz__answers {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 459px;
}

.take-quiz__answer {
  display: grid;
  grid-template-columns: 28px 1fr 28px;
  align-items: center;
  gap: 16px;
  padding: 12px 24px;
  background: var(--color-bg2);
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
  font-family: var(--font-family);
  font-size: var(--font-size-body);
  color: var(--color-text);
}

.take-quiz__answer:hover {
  background: rgba(247, 254, 255, 0.85);
}

.take-quiz__radio {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--color-text-light);
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-text);
  transition: background 0.2s ease, border-color 0.2s ease;
}

.take-quiz__radio--active {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.take-quiz__radio--square {
  border-radius: 8px;
}

.take-quiz__radio-check {
  width: 18px;
  height: 18px;
}

.take-quiz__answer-text {
  text-align: center;
}

.take-quiz__next {
  margin-top: 28px;
}

/* Открытый ответ */
.take-quiz__open {
  width: 100%;
  max-width: 650px;
  margin-top: 16px;
  background: var(--color-bg2);
  border-radius: 12px;
  padding: 40px;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.take-quiz__open-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

.take-quiz__open-chip {
  padding: 10px 18px;
  border-radius: 10px;
  background: var(--color-accent);
  color: var(--color-text);
  font-size: var(--font-size-body);
  font-family: var(--font-family);
  cursor: pointer;
}

.take-quiz__open-chip--static {
  cursor: default;
}

.take-quiz__open-chip--input {
  border: none;
  outline: none;
  background: var(--color-text-light);
  text-align: center;
  field-sizing: content;
  min-width: 80px;
  max-width: 280px;
  cursor: text;
  transition: background 0.2s ease;
}

.take-quiz__open-chip--input::placeholder {
  color: var(--color-text);
}

.take-quiz__open-chip--input:focus,
.take-quiz__open-chip--input:not(:placeholder-shown) {
  background: var(--color-accent);
}

.take-quiz__q-nav {
  display: none;
}

/* Мобилка */
@media (max-width: 767px) {
  .take-quiz__top-bar {
    height: auto;
    padding: calc(75px + 14px) 20px 14px;
  }

  .take-quiz__top-title {
    font-size: var(--font-size-body-mob);
    font-weight: 700;
  }

  .take-quiz__q-nav {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 12px 20px;
    background: var(--color-bg2);
  }

  .take-quiz__pills {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 4px;
    overflow-x: auto;
    scrollbar-width: none;
    min-width: 0;
  }

  .take-quiz__pills::-webkit-scrollbar {
    display: none;
  }

  .take-quiz__pill {
    width: 32px;
    height: 40px;
    flex-shrink: 0;
    background: var(--color-text-light);
    border: none;
    border-radius: 10px;
    color: var(--color-bg2);
    font-family: var(--font-family);
    font-size: var(--font-size-body-mob);
    font-weight: 700;
    cursor: pointer;
  }

  .take-quiz__pill--active {
    background: var(--color-accent);
  }

  .take-quiz__timer-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    background: var(--color-accent);
    border-radius: 10px;
    font-size: var(--font-size-body-mob);
    font-weight: 700;
    color: var(--color-text);
  }

  .take-quiz__timer-badge-icon {
    width: 18px;
    height: 18px;
  }

  .take-quiz__banner {
    max-width: none;
    width: auto;
    margin: 0 20px;
    border-radius: 16px;
  }

  .take-quiz__banner-bg {
    display: none;
  }

  .take-quiz__banner-content {
    padding: 20px;
    background: var(--color-primary-dark);
    border-radius: 16px;
  }

  .take-quiz__header {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .take-quiz__badge {
    display: none;
  }

  .take-quiz__q-card {
    max-width: none;
    padding: 16px 20px;
    min-height: 90px;
  }

  .take-quiz__q-text {
    font-size: var(--font-size-body-mob);
  }

  .take-quiz__file {
    margin-top: 12px;
    font-size: var(--font-size-body-mob);
    display: block;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .take-quiz__hint {
    margin-top: 20px;
    font-size: var(--font-size-body-mob);
  }

  .take-quiz__answers {
    margin-top: 12px;
    gap: 8px;
    max-width: none;
  }

  .take-quiz__answer {
    grid-template-columns: 22px 1fr 22px;
    padding: 10px 16px;
    gap: 10px;
    font-size: var(--font-size-body-mob);
  }

  .take-quiz__radio {
    width: 22px;
    height: 22px;
  }

  .take-quiz__radio-check {
    width: 14px;
    height: 14px;
  }

  .take-quiz__next {
    margin-top: 20px;
    margin-bottom: 20px;
  }

  .take-quiz__open {
    padding: 20px;
    min-height: 200px;
  }

  .take-quiz__open-chip {
    padding: 8px 14px;
    font-size: var(--font-size-body-mob);
  }
}
</style>
