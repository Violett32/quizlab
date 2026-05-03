-- Меняем тип isu с CHAR(20) на CHAR(6) — ИСУ всегда ровно 6 цифр.
-- USING TRIM(isu) срезает пробелы у уже существующих записей,
-- иначе они не уместятся в 6 символов.
ALTER TABLE users
  ALTER COLUMN isu TYPE CHAR(6) USING TRIM(isu);
