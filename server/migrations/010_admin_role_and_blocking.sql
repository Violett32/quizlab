-- Роль администратора и флаг блокировки пользователей.
-- 'admin' назначается вручную: UPDATE users SET role='admin' WHERE email='...';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';

ALTER TABLE users
  ADD COLUMN is_blocked BOOLEAN NOT NULL DEFAULT FALSE;
