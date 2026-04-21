<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from './BaseModal.vue'

const router = useRouter()
const emit = defineEmits(['close', 'switch-to-login'])

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

const submit = () => {
  // TODO: реальная регистрация
  console.log('register', {
    role: role.value,
    fullName: fullName.value,
    email: email.value,
    isu: isu.value,
    password: password.value,
  })
  emit('close')
  if (role.value === 'student') {
    router.push('/student')
  } else {
    router.push('/teacher')
  }
}
</script>

<template>
  <BaseModal @close="emit('close')">
    <h2 class="register__title">Регистрация</h2>

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
          placeholder="Повторите пароль"
        />
      </div>

      <button type="submit" class="btn btn-lg register__submit">Зарегистрироваться</button>
    </form>

    <p class="register__footer">
      Уже есть акаунт?
      <a href="#" class="register__link" @click.prevent="emit('switch-to-login')">Войти</a>
    </p>
  </BaseModal>
</template>

<style scoped>
.register__title {
  font-size: var(--font-size-h1);
  font-weight: 400;
  color: var(--color-text);
  text-align: center;
  margin: 0 0 28px;
}

.role-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--color-primary-light);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 20px;
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
  margin-top: -8px;
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

/* Мобилка */
@media (max-width: 767px) {
  .register__title {
    font-size: var(--font-size-h2-mob);
    margin-bottom: 20px;
  }

  .role-tabs__btn {
    font-size: var(--font-size-body-mob);
    padding: 8px 12px;
  }

  .register__form {
    gap: 10px;
  }

  .field__input {
    height: 48px;
    padding: 0 40px;
    border-radius: 12px;
    font-size: var(--font-size-body-mob);
  }

  .field__toggle svg {
    width: 20px;
    height: 20px;
  }

  .field__hint {
    font-size: var(--font-size-small);
  }

  .register__submit {
    margin-top: 8px;
  }

  .register__footer {
    font-size: var(--font-size-body-mob);
  }
}
</style>
