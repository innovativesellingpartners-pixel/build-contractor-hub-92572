import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    const { email, name, role } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), { status: 400, headers: corsHeaders });
    }

    // Create team member record
    const { data: member, error: insertError } = await supabase
      .from("team_members")
      .insert({
        owner_user_id: userId,
        email,
        name: name || null,
        role: role || "viewer",
        status: "invited",
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return new Response(JSON.stringify({ error: "This email has already been invited" }), { status: 409, headers: corsHeaders });
      }
      throw insertError;
    }

    // Get owner's profile for branding
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await adminClient
      .from("profiles")
      .select("contact_name, company_name")
      .eq("id", userId)
      .single();

    // Send invitation email via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const appUrl = Deno.env.get("APP_URL") || "https://myct1.com";

    if (resendKey) {
      const businessName = profile?.company_name || profile?.contact_name || "CT1";
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: Deno.env.get("EMAIL_FROM") || "CT1 <noreply@myct1.com>",
          to: [email],
          subject: `You've been invited to join ${businessName} on CT1`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
              <h2>You're Invited! 🎉</h2>
              <p><strong>${businessName}</strong> has invited you to join their team on CT1 as a <strong>${role?.replace('_', ' ') || 'team member'}</strong>.</p>
              <p>${name ? `Hi ${name},` : 'Hi,'}</p>
              <p>Sign up or log in to accept the invitation and start collaborating.</p>
              <a href="${appUrl}/auth" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">
                Accept Invitation
              </a>
              <p style="color:#888;font-size:12px;margin-top:24px;">If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true, member }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
