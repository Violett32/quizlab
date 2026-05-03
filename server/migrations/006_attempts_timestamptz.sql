-- started_at и finished_at храним как TIMESTAMPTZ — иначе pg-драйвер JS
-- интерпретирует TIMESTAMP без TZ как локальное время процесса, теряя смещение от UTC.
-- USING ... AT TIME ZONE 'UTC' — берём существующий литерал как UTC и переводим в TIMESTAMPTZ.
ALTER TABLE attempts
  ALTER COLUMN started_at  TYPE TIMESTAMPTZ USING started_at  AT TIME ZONE 'UTC',
  ALTER COLUMN finished_at TYPE TIMESTAMPTZ USING finished_at AT TIME ZONE 'UTC';
