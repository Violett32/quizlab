<script setup>
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import QuestionTypeModal from '@/components/QuestionTypeModal.vue'
import SaveQuizModal from '@/components/SaveQuizModal.vue'
import PublishModal from '@/components/PublishModal.vue'
import { apiFetch } from '@/api/client.js'

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
  file: null, // { name, mime, size, base64 } если прикреплён
  answers: type === 'open' ? [] : [
    { id: nextAnswerId++, text: '', correct: false },
    { id: nextAnswerId++, text: '', correct: false },
    { id: nextAnswerId++, text: '', correct: false },
    { id: nextAnswerId++, text: '', correct: false }
  ]
})

// Лимит файла на стороне фронта: исходный (не base64) размер.
const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 МБ
const fileError = ref('')
const fileInputRef = ref(null)

// "1234567" -> "1.2 МБ" / "12 КБ"
function formatBytes(n) {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} МБ`
  if (n >= 1024) return `${Math.round(n / 1024)} КБ`
  return `${n} Б`
}

// Из имени "report.pdf" -> "PDF"; если расширения нет — пусто.
function fileExt(name) {
  if (!name) return ''
  const i = name.lastIndexOf('.')
  return i < 0 ? '' : name.slice(i + 1).toUpperCase()
}

const openFilePicker = () => {
  fileError.value = ''
  fileInputRef.value?.click()
}

// FileReader → base64 без префикса "data:...;base64,".
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const str = reader.result || ''
      const comma = str.indexOf(',')
      resolve(comma >= 0 ? str.slice(comma + 1) : str)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

const onFileSelected = async (e) => {
  const file = e.target.files?.[0]
  e.target.value = '' // чтобы повторный выбор того же файла триггерил change
  if (!file) return
  if (file.size > MAX_FILE_BYTES) {
    fileError.value = 'Файл больше 10 МБ'
    return
  }
  try {
    const base64 = await readFileAsBase64(file)
    activeQuestion.value.file = {
      name: file.name,
      mime: file.type || 'application/octet-stream',
      size: file.size,
      base64,
    }
  } catch (err) {
    fileError.value = 'Не удалось прочитать файл'
    console.error(err)
  }
}

const removeFile = () => {
  activeQuestion.value.file = null
  fileError.value = ''
}

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

// Состояние сохранения и публикации.
const quizId = ref(null)
const isSaved = ref(false)
const isSaveLoading = ref(false)
const saveError = ref('')
const shareCode = ref(null)
const isPublishLoading = ref(false)
const publishError = ref('')

// Настройки, подгружаемые при редактировании. Прокидываем в SaveQuizModal как начальные.
const initialDuration = ref('')
const initialPassingScore = ref('')

// Если в URL есть ?edit=<id> — режим редактирования.
const editingId = computed(() => {
  const v = Number(route.query.edit)
  return Number.isFinite(v) && v > 0 ? v : null
})

// Ключ для бэкапа несохранённых изменений в localStorage.
const draftKey = computed(() =>
  editingId.value ? `quizlab-quiz-draft-${editingId.value}` : null
)

// Превращает массив вопросов из формы во внутренний формат с локальными id.
// Файл здесь приходит как { name, mime, size, url } (без base64) — base64 подгружаем отдельно.
function toFormQuestions(list) {
  return list.map((q) => ({
    id: nextQuestionId++,
    type: q.type,
    text: q.text || '',
    file: q.file ? { ...q.file } : null,
    answers: (q.answers || []).map((a) => ({
      id: nextAnswerId++,
      text: a.text || '',
      correct: !!a.correct,
    })),
  }))
}

// Скачивает байты файла по url и кладёт base64 рядом с метаданными.
// Нужно потому что PUT квиза пересоздаёт вопросы — без base64 файл потеряется.
async function fetchFileBase64(url) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${localStorage.getItem('quizlab_token')}` },
  })
  if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const str = reader.result || ''
      const comma = str.indexOf(',')
      resolve(comma >= 0 ? str.slice(comma + 1) : str)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

