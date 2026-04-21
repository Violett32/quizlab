<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ResultItem from '@/components/ResultItem.vue'
import QuizCard from '@/components/QuizCard.vue'

const router = useRouter()

// TODO: заменить на данные из БД
const user = ref({
  name: 'Бореева Виолетта',
  email: 'boreevaviola@gmail.com',
  isu: '367910',
  avatar: null
})

const quizCode = ref('')

const results = ref([
  { title: 'Знание языка Java', duration: '10:34', score: '78/100' },
  { title: 'Знание языка Java', duration: '22:04', score: '10/100' },
  { title: 'Алгоритмы и структуры данных', duration: '42:56', score: '64/100' },
  { title: 'Информатика', duration: '24:10', score: '85/100' },
  { title: 'Операционные системы', duration: '18:30', score: '42/100' },
  { title: 'Дискретная математика', duration: '32:12', score: '73/100' },
  { title: 'Информатика', duration: '24:10', score: '12/100' },
  { title: 'Алгоритмы и структуры данных', duration: '42:56', score: '55/100' }
])

const quizzes = ref([
  { id: 1, title: 'Знание языка Java', questions: 100, duration: '30 минут', openUntil: '10.08.26', status: 'open' },
  { id: 2, title: 'Информационная безопасность', questions: 80, duration: '20 минут', openUntil: '05.08.26', status: 'closed' },
  { id: 3, title: 'Основы разработки', questions: 60, duration: '25 минут', openUntil: '12.08.26', status: 'open' },
  { id: 4, title: 'Алгоритмы и структуры данных', questions: 120, duration: '40 минут', openUntil: '20.08.26', status: 'closed' }
])

const joinQuiz = () => {
  // Заглушка: любой код открывает демо-квиз
  router.push('/quiz/1')
}

const logout = () => {
  // TODO: реальный logout
  console.log('logout')
}
</script>

<template>
  <div class="student">
    <section class="join-bar">
      <form class="join-bar__form" @submit.prevent="joinQuiz">
        <label class="join-bar__label">Для участия введите код</label>
        <input
          v-model="quizCode"
          type="text"
          class="join-bar__input"
          placeholder="Например: 123456"
        />
        <button type="submit" class="join-bar__submit" aria-label="Отправить">
          <img src="@/assets/icons/arrow.svg" alt="" class="join-bar__arrow">
        </button>
      </form>
    </section>

    <section class="profile-hero">
      <img src="@/assets/images/hero-bg.png" alt="" class="profile-hero__bg">
      <div class="profile-hero__content">
        <div class="profile__photo">
          <img v-if="user.avatar" :src="user.avatar" alt="" class="profile__photo-img">
          <img v-else src="@/assets/icons/add.svg" alt="" class="profile__photo-add">
        </div>
        <h2 class="profile__name">{{ user.name }}</h2>
        <p class="profile__email">{{ user.email }}</p>
        <div class="profile__role-id">
          <span>Студент</span>
          <span>{{ user.isu }}</span>
        </div>
        <button type="button" class="btn btn-lg profile__logout" @click="logout">Выйти</button>
      </div>
    </section>

    <section class="columns container">
      <div class="column">
        <h3 class="column__title">Мои результаты</h3>
        <p class="column__desc">Отслеживайте свой прогресс: результаты, время прохождения и подробная статистика по каждому квизу.</p>
        <div class="column__list">
          <ResultItem
            v-for="(r, i) in results"
            :key="i"
            :title="r.title"
            :duration="r.duration"
            :score="r.score"
            :date="r.date"
            class="column__result-link"
            @click="router.push('/results')"
          />
        </div>
        <button type="button" class="btn btn-lg column__more" @click="router.push('/results')">Посмотреть все</button>
      </div>

      <div class="column">
        <h3 class="column__title">Пройденные квизы</h3>
        <p class="column__desc">Список всех квизов, которые вы проходили. Доступные можно пройти повторно.</p>
        <div class="column__grid">
          <QuizCard
            v-for="q in quizzes"
            :key="q.id"
            :title="q.title"
            :questions="q.questions"
            :duration="q.duration"
            :open-until="q.openUntil"
            :status="q.status"
            class="column__quiz-link"
            @click="router.push('/quizzes')"
          />
        </div>
        <button type="button" class="btn btn-lg column__more" @click="router.push('/quizzes')">Посмотреть все</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.student {
  padding-top: 0;
}

