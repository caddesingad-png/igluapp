
-- Restringe set_likes: usuário vê apenas seus próprios likes
-- ou likes em sets que ele possui
DROP POLICY IF EXISTS "Anyone can view set likes" ON public.set_likes;

CREATE POLICY "Users can view own likes or likes on their sets"
ON public.set_likes
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.sets
    WHERE sets.id = set_likes.set_id
      AND sets.user_id = auth.uid()
  )
);
