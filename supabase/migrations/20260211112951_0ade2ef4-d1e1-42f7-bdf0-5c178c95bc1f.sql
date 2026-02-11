-- Update listings SELECT policy to also allow viewing sold listings that are part of user's orders
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;

CREATE POLICY "Users can view relevant listings"
ON public.listings
FOR SELECT
USING (
  status = 'active' 
  OR auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.listing_id = listings.id 
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
  )
);