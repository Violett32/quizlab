-- Аватар пользователя. Храним прямо в users — простой вариант без отдельных таблиц/файлов.
-- avatar_data — байты картинки.
-- avatar_mime — MIME-тип ('image/png', 'image/jpeg' и т.п.) для data: URL и Content-Type.
ALTER TABLE users
  ADD COLUMN avatar_data BYTEA        NULL,
  ADD COLUMN avatar_mime VARCHAR(100) NULL;
