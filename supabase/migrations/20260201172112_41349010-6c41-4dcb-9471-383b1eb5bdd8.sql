-- Add foreign key relationship between listings.user_id and profiles.user_id
-- First, we need to ensure profiles.user_id is unique (it should be based on schema)
ALTER TABLE public.listings
ADD CONSTRAINT listings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

-- Update profiles RLS to allow anyone to view profiles (needed for seller info on listings)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Anyone can view profiles"
ON public.profiles
FOR SELECT
USING (true);