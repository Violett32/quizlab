<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import QuestionTypeModal from '@/components/QuestionTypeModal.vue'
import SaveQuizModal from '@/components/SaveQuizModal.vue'
import PublishModal from '@/components/PublishModal.vue'

const router = useRouter()
const route = useRoute()
const initialType = ['single', 'multiple', 'open'].includes(route.query.type) ? route.query.type : 'single'
const showQTypeModal = ref(false)
const showSaveModal = ref(false)
const showPublishModal = ref(false)

const qInputRef = ref(null)
const autoResize = () => {
  const el = qInputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

const quizName = ref('Название квиза')

let nextQuestionId = 1
let nextAnswerId = 1

const createEmptyQuestion = (type = 'single') => ({
  id: nextQuestionId++,
  type,
  text: '',
  answers: type === 'open' ? [] : [
    { id: nextAnswerId++, text: '', correct: false },
    { id: nextAnswerId++, text: '', correct: false },
    { id: nextAnswerId++, text: '', correct: false },
    { id: nextAnswerId++, text: '', correct: false }
  ]
})

const questions = ref([createEmptyQuestion(initialType)])
const activeQuestionId = ref(questions.value[0].id)

const activeQuestion = computed(() =>
  questions.value.find(q => q.id === activeQuestionId.value) || questions.value[0]
)

const questionPreview = (q) => {
  const t = (q?.text || '').trim()
  return t || 'Введите вопрос'
}
const questionLabel = (q, index) => `${index + 1}.\u00A0${questionPreview(q)}`

watch(
  () => activeQuestion.value?.text,
  () => nextTick(autoResize)
)
watch(activeQuestionId, () => {
  newOpenAnswer.value = ''
  nextTick(autoResize)
})

const toggleAnswer = (id) => {
  const q = activeQuestion.value
  if (q.type === 'multiple') {
    const a = q.answers.find(a => a.id === id)
    if (a) a.correct = !a.correct
  } else {
    q.answers.forEach(a => (a.correct = a.id === id))
  }
}

const hintText = computed(() => {
  const type = activeQuestion.value?.type
  if (type === 'multiple') return 'Добавьте и заполните ответы, отметьте правильный или несколько'
  if (type === 'open') return 'Добавьте и заполните ответы, напишите правильный или несколько'
  return 'Добавьте и заполните ответы, отметьте правильный'
})

const newOpenAnswer = ref('')

const confirmOpenAnswer = () => {
  const t = newOpenAnswer.value.trim()
  if (!t) return
  activeQuestion.value.answers.push({
    id: nextAnswerId++,
    text: t,
    correct: true
  })
  newOpenAnswer.value = ''
}

const removeOpenAnswer = (id) => {
  activeQuestion.value.answers = activeQuestion.value.answers.filter(a => a.id !== id)
}

const addAnswer = () => {
  activeQuestion.value.answers.push({ id: nextAnswerId++, text: '', correct: false })
}

const removeAnswer = (id) => {
  activeQuestion.value.answers = activeQuestion.value.answers.filter(a => a.id !== id)
}

const addQuestion = (type = 'single') => {
  const q = createEmptyQuestion(type)
  questions.value.push(q)
  activeQuestionId.value = q.id
}

const onQuestionTypeSelect = (type) => {
  addQuestion(type)
  showQTypeModal.value = false
}

const removeQuestion = (id) => {
  questions.value = questions.value.filter(q => q.id !== id)
  if (questions.value.length === 0) {
    addQuestion()
  } else if (activeQuestionId.value === id) {
    activeQuestionId.value = questions.value[0].id
  }
}

const openSaveModal = () => {
  showSaveModal.value = true
}

const persistQuiz = (settings) => {
  console.log('save quiz', {
    name: quizName.value,
    questions: questions.value,
    ...settings
  })
}

const onPublishFromSave = (settings) => {
  persistQuiz(settings)
  showSaveModal.value = false
  showPublishModal.value = true
}

const onHomeFromSave = (settings) => {
  persistQuiz(settings)
  showSaveModal.value = false
  router.push('/teacher')
}
</script>

<template>
  <div class="create-quiz">
    <section class="create-quiz__banner">
      <img src="@/assets/images/hero-bg.png" alt="" class="create-quiz__banner-bg">
      <div class="create-quiz__banner-content">
        <div class="create-quiz__left-panel">
          <input
            v-model="quizName"
            type="text"
            class="create-quiz__name"
            placeholder="Название квиза"
          />
          <div class="create-quiz__q-list">
            <div
              v-for="(q, index) in questions"
              :key="q.id"
              class="create-quiz__q-row"
              @click="activeQuestionId = q.id"
            >
              <p
                class="create-quiz__q-label"
                :class="{ 'create-quiz__q-label--active': q.id === activeQuestionId }"
              >{{ questionLabel(q, index) }}</p>
              <button
                type="button"
                class="create-quiz__q-delete"
                :class="{ 'create-quiz__q-delete--active': q.id === activeQuestionId }"
                @click.stop="removeQuestion(q.id)"
                aria-label="Удалить вопрос"
              >
                <svg class="create-quiz__q-delete-icon" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.5 18.75L12.5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <path d="M17.5 18.75L17.5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <path d="M3.75 8.75H26.25C24.6063 8.75 23.7844 8.75 23.2312 9.20398C23.1299 9.28709 23.0371 9.37995 22.954 9.48121C22.5 10.0344 22.5 10.8563 22.5 12.5V21C22.5 22.8856 22.5 23.8284 21.9142 24.4142C21.3284 25 20.3856 25 18.5 25H11.5C9.61438 25 8.67157 25 8.08579 24.4142C7.5 23.8284 7.5 22.8856 7.5 21V12.5C7.5 10.8563 7.5 10.0344 7.04602 9.48121C6.96291 9.37995 6.87005 9.28709 6.76879 9.20398C6.21561 8.75 5.39374 8.75 3.75 8.75Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <path d="M12.5852 4.21324C12.7276 4.08034 13.0415 3.96291 13.4781 3.87915C13.9147 3.7954 14.4497 3.75 15 3.75C15.5503 3.75 16.0853 3.7954 16.5219 3.87915C16.9585 3.96291 17.2724 4.08034 17.4148 4.21324" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
          <button
            type="button"
            class="create-quiz__add-btn create-quiz__add-btn--question"
            @click="showQTypeModal = true"
          >
            <img src="@/assets/icons/add-btn.svg" alt="" class="create-quiz__add-btn-icon">
            Вопрос
          </button>
        </div>

        <div class="create-quiz__right-side">
          <div class="create-quiz__q-wrap">
            <textarea
              ref="qInputRef"
              v-model="activeQuestion.text"
              class="create-quiz__q-input"
              placeholder="Введите вопрос"
              rows="1"
              @input="autoResize"
            ></textarea>
          </div>

          <button type="button" class="create-quiz__add-btn">
            <img src="@/assets/icons/add-btn.svg" alt="" class="create-quiz__add-btn-icon">
            Файл
          </button>

          <p class="create-quiz__hint">{{ hintText }}</p>

          <div v-if="activeQuestion.type === 'open'" class="create-quiz__open">
            <div class="open-chips">
              <span
                v-for="a in activeQuestion.answers"
                :key="a.id"
                class="open-chip"
                @click="removeOpenAnswer(a.id)"
              >{{ a.text }}</span>
              <input
                v-model="newOpenAnswer"
                type="text"
                class="open-chip open-chip--input"
                placeholder="Ответ"
                @keydown.enter.prevent="confirmOpenAnswer"
                @blur="confirmOpenAnswer"
              />
            </div>
          </div>

          <div v-else class="create-quiz__answers">
            <template v-for="a in activeQuestion.answers" :key="a.id">
              <div class="answer-row">
                <button
                  type="button"
                  class="answer-row__radio"
                  :class="{
                    'answer-row__radio--active': a.correct,
                    'answer-row__radio--square': activeQuestion.type === 'multiple'
                  }"
                  @click="toggleAnswer(a.id)"
                >
                  <svg
                    v-if="a.correct"
                    class="answer-row__radio-check"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="5 12 10 17 19 8"/>
                  </svg>
                </button>
                <input
                  v-model="a.text"
                  type="text"
                  class="answer-row__input"
                  placeholder="Введите ответ"
                />
              </div>
              <button type="button" class="answer-delete" @click="removeAnswer(a.id)">
                <img src="@/assets/icons/trash.svg" alt="" class="answer-delete__icon">
              </button>
            </template>

            <button type="button" class="answer-row answer-row--add" @click="addAnswer">
              <span
                class="answer-row__radio answer-row__radio--placeholder"
                :class="{ 'answer-row__radio--square': activeQuestion.type === 'multiple' }"
              ></span>
              <span class="answer-row__add-text">Добавить ответ</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <div class="create-quiz__actions">
      <button type="button" class="btn btn-lg" @click="openSaveModal">Сохранить квиз</button>
      <button type="button" class="btn btn-lg create-quiz__delete-q" @click="removeQuestion(activeQuestion.id)">Удалить вопрос</button>
    </div>

    <QuestionTypeModal
      v-if="showQTypeModal"
      @close="showQTypeModal = false"
      @select="onQuestionTypeSelect"
    />

    <SaveQuizModal
      v-if="showSaveModal"
      @close="showSaveModal = false"
      @publish="onPublishFromSave"
      @home="onHomeFromSave"
    />

    <PublishModal
      v-if="showPublishModal"
      @close="showPublishModal = false"
    />
  </div>
