
-- 1. Remove a política pública de SELECT na tabela profiles
DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;

-- 2. Adiciona política que só permite usuários autenticados verem perfis
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 3. Corrige o trigger handle_new_user para NÃO salvar o email como display_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    -- Usa apenas display_name dos metadados, nunca o email
    NULLIF(NEW.raw_user_meta_data->>'display_name', '')
  );
  RETURN NEW;
END;
$function$;

-- 4. Limpa emails que foram salvos no display_name de usuários existentes
UPDATE public.profiles
SET display_name = NULL
WHERE display_name LIKE '%@%' AND display_name LIKE '%.%';
