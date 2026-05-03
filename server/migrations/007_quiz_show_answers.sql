-- Разрешает ли учитель студентам видеть правильные ответы после прохождения.
-- По умолчанию false — безопасное поведение для уже существующих квизов.
ALTER TABLE quizzes
  ADD COLUMN show_answers BOOLEAN NOT NULL DEFAULT false;
