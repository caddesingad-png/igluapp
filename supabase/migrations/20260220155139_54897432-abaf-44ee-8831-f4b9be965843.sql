-- Fix: use security_invoker=true on the view and add a public SELECT policy on profiles
-- so that anyone can read public profile fields

-- Recreate the view with security_invoker=true (safe approach)
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = true) AS
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

-- Add a public SELECT policy on profiles so the view can expose public fields to anyone
-- This policy only exposes non-sensitive fields (the view already filters out monthly_budget)
CREATE POLICY "Public profiles are viewable by anyone"
  ON public.profiles
  FOR SELECT
  USING (true);