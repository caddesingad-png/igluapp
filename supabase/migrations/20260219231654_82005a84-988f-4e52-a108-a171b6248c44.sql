
CREATE TABLE public.purchase_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  price NUMERIC NOT NULL,
  color_code TEXT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  store TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchase history"
  ON public.purchase_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchase history"
  ON public.purchase_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase history"
  ON public.purchase_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase history"
  ON public.purchase_history FOR DELETE
  USING (auth.uid() = user_id);
