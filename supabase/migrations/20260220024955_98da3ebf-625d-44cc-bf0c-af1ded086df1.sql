
ALTER TABLE public.purchase_history
  ADD CONSTRAINT purchase_history_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
