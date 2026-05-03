-- Меняем deadline с DATE на TIMESTAMPTZ — теперь там и дата, и время с таймзоной.
-- USING deadline::timestamptz конвертирует уже существующие записи (станут полночью).
ALTER TABLE quizzes
  ALTER COLUMN deadline TYPE TIMESTAMPTZ USING deadline::timestamptz;
