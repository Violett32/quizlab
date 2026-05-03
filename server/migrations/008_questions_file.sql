-- Опциональный файл, прикреплённый к вопросу. Храним прямо в БД — просто и без папок на диске.
-- file_data — байты файла.
-- file_name — оригинальное имя для отображения и скачивания.
-- file_mime — MIME-тип, чтобы при отдаче выставить правильный Content-Type.
-- file_size — размер в байтах для UI и проверки лимита.
ALTER TABLE questions
  ADD COLUMN file_data BYTEA        NULL,
  ADD COLUMN file_name VARCHAR(255) NULL,
  ADD COLUMN file_mime VARCHAR(100) NULL,
  ADD COLUMN file_size INT          NULL;
