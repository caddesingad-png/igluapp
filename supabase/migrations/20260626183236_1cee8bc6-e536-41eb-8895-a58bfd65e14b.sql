
-- ===== Fase 1: fechar vazamento na tabela profiles =====
DROP POLICY IF EXISTS "Public profiles are viewable by anyone" ON public.profiles;
-- Mantém só a policy "Users can view their own full profile" (auth.uid() = user_id) que já existe.
-- Acesso público a display_name/avatar/bio é via view public.profiles_public.

-- ===== Fase 2: bloquear LISTING do bucket product-photos =====
-- A policy "Anyone can view product photos" usa qual=(bucket_id='product-photos') o que permite list().
-- Trocamos por leitura por chave conhecida apenas (não bloqueia getPublicUrl, mas bloqueia list/search).
DROP POLICY IF EXISTS "Anyone can view product photos" ON storage.objects;
CREATE POLICY "Public read product photos by key"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'product-photos'
  AND (
    -- Dono pode listar sua própria pasta
    (auth.uid())::text = (storage.foldername(name))[1]
    OR (storage.foldername(name))[1] = 'avatars'
    OR ((storage.foldername(name))[1] = 'sets' AND (auth.uid())::text = (storage.foldername(name))[2])
  )
);
-- Acesso público continua via URL pública direta (Supabase Storage serve por URL sem checar SELECT em storage.objects).

-- ===== Fase 4: travar EXECUTE em funções SECURITY DEFINER triggers =====
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_set_likes_count() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
