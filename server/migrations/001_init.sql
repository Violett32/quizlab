-- Enum types (переменные)
CREATE TYPE user_role     AS ENUM ('teacher', 'student');
CREATE TYPE quiz_status   AS ENUM ('draft', 'active', 'closed');
CREATE TYPE question_type AS ENUM ('single', 'multi', 'text');

-- Users
CREATE TABLE users (
  email    VARCHAR(255) PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  isu      CHAR(20)     NOT NULL,
  name     VARCHAR(100) NOT NULL,
  role     user_role    NOT NULL
);

-- Quizzes
CREATE TABLE quizzes (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  time_limit    INT          NOT NULL,
  status        quiz_status  NOT NULL,
  share_code    CHAR(10)     NOT NULL,
  deadline      DATE         NULL,
  teacher_email VARCHAR(255) NOT NULL REFERENCES users(email)
);

-- Questions
CREATE TABLE questions (
  id          SERIAL PRIMARY KEY,
  type        question_type NOT NULL,
  text        TEXT          NOT NULL,
  order_index INT           NOT NULL,
  points      INT           NOT NULL,
  quiz_id     INT           NOT NULL REFERENCES quizzes(id)
);

-- Answer options (для вопросов с одним и несколькими вариантами ответа)
CREATE TABLE answer_options (
  id          SERIAL PRIMARY KEY,
  text        VARCHAR(500) NOT NULL,
  is_correct  BOOLEAN      NOT NULL,
  order_index INT          NOT NULL,
  question_id INT          NOT NULL REFERENCES questions(id)
);

-- Attempts 
CREATE TABLE attempts (
  id            SERIAL PRIMARY KEY,
  started_at    TIMESTAMP    NOT NULL,
  finished_at   TIMESTAMP    NOT NULL,
  score         INT          NULL,
  is_completed  BOOLEAN      NOT NULL,
  quiz_id       INT          NOT NULL REFERENCES quizzes(id),
  student_email VARCHAR(255) NOT NULL REFERENCES users(email)
);

-- Student answers 
CREATE TABLE student_answers (
  id          SERIAL PRIMARY KEY,
  text_answer TEXT    NULL,
  is_correct  BOOLEAN NULL,
  attempt_id  INT     NOT NULL REFERENCES attempts(id),
  question_id INT     NOT NULL REFERENCES questions(id)
);

-- Selected options (какие варианты ответа выбрал студент в вопросе с одним/несколькими ответами)
-- Составной первичный ключ: один ответ студента может включать несколько вариантов,
-- пара (ответ, вариант) должна встречаться не более одного раза.
CREATE TABLE selected_options (
  student_answer_id INT NOT NULL REFERENCES student_answers(id),
  option_id         INT NOT NULL REFERENCES answer_options(id),
  PRIMARY KEY (student_answer_id, option_id)
);
