-- Allow owners to see their own listings regardless of status
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;

CREATE POLICY "Anyone can view active listings"
ON public.listings
FOR SELECT
USING (status = 'active' OR auth.uid() = user_id);