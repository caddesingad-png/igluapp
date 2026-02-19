CREATE TABLE public.product_color_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  code text NOT NULL,
  note text,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.product_color_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own color codes"
  ON public.product_color_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own color codes"
  ON public.product_color_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own color codes"
  ON public.product_color_codes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own color codes"
  ON public.product_color_codes FOR DELETE
  USING (auth.uid() = user_id);