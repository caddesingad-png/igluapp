
-- Create set_layers table
CREATE TABLE public.set_layers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  set_id uuid NOT NULL REFERENCES public.sets(id) ON DELETE CASCADE,
  layer_order integer NOT NULL CHECK (layer_order BETWEEN 1 AND 9),
  layer_name text NOT NULL,
  layer_icon text NOT NULL,
  product_ids text[] NOT NULL DEFAULT '{}',
  note text CHECK (char_length(note) <= 200),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (set_id, layer_order)
);

-- Enable RLS
ALTER TABLE public.set_layers ENABLE ROW LEVEL SECURITY;

-- Owners can manage their own layers
CREATE POLICY "Users can view their own set layers"
  ON public.set_layers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sets
      WHERE sets.id = set_layers.set_id
        AND sets.user_id = auth.uid()
    )
  );

-- Public sets: anyone can read layers
CREATE POLICY "Public set layers are viewable by anyone"
  ON public.set_layers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sets
      WHERE sets.id = set_layers.set_id
        AND sets.is_public = true
    )
  );

CREATE POLICY "Users can insert their own set layers"
  ON public.set_layers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sets
      WHERE sets.id = set_layers.set_id
        AND sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own set layers"
  ON public.set_layers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sets
      WHERE sets.id = set_layers.set_id
        AND sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own set layers"
  ON public.set_layers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sets
      WHERE sets.id = set_layers.set_id
        AND sets.user_id = auth.uid()
    )
  );
