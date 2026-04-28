<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  if (window.innerWidth < 768) {
    router.replace({ path: '/', query: { register: '1' } })
  }
})

const role = ref('teacher') // 'teacher' | 'student'
const fullName = ref('')
const email = ref('')
const isu = ref('')
const password = ref('')
const passwordConfirm = ref('')
const showPassword = ref(false)

const passwordHint = computed(() =>
  'Мин. 8 символов: цифры и латинские буквы'
)

const close = () => {
  router.push('/')
}

const submit = () => {
  // TODO: реальная регистрация
  console.log('register', {
    role: role.value,
    fullName: fullName.value,
    email: email.value,
    isu: isu.value,
    password: password.value,
  })
  if (role.value === 'student') {
    router.push('/student')
  } else {
    router.push('/teacher')
  }
}
</script>

<template>
  <div class="register">
    <button class="register__close" @click="close" aria-label="Закрыть">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>

    <div class="register__left">
      <div class="register__left-inner">
        <h2 class="register__headline">Присоединяйтесь к <span class="register__brand">Quizlab</span></h2>
        <p class="register__subtext">
          Тестирование стало проще. Зарегистрируйтесь и начните создавать<br>
          квизы уже сегодня
        </p>
        <div class="register__illustration">
          <img src="@/assets/images/filler4.png" alt="">
        </div>
      </div>
    </div>

    <div class="register__right">
      <div class="register__form-wrap">
        <h1 class="register__title">Регистрация</h1>

        <div class="role-tabs" role="tablist">
          <button
            type="button"
            class="role-tabs__btn"
            :class="{ 'role-tabs__btn--active': role === 'teacher' }"
            @click="role = 'teacher'"
          >Преподаватель</button>
          <button
            type="button"
            class="role-tabs__btn"
            :class="{ 'role-tabs__btn--active': role === 'student' }"
            @click="role = 'student'"
          >Студент</button>
        </div>

        <form class="register__form" @submit.prevent="submit">
          <div class="field">
            <input v-model="fullName" type="text" class="field__input" placeholder="ФИО" />
          </div>

          <div class="field">
            <input v-model="email" type="text" class="field__input" placeholder="Email" />
          </div>

          <div class="field">
            <input v-model="isu" type="text" class="field__input" placeholder="ISU" />
          </div>

          <div class="field">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="field__input field__input--with-icon"
              placeholder="Пароль"
            />
            <button
              type="button"
              class="field__toggle"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
            >
              <svg v-if="!showPassword" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 3L21 21M10.5 10.677C10.1872 10.9899 10 11.4244 10 11.9M13.5 13.323C13.1872 13.6359 12.7527 13.8 12.3 13.8M7.362 7.561C5.68 8.74 4.279 10.29 3.279 12.098C5.027 15.274 8.246 17.4 12 17.4C13.47 17.4 14.87 17.065 16.128 16.463M12 6.6C15.754 6.6 18.973 8.726 20.721 11.902C20.327 12.611 19.864 13.269 19.343 13.866" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
              <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M2 12C3.748 8.824 6.967 6.6 12 6.6C17.033 6.6 20.252 8.824 22 12C20.252 15.176 17.033 17.4 12 17.4C6.967 17.4 3.748 15.176 2 12Z" stroke="currentColor" stroke-width="1.8"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/>
              </svg>
            </button>
          </div>

          <p class="field__hint">{{ passwordHint }}</p>

          <div class="field">
            <input
              v-model="passwordConfirm"
              :type="showPassword ? 'text' : 'password'"
              class="field__input"
              placeholder="Подтверждение пароля"
            />
          </div>

          <button type="submit" class="btn btn-lg register__submit">Зарегистрироваться</button>
        </form>

        <p class="register__footer">
          Уже есть акаунт?
          <router-link to="/?login=1" class="register__link">Войти</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register {
  position: fixed;
  inset: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  z-index: 200;
  overflow: hidden;
}

.register::before {
  content: '';
  position: absolute;
  top: -200px;
  bottom: -200px;
  left: -220px;
  width: calc(50% + 280px);
  background: var(--color-primary-light);
  filter: blur(70px);
  pointer-events: none;
  z-index: 0;
}

.register__close {
  position: absolute;
  top: 24px;
  right: 32px;
  z-index: 10;
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

.register__close:hover {
  opacity: 0.6;
}

/* левая — иллюстрация и заголовок */
.register__left {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 56px 48px;
}



.register__left-inner {
  position: relative;
  z-index: 1;
  max-width: 720px;
  width: 100%;
  text-align: center;
}

.register__headline {
  font-size: var(--font-size-h1);
  font-weight: 400;
  color: var(--color-text);
  margin: 0 0 28px;
}

.register__brand {
  color: var(--color-primary);
  font-weight: 600;
}

.register__subtext {
  font-size: var(--font-size-body);
  color: var(--color-text);
  margin: 0 0 32px;
}

.register__illustration {
  display: flex;
  justify-content: center;
}

.register__illustration img {
  width: 100%;
  max-width: 680px;
  height: auto;
  display: block;
}

/* правая — светлая */
.register__right {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 56px 48px;
  overflow-y: auto;
}

.register__form-wrap {
  width: 100%;
  max-width: 460px;
}

.register__title {
  font-size: var(--font-size-h1);
  font-weight: 400;
  color: var(--color-text);
  text-align: center;
  margin: 0 0 28px;
}

/* табы */
.role-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--color-primary-light);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 24px;
}

.role-tabs__btn {
  background: none;
  border: none;
  padding: 12px 16px;
  font-family: var(--font-family);
  font-size: var(--font-size-body);
  color: var(--color-text);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.role-tabs__btn--active {
  background: var(--color-accent);
  color: var(--color-primary-dark);
}

.register__form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  position: relative;
  width: 100%;
}

.field__input {
  width: 100%;
  height: 56px;
  padding: 0 48px;
  border: 1px solid var(--color-primary);
  border-radius: 14px;
  background: var(--color-bg2);
  font-family: var(--font-family);
  font-size: var(--font-size-body);
  color: var(--color-text);
  text-align: center;
  transition: border-color 0.2s ease;
}

.field__input::placeholder {
  color: var(--color-text);
  opacity: 0.7;
}

.field__input:focus {
  border-color: var(--color-primary-dark);
  outline: none;
}

.field__toggle {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
}

.field__hint {
  font-size: var(--font-size-small);
  color: var(--color-text-light);
  text-align: center;
  margin: 0;
  margin-top: -14px;
}

.register__submit {
  margin-top: 10px;
  align-self: center;
}

.register__footer {
  font-size: var(--font-size-body);
  color: var(--color-text);
  text-align: center;
  margin-top: 20px;
}

.register__link {
  color: var(--color-text);
  text-decoration: underline;
  transition: opacity 0.2s ease;
}

.register__link:hover {
  opacity: 0.7;
}

@media (max-width: 900px) {
  .register {
    grid-template-columns: 1fr;
  }
  .register__left {
    display: none;
  }
}
</style>
