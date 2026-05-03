-- У черновика квиза кода ещё нет — он генерируется при публикации.
ALTER TABLE quizzes
  ALTER COLUMN share_code DROP NOT NULL;

-- Проходной балл (из 100). UI его собирает — а в схеме поля не было.
ALTER TABLE quizzes
  ADD COLUMN passing_score INT NOT NULL;