</template>

<style scoped>
.create-quiz {
  padding-top: 100px;
  padding-bottom: var(--padding-section);
}

/* Баннер */
.create-quiz__banner {
  position: relative;
  max-width: 1235px;
  width: 100%;
  margin: 0 auto;
  border-radius: 20px;
  overflow: hidden;
}

.create-quiz__banner-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.create-quiz__banner-content {
  position: relative;
  display: grid;
  grid-template-columns: 420fr 815fr;
  align-items: stretch;
}

/* Левая белая панель */
.create-quiz__left-panel {
  background: var(--color-bg2);
  border-radius: 16px;
  padding: 40px 32px;
  display: flex;
  flex-direction: column;
}

.create-quiz__name {
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--color-text);
  background: none;
  border: none;
  font-family: var(--font-family);
  width: 100%;
  text-align: center;
}

.create-quiz__name::placeholder {
  color: var(--color-text);
  opacity: 0.7;
}

.create-quiz__q-list {
  margin-top: 20px;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.create-quiz__q-row {
  position: relative;
  width: 100%;
  cursor: pointer;
}

.create-quiz__q-label {
  width: 100%;
  max-width: 266px;
  margin: 0;
  font-size: var(--font-size-body);
  color: var(--color-text-light);
  text-align: left;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

.create-quiz__q-label--active {
  color: var(--color-text);
}

.create-quiz__q-delete {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--color-text-light);
  transition: color 0.2s ease, opacity 0.2s ease;
}

.create-quiz__q-delete:hover {
  opacity: 0.7;
}

.create-quiz__q-delete--active {
  color: var(--color-text);
}

.create-quiz__q-delete-icon {
  display: block;
  width: 24px;
  height: 24px;
}

/* Правая часть */
.create-quiz__right-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
}

