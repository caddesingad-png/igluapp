-- Add monthly_budget column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monthly_budget numeric DEFAULT NULL;
