
-- Adiciona política de UPDATE na tabela set_products
CREATE POLICY "Users can update their own set_products"
ON public.set_products
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
