import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyCodeRequest {
  email: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code }: VerifyCodeRequest = await req.json();
    const normalizedEmail = email.trim().toLowerCase();

    console.log("Verifying code for:", normalizedEmail);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if already verified (prevent reuse)
    const { data: alreadyVerified } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("verified", true)
      .maybeSingle();

    if (alreadyVerified) {
      console.log("Email already verified:", normalizedEmail);
      return new Response(
        JSON.stringify({ valid: true, message: "Email already verified", alreadyVerified: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Find the verification record
    const { data: verification, error: fetchError } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("code", code)
      .eq("verified", false)
      .maybeSingle();

    if (fetchError) {
      console.error("Database error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to verify code" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!verification) {
      console.log("Invalid code for:", normalizedEmail);
      return new Response(
        JSON.stringify({ error: "Invalid verification code", valid: false }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if expired
    const expiresAt = new Date(verification.expires_at);
    if (expiresAt < new Date()) {
      console.log("Code expired for:", normalizedEmail);
      // Delete expired code
      await supabase
        .from("email_verifications")
        .delete()
        .eq("id", verification.id);
        
      return new Response(
        JSON.stringify({ error: "Verification code has expired. Please request a new one.", valid: false, expired: true }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark as verified
    const { error: updateError } = await supabase
      .from("email_verifications")
      .update({ verified: true })
      .eq("id", verification.id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update verification status" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Code verified successfully for:", normalizedEmail);

    return new Response(
      JSON.stringify({ valid: true, message: "Code verified successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-code function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