onMounted(async () => {
  if (!editingId.value) return
  try {
    const data = await apiFetch(`/api/teacher/quizzes/${editingId.value}`)
    quizName.value = data.title
    quizId.value = data.id
    initialDuration.value = data.time_limit
    initialPassingScore.value = data.passing_score
    questions.value = toFormQuestions(data.questions)
    activeQuestionId.value = questions.value[0]?.id

    // Подгружаем base64 для уже сохранённых файлов — параллельно, чтобы не задерживать рендер.
    questions.value.forEach(async (q) => {
      if (q.file?.url && !q.file.base64) {
        try {
          q.file.base64 = await fetchFileBase64(q.file.url)
        } catch (err) {
          console.error('Failed to fetch existing file:', err)
        }
      }
    })
  } catch (err) {
    console.error('Failed to load quiz for editing:', err)
    return
  }

  // Если в localStorage остался несохранённый черновик — накатываем его поверх серверных данных.
  const stored = localStorage.getItem(draftKey.value)
  if (stored) {
    try {
      const draft = JSON.parse(stored)
      if (typeof draft.quizName === 'string') quizName.value = draft.quizName
      if (Array.isArray(draft.questions)) {
        questions.value = toFormQuestions(draft.questions)
        activeQuestionId.value = questions.value[0]?.id
      }
    } catch {
      // битый JSON — игнорируем
    }
  }

  // Авто-бэкап изменений в localStorage. Срабатывает на любые правки в названии или вопросах.
  watch(
    [quizName, questions],
    () => {
      if (!draftKey.value) return
      localStorage.setItem(
        draftKey.value,
        JSON.stringify({
          quizName: quizName.value,
          questions: questions.value.map((q) => ({
            type: q.type,
            text: q.text,
            answers: q.answers.map((a) => ({ text: a.text, correct: a.correct })),
          })),
        })
      )
    },
    { deep: true }
  )
})

// Превращаем фронтовый questions[] в формат, который ждёт бэк.
const buildPayload = (settings) => ({
  title: quizName.value,
  time_limit: settings.duration,
  passing_score: settings.passingScore,
  questions: questions.value.map((q) => ({
    type: q.type,
    text: q.text,
    // Файл шлём только если есть base64 (новый или подгруженный из существующего).
    file: q.file?.base64
      ? { name: q.file.name, mime: q.file.mime, base64: q.file.base64 }
      : null,
    answers: q.answers.map((a) => ({ text: a.text, correct: a.correct })),
  })),
})

// Ищет первый вопрос без правильного ответа. Возвращает его и человеческое описание проблемы.
function findQuestionWithoutCorrect() {
  for (let i = 0; i < questions.value.length; i++) {
    const q = questions.value[i]
    const hasCorrect = q.type === 'open'
      ? q.answers.some((a) => a.correct && (a.text || '').trim())
      : q.answers.some((a) => a.correct)
    if (!hasCorrect) {
      return {
        question: q,
        index: i + 1,
        message: q.type === 'open'
          ? `Вопрос ${i + 1}: добавьте хотя бы один правильный ответ`
          : `Вопрос ${i + 1}: отметьте хотя бы один правильный ответ`,
      }
    }
  }
  return null
}

const onSaveQuiz = async (settings) => {
  saveError.value = ''

  const invalid = findQuestionWithoutCorrect()
  if (invalid) {
    activeQuestionId.value = invalid.question.id
    saveError.value = invalid.message
    return
  }

  isSaveLoading.value = true
  try {
    const url = editingId.value
      ? `/api/teacher/quizzes/${editingId.value}`
      : '/api/teacher/quizzes'
    const method = editingId.value ? 'PUT' : 'POST'
    const data = await apiFetch(url, { method, body: buildPayload(settings) })
    quizId.value = data.id ?? editingId.value
    // После успешного сохранения чистим бэкап несохранённых изменений.
    if (draftKey.value) localStorage.removeItem(draftKey.value)
    isSaved.value = true // SaveQuizModal сам переключится на success-step через watch
  } catch (err) {
    saveError.value = err.message || 'Не удалось сохранить квиз'
  } finally {
    isSaveLoading.value = false
  }
}

