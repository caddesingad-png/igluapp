
-- Sets table
CREATE TABLE public.sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  occasion TEXT NULL,
  photo_url TEXT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;

-- Owners can do everything
CREATE POLICY "Users can view their own sets"
  ON public.sets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public sets are viewable by anyone"
  ON public.sets FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert their own sets"
  ON public.sets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sets"
  ON public.sets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sets"
  ON public.sets FOR DELETE
  USING (auth.uid() = user_id);

-- set_products join table
CREATE TABLE public.set_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  set_id UUID NOT NULL REFERENCES public.sets(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(set_id, product_id)
);

ALTER TABLE public.set_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own set_products"
  ON public.set_products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public set products are viewable by anyone"
  ON public.set_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sets s
      WHERE s.id = set_id AND s.is_public = true
    )
  );

CREATE POLICY "Users can insert their own set_products"
  ON public.set_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own set_products"
  ON public.set_products FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at trigger for sets
CREATE TRIGGER update_sets_updated_at
  BEFORE UPDATE ON public.sets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
