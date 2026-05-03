<script setup>
defineProps({
  role: {
    type: String,
    default: 'guest' // 'guest' | 'student' | 'teacher' выбор верстки футера
  }
})
</script>

<template>
  <footer class="footer">
    <div class="footer__inner">
      <div class="footer__left">
        <router-link to="/" class="footer__logo">
          <img src="@/assets/images/logo.svg" alt="КвизЛаб">
        </router-link>
        <p class="footer__desc">Конструктор онлайн-квизов для быстрого тестирования студентов</p>
        <p class="footer__copy">
          <span>Дипломная работа 2026</span>
          <span>Бореева В.</span>
        </p>
      </div>

      <div class="footer__right">
        <div class="footer__col">
          <p class="footer__heading">Контакты</p>
          <div class="footer__links">
            <a href="https://github.com" class="footer__link">Github</a>
          </div>
        </div>

        <div v-if="role !== 'guest'" class="footer__col">
          <p class="footer__heading">Навигация</p>
          <div class="footer__links">
            <router-link :to="role === 'teacher' ? '/teacher/quizzes' : '/quizzes'" class="footer__link">Квизы</router-link>
            <router-link :to="role === 'teacher' ? '/teacher/results' : '/results'" class="footer__link">Результаты</router-link>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--color-primary-dark);
  border-radius: 24px 24px 0 0;
  padding: 56px 0 48px;
  margin-top: var(--padding-section);
}

.footer__inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 48px;
  padding: 0 52px;
}

.footer__logo img {
  width: 137px;
  height: 51px;
  display: block;
  margin-bottom: 28px;
}

.footer__desc {
  color: var(--color-primary-light);
  font-size: var(--font-size-body);
  font-weight: 400;
  max-width: 430px;
  margin-bottom: 40px;
  line-height: 1.5;
}

.footer__copy {
  display: flex;
  gap: 56px;
  color: var(--color-text-light);
  font-size: var(--font-size-small);
}

.footer__right {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.footer__col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer__links {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.footer__heading {
  color: var(--color-text-light);
  font-size: var(--font-size-body);
  font-weight: 400;
  margin-bottom: 0;
}

.footer__link {
  color: var(--color-primary-light);
  font-size: var(--font-size-body);
  font-weight: 400;
  transition: opacity 0.2s ease;
}

.footer__link:hover {
  opacity: 0.75;
}

/* Мобилка */
@media (max-width: 767px) {
  .footer {
    padding: 32px 0 28px;
    margin-top: 60px;
  }

  .footer__inner {
    padding: 0 20px;
    gap: 16px;
  }

  .footer__logo img {
    width: 74px;
    height: auto;
    margin-bottom: 16px;
  }

  .footer__desc {
    font-size: var(--font-size-body-mob);
    max-width: 170px;
    margin-bottom: 24px;
  }

  .footer__copy {
    flex-direction: column;
    gap: 4px;
    font-size: var(--font-size-body-mob);
  }

  .footer__right {
    gap: 24px;
    padding-top: 67px;
  }

  .footer__heading {
    font-size: var(--font-size-body-mob);
  }

  .footer__link {
    font-size: var(--font-size-body-mob);
  }
}
</style>
