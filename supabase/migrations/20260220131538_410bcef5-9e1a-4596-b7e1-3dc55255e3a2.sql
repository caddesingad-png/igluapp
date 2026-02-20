
-- Remove a política pública de SELECT na tabela user_follows
DROP POLICY IF EXISTS "Anyone can view follows" ON public.user_follows;

-- Adiciona política que só permite usuários autenticados verem conexões
-- onde eles são o seguidor ou o seguido
CREATE POLICY "Authenticated users can view relevant follows"
ON public.user_follows
FOR SELECT
TO authenticated
USING (
  auth.uid() = follower_id OR auth.uid() = following_id
);
