<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  role: {
    type: String,
    default: 'teacher' // 'guest'  'student'  'teacher'
  }
})

// Куда вести по клику на лого: гость — лендинг, иначе — домашняя по роли.
const logoTarget = computed(() => {
  if (props.role === 'teacher') return '/teacher'
  if (props.role === 'student') return '/student'
  return '/'
})

const emit = defineEmits(['create'])
const menuOpen = ref(false)
const route = useRoute()

const openMenu = () => { menuOpen.value = true }
const closeMenu = () => { menuOpen.value = false }

const onCreate = () => {
  closeMenu()
  emit('create')
}

watch(() => route.fullPath, closeMenu)
</script>

<template>
  <header class="header" :class="{ 'header--guest': role === 'guest' }">
    <div class="container header__inner">
      <router-link :to="logoTarget" class="logo">
        <img src="@/assets/images/logo.svg" alt="КвизЛаб">
      </router-link>

      <nav v-if="role !== 'guest'" class="nav">
        <router-link :to="role === 'teacher' ? '/teacher/quizzes' : '/quizzes'" class="nav__link">Квизы</router-link>
        <router-link :to="role === 'teacher' ? '/teacher/results' : '/results'" class="nav__link">Результаты</router-link>
      </nav>

      <button v-if="role === 'teacher'" type="button" class="btn btn-sm btn-sm--inv header__create" @click="emit('create')">
        <img src="@/assets/icons/add2.svg" alt="" class="header__create-icon">
        Создать
      </button>

      <button
        v-if="role !== 'guest'"
        type="button"
        class="header__burger"
        aria-label="Меню"
        @click="openMenu"
      >
        <svg viewBox="0 0 28 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
          <line x1="2" y1="3" x2="26" y2="3"/>
          <line x1="2" y1="10" x2="26" y2="10"/>
          <line x1="2" y1="17" x2="26" y2="17"/>
        </svg>
      </button>
    </div>

    <div v-if="menuOpen" class="mobile-menu">
      <div class="mobile-menu__top">
        <router-link :to="logoTarget" class="logo mobile-menu__logo" @click="closeMenu">
          <img src="@/assets/images/logo.svg" alt="КвизЛаб">
        </router-link>
        <button type="button" class="mobile-menu__close" aria-label="Закрыть" @click="closeMenu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <line x1="5" y1="5" x2="19" y2="19"/>
            <line x1="19" y1="5" x2="5" y2="19"/>
          </svg>
        </button>
      </div>

      <nav class="mobile-menu__nav">
        <router-link
          :to="role === 'teacher' ? '/teacher/quizzes' : '/quizzes'"
          class="mobile-menu__link"
          @click="closeMenu"
        >Квизы</router-link>
        <router-link
          :to="role === 'teacher' ? '/teacher/results' : '/results'"
          class="mobile-menu__link"
          @click="closeMenu"
        >Результаты</router-link>
      </nav>

      <button
        v-if="role === 'teacher'"
        type="button"
        class="btn btn-mob mobile-menu__create"
        @click="onCreate"
      >
        <img src="@/assets/icons/add2.svg" alt="" class="mobile-menu__create-icon">
        Создать
      </button>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background: var(--color-primary-dark);
  padding: 16px 0;
  border-radius: 0 0 12px 12px;
}

.header__inner {
  display: flex;
  align-items: center;
  padding-left: 52px;
  max-width: none;
}

.logo img {
  width: 137px;
  height: 51px;
  display: block;
}

.nav {
  display: flex;
  gap: 40px;
  margin-left: 60px;
}

.nav__link {
  color: var(--color-bg2);
  font-family: var(--font-family-btn);
  font-size: var(--font-size-btn);
  font-weight: var(--font-weight-btn);
  opacity: 0.85;
  transition: opacity 0.2s ease;
}

.nav__link:hover {
  opacity: 1;
}

.nav__link.router-link-active {
  color: var(--color-text-light);
  opacity: 1;
}

.header__create {
  margin-left: auto;
  margin-right: 52px;
  gap: 12px;
  font-family: var(--font-family-btn);
  font-weight: var(--font-weight-btn);
  font-size: var(--font-size-btn);
  transition: background 0.2s ease;
}

.header__create:hover {
  background: var(--color-primary-dark);
  border: 1px solid var(--color-primary);
  color: var(--color-bg2);
}

.header__create-icon {
  width: 32px;
  height: 32px;
}

.header__burger {
  display: none;
}

.mobile-menu {
  display: none;
}

/* Мобилка */
@media (max-width: 767px) {
  .header {
    padding: 12px 0;
  }

  .header__inner {
    padding-left: 20px;
    padding-right: 20px;
    justify-content: space-between;
  }

  .header--guest .header__inner {
    justify-content: center;
  }

  .logo img {
    width: 74px;
    height: auto;
  }

  .nav,
  .header__create {
    display: none;
  }

  .header__burger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: none;
    border: none;
    padding: 0;
    color: var(--color-bg2);
  }

  .header__burger svg {
    width: 28px;
    height: 20px;
  }

  .mobile-menu {
    display: flex;
    position: fixed;
    inset: 0;
    z-index: 50;
    background: var(--color-primary-dark);
    padding: 12px 20px 32px;
    flex-direction: column;
  }

  .mobile-menu__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
  }

  .mobile-menu__logo img {
    width: 74px;
    height: auto;
  }

  .mobile-menu__close {
    width: 40px;
    height: 40px;
    background: none;
    border: none;
    padding: 0;
    color: var(--color-bg2);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .mobile-menu__close svg {
    width: 24px;
    height: 24px;
  }

  .mobile-menu__nav {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .mobile-menu__link {
    color: var(--color-bg2);
    font-size: var(--font-size-h3-mob);
    font-family: var(--font-family-btn);
    font-weight: var(--font-weight-btn);
  }

  .mobile-menu__create {
    margin-top: auto;
    align-self: center;
    gap: 8px;
  }

  .mobile-menu__create-icon {
    width: 20px;
    height: 20px;
  }
}
</style>
