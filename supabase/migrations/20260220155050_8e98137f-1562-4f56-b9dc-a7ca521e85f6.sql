-- Enable RLS on profiles_public view and allow public read access
-- Since profiles_public is a view (not a table), we can't add RLS directly
-- Instead, we need to ensure the underlying profiles table allows reads via the view

-- Drop the existing restrictive SELECT policy on profiles if it blocks view access
-- and replace with one that also allows reading via the view

-- The profiles_public view uses security_invoker or security_definer
-- Let's check and recreate the view with proper access

-- First, recreate profiles_public as a security definer view so it bypasses RLS
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = false) AS
  SELECT
    id,
    user_id,
    display_name,
    avatar_url,
    bio,
    onboarding_completed,
    created_at,
    updated_at
  FROM public.profiles;

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.profiles_public TO anon;
GRANT SELECT ON public.profiles_public TO authenticated;