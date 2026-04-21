<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LoginModal from '@/components/LoginModal.vue'
import RegisterModal from '@/components/RegisterModal.vue'

const route = useRoute()
const router = useRouter()
const showLogin = ref(false)
const showRegister = ref(false)

const syncFromQuery = () => {
  if (route.query.login) showLogin.value = true
  if (route.query.register) showRegister.value = true
}

onMounted(syncFromQuery)
watch(() => route.query.login, syncFromQuery)
watch(() => route.query.register, syncFromQuery)

const closeLogin = () => {
  showLogin.value = false
  if (route.query.login) {
    const { login, ...rest } = route.query
    router.replace({ query: rest })
  }
}

const closeRegister = () => {
  showRegister.value = false
  if (route.query.register) {
    const { register, ...rest } = route.query
    router.replace({ query: rest })
  }
}

const switchToLogin = () => {
  closeRegister()
  showLogin.value = true
}

</script>

<template>
  <section class="hero">
    <div class="hero__bg">
      <img src="@/assets/images/hero-bg.png" alt="" class="hero__bg-img">
    </div>
    <div class="hero__content">
      <h1 class="hero__title">Создавайте квизы<br class="hero__title-br-mob">за минуту — проверяйте<br>знания мгновенно!</h1>
      <div class="stats">
        <div class="stats__item">
          <span class="stats__number">3</span>
          <span class="stats__label">типа вопросов</span>
        </div>
        <div class="stats__item">
          <span class="stats__number">100%</span>
          <span class="stats__label">автоматическая проверка</span>
        </div>
        <div class="stats__item">
          <span class="stats__number">3</span>
          <span class="stats__label">шага до старта</span>
        </div>
      </div>
    </div>
  </section>

  <section class="cta">
    <div class="container cta__inner">
      <button type="button" class="btn btn-lg" @click="showLogin = true">Вход</button>
      <router-link to="/register" class="btn btn-lg">Регистрация</router-link>
    </div>
  </section>

  <section class="about">
    <div class="container">
      <h2 class="about__title">О проекте</h2>
      <p class="about__text">
        QuizLab — это конструктор онлайн-квизов для быстрого тестирования знаний.
        Сервис создан, чтобы упростить преподавателям проверку знаний студентов —
        без бумажных тестов, ручной проверки и долгого ожидания результатов.
        Всё что нужно — создать квиз, отправить код студентам и получить готовые результаты.
      </p>

      <div class="features">
        <div class="feature-card">
          <div class="feature-card__img">
            <img src="@/assets/images/filler1.png" alt="Создайте квиз">
          </div>
          <h3 class="feature-card__title">Создайте квиз</h3>
          <p class="feature-card__text">Добавьте вопросы, выберите один<br>из четырёх типов</p>
        </div>
        <div class="feature-card">
          <div class="feature-card__img">
            <img src="@/assets/images/filler2.png" alt="Поделитесь кодом">
          </div>
          <h3 class="feature-card__title">Поделитесь кодом</h3>
          <p class="feature-card__text">Студенты приступят к прохождению теста</p>
        </div>
        <div class="feature-card">
          <div class="feature-card__img">
            <img src="@/assets/images/filler3.png" alt="Смотрите результаты">
          </div>
          <h3 class="feature-card__title">Смотрите результаты</h3>
          <p class="feature-card__text">Баллы, время прохождения — всё в одном месте</p>
        </div>
      </div>
    </div>
  </section>

  <LoginModal v-if="showLogin" @close="closeLogin" />
  <RegisterModal v-if="showRegister" @close="closeRegister" @switch-to-login="switchToLogin" />
</template>

<style scoped>
/* герой — фон во всю ширину, хедер поверх него */
.hero {
  position: relative;
  text-align: center;
  margin-left: -50vw;
  margin-right: -50vw;
  left: 50%;
  right: 50%;
  width: 100vw;
  max-width: 100vw;
  max-height: 740px;
  overflow: hidden;
  border-radius: 0 0 24px 24px;
  padding-top: 100px;
}

.hero__bg {
  width: 100%;
}

