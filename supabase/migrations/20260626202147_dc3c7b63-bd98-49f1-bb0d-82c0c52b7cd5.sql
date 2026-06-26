-- Função de purga: roda como SECURITY DEFINER (postgres) para conseguir
-- apagar de auth.users e storage.objects. Só o role `postgres` pode executar.
CREATE OR REPLACE FUNCTION public.purge_scheduled_accounts()
RETURNS TABLE(purged_user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  victim uuid;
BEGIN
  FOR victim IN
    SELECT user_id FROM public.profiles
    WHERE deletion_scheduled_at IS NOT NULL
      AND deletion_scheduled_at <= now()
  LOOP
    -- 1. Storage: apagar metadados (Supabase faz GC dos bytes)
    DELETE FROM storage.objects
    WHERE bucket_id = 'product-photos'
      AND (
        name LIKE victim::text || '/%'
        OR name LIKE 'avatars/' || victim::text || '/%'
      );

    -- 2. Dados em ordem (filhos -> pais). Use cascades onde existirem.
    DELETE FROM public.set_layers
      WHERE set_id IN (SELECT id FROM public.sets WHERE user_id = victim);
    DELETE FROM public.set_products
      WHERE set_id IN (SELECT id FROM public.sets WHERE user_id = victim)
         OR product_id IN (SELECT id FROM public.products WHERE user_id = victim);
    DELETE FROM public.set_likes
      WHERE user_id = victim
         OR set_id IN (SELECT id FROM public.sets WHERE user_id = victim);
    DELETE FROM public.user_follows
      WHERE follower_id = victim OR following_id = victim;
    DELETE FROM public.product_color_codes
      WHERE product_id IN (SELECT id FROM public.products WHERE user_id = victim);
    DELETE FROM public.purchase_history
      WHERE product_id IN (SELECT id FROM public.products WHERE user_id = victim);
    DELETE FROM public.sets WHERE user_id = victim;
    DELETE FROM public.products WHERE user_id = victim;
    DELETE FROM public.profiles WHERE user_id = victim;

    -- 3. Conta no Auth (cascateia para identities, sessions, refresh tokens)
    DELETE FROM auth.users WHERE id = victim;

    purged_user_id := victim;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Tranca a função — só o role postgres (dono) e o cron podem executar
REVOKE ALL ON FUNCTION public.purge_scheduled_accounts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purge_scheduled_accounts() FROM anon, authenticated;

-- Agendamento diário às 03h UTC
SELECT cron.unschedule('purge-scheduled-accounts-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-scheduled-accounts-daily');

SELECT cron.schedule(
  'purge-scheduled-accounts-daily',
  '0 3 * * *',
  $cron$ SELECT public.purge_scheduled_accounts(); $cron$
);