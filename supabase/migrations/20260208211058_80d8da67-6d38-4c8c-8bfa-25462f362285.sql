
-- Add languages column to profiles table
ALTER TABLE public.profiles ADD COLUMN languages text[] DEFAULT '{English}'::text[];