.hero__bg-img {
  width: calc(100% + 50px);
  max-width: none;
  height: auto;
  display: block;
  margin-top: -50px;
  margin-left: -25px;
  margin-bottom: -70px;
}

/* контент поверх фоновой картинки */
.hero__content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 160px; /* отступ под хедер */
}

.hero__title {
  font-size: var(--font-size-h1);
  font-weight: 400;
  color: var(--color-primary-light);
  margin: 0 0 100px;
}

.hero__title-br-mob {
  display: none;
}

/* Stats */
.stats {
  display: flex;
  justify-content: center;
  gap: 72px;
}

.stats__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--padding-group-item);
}

.stats__number {
  font-size: var(--font-size-h1);
  font-weight: 400;
  color: var(--color-primary-light);
}

.stats__label {
  font-size: var(--font-size-h2);
  color: var(--color-text-light);
  text-align: center;
}

/* CTA */
.cta {
  padding: var(--padding-section) 0;
}

.cta__inner {
  display: flex;
  justify-content: center;
  gap: var(--padding-content-block);
}


/* About */
.about {
  padding: 0 0 var(--padding-section);
  text-align: center;
}

.about__title {
  font-size: var(--font-size-h1);
  font-weight: 400;
  color: var(--color-text);
  margin-bottom: 20px;
}

.about__text {
  font-size: var(--font-size-body);
  color: var(--color-text);
  max-width: 1030px;
  margin: 0 auto 24px;
}

/* Features */
.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.feature-card {
  background: var(--color-bg2);
  border: 1px solid var(--color-primary-light);
  border-radius: 16px;
  padding: 40px 46px;
  text-align: center;
}

.feature-card__img {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.feature-card__img img {
  width: 328px;
  height: 307px;
  max-width: none;
  object-fit: contain;
}

.feature-card__title {
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--color-primary-dark);
  margin-bottom: 12px;
}

.feature-card__text {
  font-size: var(--font-size-body);
  font-weight: 400;
  color: var(--color-text);
}

/* Мобилка */
@media (max-width: 767px) {
  .hero {
    max-height: none;
    padding-top: 0;
    border-radius: 0 0 24px 24px;
    background: var(--color-primary-dark);
  }

  .hero__bg {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  .hero__bg-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    margin: 0;
  }

  .hero__content {
    position: relative;
    z-index: 1;
    padding: calc(75px + var(--padding-page-top-mob)) 20px 36px;
    justify-content: flex-start;
  }

  .hero__title {
    font-size: var(--font-size-h2-mob);
    margin: 0 0 var(--padding-content-block-mob);
  }

  .hero__title-br-mob {
    display: inline;
  }

  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--padding-content-block-mob);
    width: 100%;
  }

  .stats__item:nth-child(1) { grid-column: 1; grid-row: 1; }
  .stats__item:nth-child(3) { grid-column: 2; grid-row: 1; }
  .stats__item:nth-child(2) { grid-column: 1 / -1; grid-row: 2; }

  .stats__item {
    gap: var(--padding-header-content-mob);
  }

  .stats__number {
    font-size: var(--font-size-h1-mob);
  }

  .stats__label {
    font-size: var(--font-size-body-mob);
  }

  .cta {
    padding: var(--padding-section-mob) 0;
  }

  .cta__inner {
    flex-direction: column;
    gap: var(--padding-group-item-mob);
    align-items: center;
  }

  .about {
    padding: 0;
  }

  .about__title {
    font-size: var(--font-size-h1-mob);
    margin-bottom: var(--padding-header-content-mob);
  }

  .about__text {
    font-size: var(--font-size-body-mob);
    margin-bottom: var(--padding-content-block-mob);
  }

  .features {
    grid-template-columns: 1fr;
    gap: var(--padding-group-item-mob);
  }

  .feature-card {
    padding: 24px 20px;
  }

  .feature-card__img img {
    width: 100%;
    height: auto;
    max-width: 280px;
  }

  .feature-card__title {
    font-size: var(--font-size-h3-mob);
  }

  .feature-card__text {
    font-size: var(--font-size-body-mob);
  }

  .feature-card__text br {
    display: none;
  }
}
</style>
