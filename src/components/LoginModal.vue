<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from './BaseModal.vue'
import { useAuth } from '@/composables/useAuth.js'

const emit = defineEmits(['close'])
const router = useRouter()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const remember = ref(false)
const error = ref('')
const isLoading = ref(false)
const submitted = ref(false)

const invalidEmail = computed(() => submitted.value && !email.value.trim())
const invalidPassword = computed(() => submitted.value && !password.value)

async function submit() {
  error.value = ''
  submitted.value = true

  if (!email.value.trim() || !password.value) {
    return
  }

  isLoading.value = true
  try {
    const user = await login({ email: email.value, password: password.value })
    emit('close')
    const home = { admin: '/admin', teacher: '/teacher', student: '/student' }
    router.push(home[user.role] || '/')
  } catch (err) {
    error.value = err.message || 'Не удалось войти'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <BaseModal @close="emit('close')">
    <h2 class="login__title">Вход</h2>

    <form class="login__form" @submit.prevent="submit">
      <div class="field">
        <input
          v-model="email"
          type="email"
          :class="['field__input', { 'field__input--invalid': invalidEmail }]"
          placeholder="Email"
        />
      </div>

      <div class="field">
        <input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          :class="['field__input', 'field__input--with-icon', { 'field__input--invalid': invalidPassword }]"
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

      <p v-if="error" class="login__error">{{ error }}</p>

      <button type="submit" class="btn btn-lg login__submit" :disabled="isLoading">
        {{ isLoading ? 'Входим…' : 'Войти' }}
      </button>

      <label class="checkbox">
        <input type="checkbox" v-model="remember" class="checkbox__input" />
        <span class="checkbox__box"></span>
        <span class="checkbox__label">Запомнить меня</span>
      </label>

      <p class="login__footer">
        Нет акаунта?
        <router-link to="/register" class="login__link" @click="emit('close')">Зарегистрироваться</router-link>
      </p>
    </form>
  </BaseModal>
</template>

<style scoped>
.login__title {
  font-size: var(--font-size-h1);
  font-weight: 400;
  color: var(--color-text);
  text-align: center;
  margin-bottom: 40px;
}

.login__form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.field {
  position: relative;
  width: 100%;
}

.field__input {
  width: 100%;
  height: 64px;
  padding: 0 56px;
  border: 1px solid var(--color-primary);
  border-radius: 16px;
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
}

.field__input--invalid,
.field__input--invalid:focus {
  border-color: var(--color-accent2);
}

.field__toggle {
  position: absolute;
  top: 50%;
  right: 20px;
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

.login__submit {
  margin-top: 12px;
}

.login__error {
  color: var(--color-accent2);
  font-size: var(--font-size-body);
  text-align: center;
  margin: 0;
}

.checkbox {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: var(--font-size-body);
  color: var(--color-text);
}

.checkbox__input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.checkbox__box {
  width: 22px;
  height: 22px;
  border: 2px solid var(--color-primary);
  border-radius: 6px;
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s ease;
}

.checkbox__input:checked + .checkbox__box {
  background: var(--color-primary);
}

.checkbox__input:checked + .checkbox__box::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 2px;
  width: 6px;
  height: 11px;
  border: solid var(--color-primary-light);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.login__footer {
  font-size: var(--font-size-body);
  color: var(--color-text);
  margin-top: 4px;
}

.login__link {
  color: var(--color-text);
  text-decoration: underline;
  transition: opacity 0.2s ease;
}

.login__link:hover {
  opacity: 0.7;
}

/* Мобилка */
@media (max-width: 767px) {
  .login__title {
    font-size: var(--font-size-h2-mob);
    margin-bottom: 24px;
  }

  .login__form {
    gap: 12px;
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

  .login__submit {
    margin-top: 8px;
  }

  .checkbox {
    font-size: var(--font-size-body-mob);
    gap: 8px;
  }

  .checkbox__box {
    width: 18px;
    height: 18px;
  }

  .checkbox__input:checked + .checkbox__box::after {
    left: 5px;
    top: 1px;
    width: 5px;
    height: 9px;
  }

  .login__footer {
    font-size: var(--font-size-body-mob);
    text-align: center;
  }
}
</style>
