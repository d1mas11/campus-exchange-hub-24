-- Allow buyers to update listing status to 'sold' when they create an order
DROP POLICY IF EXISTS "Users can update their own listings" ON public.listings;

CREATE POLICY "Users can update their own listings"
ON public.listings
FOR UPDATE
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.listing_id = listings.id 
    AND orders.buyer_id = auth.uid()
  )
);

-- Also fix the existing data: mark listings with orders as sold
UPDATE public.listings 
SET status = 'sold' 
WHERE id IN (SELECT listing_id FROM public.orders) 
AND status = 'active';