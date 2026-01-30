import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Blocklist of disposable email domains
const DISPOSABLE_DOMAINS = [
  "tempmail.com", "throwaway.email", "guerrillamail.com", "mailinator.com",
  "10minutemail.com", "temp-mail.org", "fakeinbox.com", "trashmail.com",
  "getnada.com", "maildrop.cc", "dispostable.com", "yopmail.com",
  "sharklasers.com", "guerrillamailblock.com", "pokemail.net", "spam4.me",
  "grr.la", "guerrillamail.info", "guerrillamail.biz", "guerrillamail.de",
  "guerrillamail.net", "guerrillamail.org", "emailondeck.com", "tempail.com",
  "tempr.email", "discard.email", "mailnesia.com", "spamgourmet.com",
  "mytrashmail.com", "mt2009.com", "thankyou2010.com", "trash2009.com",
  "mt2014.com", "tempinbox.com", "tempmailaddress.com", "tempmails.net"
];

interface SendCodeRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: SendCodeRequest = await req.json();
    const normalizedEmail = email.trim().toLowerCase();

    // Extract domain from email
    const domain = normalizedEmail.split("@")[1];

    // Check for disposable email domains
    if (DISPOSABLE_DOMAINS.includes(domain)) {
      console.error("Disposable email domain blocked:", domain);
      return new Response(
        JSON.stringify({ error: "Disposable email addresses are not allowed. Please use your student email." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format: 6 digits + @student.ue.wroc.pl
    const emailRegex = /^\d{6}@student\.ue\.wroc\.pl$/;
    if (!emailRegex.test(normalizedEmail)) {
      console.error("Invalid email format:", normalizedEmail);
      return new Response(
        JSON.stringify({ error: "Email must be in format: 123456@student.ue.wroc.pl" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    console.log("Generated verification code for:", normalizedEmail);

    // Store in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already exists with this email
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(u => u.email?.toLowerCase() === normalizedEmail);
    
    if (userExists) {
      console.log("User already registered:", normalizedEmail);
      return new Response(
        JSON.stringify({ error: "An account with this email already exists. Please log in instead." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Invalidate any previous codes for this email
    await supabase
      .from("email_verifications")
      .delete()
      .eq("email", normalizedEmail)
      .eq("verified", false);

    // Insert new code
    const { error: dbError } = await supabase.from("email_verifications").insert({
      email: normalizedEmail,
      code,
      expires_at: expiresAt.toISOString(),
    });

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to store verification code" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email using Resend REST API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Verification <onboarding@resend.dev>",
        to: [normalizedEmail],
        subject: "Your Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center;">Verification Code</h1>
            <p style="color: #666; text-align: center; font-size: 16px;">
              Your verification code is:
            </p>
            <div style="background-color: #f4f4f4; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${code}</span>
            </div>
            <p style="color: #999; text-align: center; font-size: 14px;">
              This code will expire in 5 minutes.
            </p>
            <p style="color: #999; text-align: center; font-size: 12px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
        `,
      }),
    });

    // DEV MODE: If Resend fails due to domain verification, still return success with code for testing
    // REMOVE THIS IN PRODUCTION!
    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      
      // For development: return success with code visible (REMOVE IN PRODUCTION)
      console.log("DEV MODE: Returning code for testing:", code);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Verification code sent",
          // DEV ONLY - remove this line in production
          devCode: code 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, message: "Verification code sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-verification-code function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
