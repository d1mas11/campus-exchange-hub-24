import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckVerificationRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: CheckVerificationRequest = await req.json();
    const normalizedEmail = email.trim().toLowerCase();

    console.log("Checking verification status for:", normalizedEmail);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email is verified and not expired
    const { data: verification, error: fetchError } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("verified", true)
      .maybeSingle();

    if (fetchError) {
      console.error("Database error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to check verification status" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!verification) {
      console.log("Email not verified:", normalizedEmail);
      return new Response(
        JSON.stringify({ verified: false, message: "Email not verified" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if verification is still valid (within 15 minutes of being verified)
    const verifiedAt = new Date(verification.created_at);
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    if (verifiedAt < fifteenMinutesAgo) {
      console.log("Verification expired for:", normalizedEmail);
      // Delete expired verification
      await supabase
        .from("email_verifications")
        .delete()
        .eq("id", verification.id);
        
      return new Response(
        JSON.stringify({ verified: false, message: "Verification has expired. Please verify again.", expired: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email verified and valid:", normalizedEmail);

    return new Response(
      JSON.stringify({ verified: true, message: "Email is verified" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in check-verification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
