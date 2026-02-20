
-- 1. Cria view pública de perfis SEM o campo sensível monthly_budget
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT
    id,
    user_id,
    display_name,
    avatar_url,
    bio,
    onboarding_completed,
    created_at,
    updated_at
  FROM public.profiles;

-- 2. Garante que a política de SELECT restringe acesso direto à tabela:
-- Usuário só acessa a própria linha completa (incluindo monthly_budget).
-- Outros usuários só acessam via view (que exclui monthly_budget).
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view their own full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
