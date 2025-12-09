-- Create table to store email verification codes
CREATE TABLE public.email_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Public insert policy (anyone can request verification)
CREATE POLICY "Anyone can insert verification codes"
ON public.email_verifications
FOR INSERT
WITH CHECK (true);

-- Public select policy for checking codes
CREATE POLICY "Anyone can check verification codes"
ON public.email_verifications
FOR SELECT
USING (true);

-- Public update policy for marking as verified
CREATE POLICY "Anyone can update verification status"
ON public.email_verifications
FOR UPDATE
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_email_verifications_email_code ON public.email_verifications(email, code);

-- Auto-cleanup old verification codes (optional trigger)
CREATE OR REPLACE FUNCTION public.cleanup_expired_verifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.email_verifications 
  WHERE expires_at < now() - interval '1 hour';
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_old_verifications
AFTER INSERT ON public.email_verifications
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_verifications();