const onPublishFromSave = () => {
  showSaveModal.value = false
  showPublishModal.value = true
}

const onHomeFromSave = () => {
  showSaveModal.value = false
  router.push('/teacher')
}

const onPublish = async ({ deadline, show_answers }) => {
  publishError.value = ''
  isPublishLoading.value = true
  try {
    const data = await apiFetch(`/api/teacher/quizzes/${quizId.value}/publish`, {
      method: 'POST',
      body: { deadline: deadline || null, show_answers },
    })
    shareCode.value = data.share_code
  } catch (err) {
    publishError.value = err.message || 'Не удалось опубликовать квиз'
  } finally {
    isPublishLoading.value = false
  }
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

          <input
            ref="fileInputRef"
            type="file"
            class="create-quiz__file-input"
            @change="onFileSelected"
          />
          <template v-if="activeQuestion.file">
            <div class="create-quiz__file-info">
              <span class="create-quiz__file-name">{{ activeQuestion.file.name }}</span>
              <span class="create-quiz__file-meta">
                {{ fileExt(activeQuestion.file.name) }} · {{ formatBytes(activeQuestion.file.size) }}
              </span>
              <button
                type="button"
                class="create-quiz__file-remove"
                aria-label="Удалить файл"
                @click="removeFile"
              >×</button>
            </div>
          </template>
          <button v-else type="button" class="create-quiz__add-btn" @click="openFilePicker">
            <img src="@/assets/icons/add-btn.svg" alt="" class="create-quiz__add-btn-icon">
            Файл
          </button>
          <p v-if="fileError" class="create-quiz__file-error">{{ fileError }}</p>

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
      :saved="isSaved"
      :is-loading="isSaveLoading"
      :error="saveError"
      :initial-duration="initialDuration"
      :initial-passing-score="initialPassingScore"
      @close="showSaveModal = false"
      @save="onSaveQuiz"
      @publish="onPublishFromSave"
      @home="onHomeFromSave"
    />

    <PublishModal
      v-if="showPublishModal"
      :share-code="shareCode"
      :is-loading="isPublishLoading"
      :error="publishError"
      @close="showPublishModal = false"
      @publish="onPublish"
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

.create-quiz__file-input {
  display: none;
}

.create-quiz__file-info {
  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-family-btn);
  font-size: var(--font-size-btn);
  font-weight: var(--font-weight-btn);
  color: var(--color-accent);
  max-width: 100%;
}

.create-quiz__file-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}

.create-quiz__file-meta {
  white-space: nowrap;
  opacity: 0.7;
}

.create-quiz__file-remove {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  font-size: 22px;
  line-height: 1;
  color: var(--color-accent);
  cursor: pointer;
  padding: 0;
  transition: opacity 0.2s ease;
}

.create-quiz__file-remove:hover {
  opacity: 0.6;
}

.create-quiz__file-error {
  margin-top: 8px;
  font-size: var(--font-size-body);
  color: var(--color-accent2);
  text-align: center;
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

  .create-quiz__file-info {
    width: 100%;
    max-width: 100%;
    font-size: var(--font-size-btn-mob);
    gap: 6px;
  }

  .create-quiz__file-name {
    flex: 1 1 auto;
    min-width: 0;
    max-width: none;
  }

  .create-quiz__file-meta,
  .create-quiz__file-remove {
    flex-shrink: 0;
  }

  .create-quiz__file-error {
    font-size: var(--font-size-body-mob);
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