/* Оранжевая полоса с кодом */
.join-bar {
  height: 170px;
  background: var(--color-accent);
  display: flex;
  align-items: flex-end;
}

.join-bar__form {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px 20px;
  width: 100%;
}

.join-bar__label {
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--color-primary-dark);
  white-space: nowrap;
}

.join-bar__input {
  width: 100%;
  max-width: 400px;
  height: 48px;
  padding: 0 24px;
  border: none;
  border-radius: 12px;
  background: var(--color-primary-light);
  font-family: var(--font-family);
  font-size: var(--font-size-body);
  color: var(--color-text);
  text-align: center;
}

.join-bar__input::placeholder {
  color: var(--color-text-light);
}

.join-bar__submit {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.join-bar__submit:hover {
  opacity: 0.6;
}

.join-bar__arrow {
  width: 48px;
  height: 48px;
}

/* Секция профиля с hero-bg */
.profile-hero {
  position: relative;
  width: 1237px;
  margin: 40px auto 60px;
  border-radius: 20px;
  overflow: hidden;
}

.profile-hero__bg {
  width: 100%;
  display: block;
}

.profile-hero__content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
}

.profile__photo {
  width: 320px;
  height: 320px;
  border-radius: 20px;
  background: var(--color-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.profile__photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 20px;
}

.profile__photo-add {
  width: 210px;
  height: 210px;
  color: var(--color-primary-dark);
}

.profile__name {
  font-size: var(--font-size-h1);
  font-weight: 400;
  color: var(--color-bg2);
  margin: 0;
}

.profile__email {
  font-size: var(--font-size-body);
  color: var(--color-bg2);
  margin: 0;
}

.profile__role-id {
  display: flex;
  gap: 12px;
  font-size: var(--font-size-body);
  color: var(--color-bg2);
}

.profile__logout {
  margin-top: 12px;
}

/* Две колонки с результатами и квизами */
.columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  padding-bottom: var(--padding-section);
}

.column {
  display: flex;
  flex-direction: column;
}

.column__title {
  font-size: var(--font-size-h2);
  font-weight: 400;
  color: var(--color-text);
  text-align: center;
  margin: 0 0 12px;
}

.column__desc {
  font-size: var(--font-size-body);
  color: var(--color-text-light);
  text-align: center;
  margin: 0 0 20px;
}

.column__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.column__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.column__more {
  align-self: center;
}

.column__result-link,
.column__quiz-link {
  cursor: pointer;
}

@media (max-width: 900px) {
  .columns {
    grid-template-columns: 1fr;
  }
  .column__grid {
    grid-template-columns: 1fr;
  }
}

/* Мобилка */
@media (max-width: 767px) {
  .join-bar {
    height: auto;
    padding: calc(75px + var(--padding-page-top-mob)) 20px 20px;
    align-items: stretch;
  }

  .join-bar__form {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
    gap: 12px 8px;
    padding: 0;
    max-width: none;
  }

  .join-bar__label {
    grid-column: 1 / -1;
    grid-row: 1;
    font-size: var(--font-size-h3-mob);
    white-space: normal;
    text-align: center;
  }

  .join-bar__input {
    grid-column: 1;
    grid-row: 2;
    max-width: none;
    height: 44px;
    font-size: var(--font-size-body-mob);
  }

  .join-bar__submit {
    grid-column: 2;
    grid-row: 2;
    width: 44px;
    height: 44px;
  }

  .join-bar__arrow {
    width: 36px;
    height: 36px;
  }

  .profile-hero {
    width: auto;
    margin: 20px 20px 32px;
  }

  .profile-hero__content {
    padding: 24px 20px;
    gap: 4px;
    position: relative;
    inset: auto;
    z-index: 1;
  }

  .profile-hero__bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
  }

  .profile__photo {
    width: 220px;
    height: 220px;
  }

  .profile__photo-add {
    width: 120px;
    height: 120px;
  }

  .profile__name {
    font-size: var(--font-size-h2-mob);
  }

  .profile__email {
    font-size: var(--font-size-body-mob);
  }

  .profile__role-id {
    font-size: var(--font-size-body-mob);
  }

  .profile__logout {
    margin-top: 16px;
  }

  .columns {
    padding: 0 20px var(--padding-section-mob);
    gap: 32px;
  }

  .column__title {
    font-size: var(--font-size-h1-mob);
  }

  .column__desc {
    font-size: var(--font-size-body-mob);
  }

  .column__list,
  .column__grid {
    gap: 8px;
  }
}
</style>