.create-quiz__q-wrap {
  width: 100%;
  max-width: 650px;
  background: var(--color-bg2);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.create-quiz__q-input {
  width: 100%;
  max-width: 458px;
  min-height: 58px;
  padding: 17px 0;
  line-height: 24px;
  border: none;
  background: none;
  font-family: var(--font-family);
  font-size: var(--font-size-body);
  color: var(--color-text);
  resize: none;
  text-align: center;
  display: block;
  overflow: hidden;
}

.create-quiz__q-input::placeholder {
  color: var(--color-text-light);
}

.create-quiz__add-btn {
  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-family-btn);
  font-size: var(--font-size-btn);
  font-weight: var(--font-weight-btn);
  color: var(--color-accent);
  background: none;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.create-quiz__add-btn:hover {
  opacity: 0.7;
}

.create-quiz__add-btn-icon {
  width: 32px;
  height: 32px;
  filter: invert(68%) sepia(53%) saturate(1000%) hue-rotate(346deg) brightness(100%) contrast(101%);
}

.create-quiz__add-btn--question {
  align-self: center;
}

.create-quiz__hint {
  margin-top: 64px;
  font-size: var(--font-size-body);
  color: var(--color-primary-light);
  text-align: center;
}

/* Открытый ответ */
.create-quiz__open {
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

.open-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

.open-chip {
  padding: 10px 18px;
  border-radius: 10px;
  background: var(--color-accent);
  color: var(--color-text);
  font-size: var(--font-size-body);
  font-family: var(--font-family);
  cursor: pointer;
}

.open-chip--input {
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

.open-chip--input::placeholder {
  color: var(--color-text);
}

.open-chip--input:focus,
.open-chip--input:not(:placeholder-shown) {
  background: var(--color-accent);
}

/* Ответы */
.create-quiz__answers {
  width: 100%;
  margin-top: 16px;
  display: grid;
  grid-template-columns: minmax(0, 459px) auto;
  justify-content: center;
  align-items: center;
  column-gap: 16px;
  row-gap: 12px;
}

.answer-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 24px;
  background: var(--color-bg2);
  border-radius: 12px;
  border: none;
}

.answer-row--add {
  grid-column: 1;
  cursor: pointer;
  background: rgba(247, 254, 255, 0.35);
  border: 1px dashed var(--color-bg2);
  transition: background 0.2s ease;
}

.answer-row--add:hover {
  background: rgba(247, 254, 255, 0.5);
}

.answer-row__radio {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--color-text-light);
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  color: var(--color-text);
  transition: background 0.2s ease, border-color 0.2s ease;
}

.answer-row__radio--active {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.answer-row__radio--square {
  border-radius: 8px;
}

.answer-row__radio-check {
  width: 18px;
  height: 18px;
}

.answer-row__radio--placeholder {
  border-color: var(--color-bg2);
  cursor: default;
}

.answer-row__input {
  flex: 1;
  height: 28px;
  padding: 0;
  border: none;
  background: none;
  font-family: var(--font-family);
  font-size: var(--font-size-body);
  color: var(--color-text);
  text-align: center;
}

.answer-row__input::placeholder {
  color: var(--color-text-light);
}

.answer-row__add-text {
  flex: 1;
  text-align: center;
  font-size: var(--font-size-body);
  color: var(--color-bg2);
}

.answer-delete {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.2s ease;
}

.answer-delete:hover {
  opacity: 0.6;
}

.answer-delete__icon {
  width: 28px;
  height: 28px;
  filter: brightness(0) invert(1);
}

/* Кнопка сохранить */
.create-quiz__actions {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

.create-quiz__delete-q {
  display: none;
}

/* Мобилка */
@media (max-width: 767px) {
  .create-quiz {
    padding-top: 0;
    padding-bottom: var(--padding-section-mob);
  }

  .create-quiz__banner {
    max-width: none;
    margin: 0;
    border-radius: 0;
    overflow: visible;
  }

  .create-quiz__banner-bg {
    display: none;
  }

  .create-quiz__banner-content {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .create-quiz__left-panel {
    background: var(--color-bg2);
    border-radius: 0;
    padding: 0;
    counter-reset: question;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "name name"
      "list btn";
    align-items: center;
  }

  .create-quiz__name {
    grid-area: name;
    background: var(--color-accent);
    padding: calc(75px + 14px) 20px 14px;
    font-size: var(--font-size-body-mob);
    font-weight: 700;
  }

  .create-quiz__q-list {
    grid-area: list;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    padding: 16px 8px 16px 20px;
    gap: 4px;
    margin-top: 0;
    overflow-x: auto;
    scrollbar-width: none;
    min-width: 0;
  }

  .create-quiz__q-list::-webkit-scrollbar {
    display: none;
  }

  .create-quiz__q-row {
    width: 32px;
    height: 40px;
    background: var(--color-text-light);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    counter-increment: question;
    flex-shrink: 0;
  }

  .create-quiz__q-row:has(.create-quiz__q-label--active) {
    background: var(--color-accent);
  }

  .create-quiz__q-label {
    font-size: 0;
    color: transparent;
    max-width: none;
    width: auto;
    overflow: visible;
    word-break: normal;
    display: block;
    -webkit-line-clamp: unset;
  }

  .create-quiz__q-label::before {
    content: counter(question);
    font-size: var(--font-size-body-mob);
    color: var(--color-bg2);
    font-weight: 700;
  }

  .create-quiz__q-delete {
    display: none;
  }

  .create-quiz__right-side {
    background: var(--color-primary-dark);
    border-radius: 16px;
    padding: 20px;
    margin: 20px 20px 0;
  }

  .create-quiz__q-wrap {
    max-width: none;
    padding: 16px;
    min-height: 120px;
  }

  .create-quiz__q-input {
    max-width: none;
    font-size: var(--font-size-body-mob);
    min-height: 40px;
  }

  .create-quiz__add-btn {
    font-size: var(--font-size-btn-mob);
    margin-top: 12px;
    gap: 0;
  }

  .create-quiz__add-btn--question {
    grid-area: btn;
    padding: 0 20px;
    margin: 0;
    align-self: center;
    justify-self: end;
  }

  .create-quiz__add-btn-icon {
    width: 28px;
    height: 28px;
  }

  .create-quiz__hint {
    margin-top: 20px;
    font-size: var(--font-size-body-mob);
  }

  .create-quiz__answers {
    grid-template-columns: minmax(0, 1fr) auto;
    column-gap: 8px;
    row-gap: 8px;
    margin-top: 12px;
  }

  .answer-row {
    padding: 10px 14px;
    gap: 10px;
  }

  .answer-row__radio {
    width: 22px;
    height: 22px;
  }

  .answer-row__radio-check {
    width: 14px;
    height: 14px;
  }

  .answer-row__input,
  .answer-row__add-text {
    font-size: var(--font-size-body-mob);
  }

  .answer-delete__icon {
    width: 22px;
    height: 22px;
  }

  .create-quiz__open {
    padding: 24px;
    min-height: 180px;
  }

  .open-chip {
    padding: 8px 14px;
    font-size: var(--font-size-body-mob);
  }

  .create-quiz__actions {
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin-top: 20px;
  }

  .create-quiz__delete-q {
    display: inline-flex;
  }
}
</style>
