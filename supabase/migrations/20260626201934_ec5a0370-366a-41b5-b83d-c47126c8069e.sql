-- 1. Coluna de agendamento de exclusão
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deletion_scheduled_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_deletion_scheduled_at
  ON public.profiles (deletion_scheduled_at)
  WHERE deletion_scheduled_at IS NOT NULL;

-- 2. Extensões para o cron job
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;