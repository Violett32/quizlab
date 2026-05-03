-- Разрешаем finished_at быть NULL, пока попытка не завершена 
ALTER TABLE attempts
  ALTER COLUMN finished_at DROP NOT NULL;

-- Код для входа 6 символов
ALTER TABLE quizzes
  ALTER COLUMN share_code TYPE CHAR(6);

-- У каждого квиза должен быть уникальный код 
ALTER TABLE quizzes
  ADD CONSTRAINT quizzes_share_code_unique UNIQUE (share_code);
