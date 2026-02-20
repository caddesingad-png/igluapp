
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sort_order integer;

-- Inicializar a ordem com base na data de criação para produtos existentes
WITH ordered AS (
  SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY created_at ASC) AS rn
  FROM public.products
)
UPDATE public.products p
SET sort_order = o.rn
FROM ordered o
WHERE p.id = o.id;
