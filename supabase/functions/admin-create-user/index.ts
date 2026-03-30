import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

import { buildCorsHeaders } from '../_shared/cors.ts';

async function sendWelcomeEmail(email: string, password: string, companyName: string | null, contactName: string | null) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const emailFrom = Deno.env.get("EMAIL_FROM") || "pwm@myct1.com";
  const appUrl = Deno.env.get("APP_URL") || "https://myct1.com";

  if (!resendApiKey) {
    console.error("RESEND_API_KEY not configured, skipping welcome email");
    return;
  }

  const displayName = contactName || companyName || "Contractor";

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#15172A;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Welcome to CT1</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;color:#333333;font-size:16px;line-height:1.6;">
                Hi ${displayName},
              </p>
              <p style="margin:0 0 20px;color:#333333;font-size:16px;line-height:1.6;">
                Your CT1 contractor account has been created. Here are your login details:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;border-radius:8px;margin:0 0 24px;border:1px solid #e9ecef;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 8px;color:#6c757d;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Email</p>
                    <p style="margin:0 0 16px;color:#15172A;font-size:16px;font-weight:600;">${email}</p>
                    <p style="margin:0 0 8px;color:#6c757d;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Temporary Password</p>
                    <p style="margin:0;color:#15172A;font-size:16px;font-weight:600;font-family:monospace;background:#e9ecef;display:inline-block;padding:4px 12px;border-radius:4px;">${password}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;color:#333333;font-size:16px;line-height:1.6;">
                For your security, please change your password immediately after logging in.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/auth" style="display:inline-block;background-color:#D50A22;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:600;">
                      Log In & Change Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;color:#6c757d;font-size:14px;line-height:1.6;text-align:center;">
                If the button doesn't work, copy and paste this URL into your browser:<br>
                <a href="${appUrl}/auth" style="color:#D50A22;">${appUrl}/auth</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fa;padding:24px 40px;border-top:1px solid #e9ecef;">
              <p style="margin:0;color:#999999;font-size:12px;text-align:center;line-height:1.5;">
                This is an automated message from CT1. Please do not reply to this email.<br>
                &copy; ${new Date().getFullYear()} CT1. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [email],
        subject: "Welcome to CT1 — Your Account Details",
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend API error:", errText);
    } else {
      console.log("Welcome email sent successfully to:", email);
    }
  } catch (err) {
    console.error("Failed to send welcome email:", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || !['admin', 'super_admin'].includes(roleData.role)) {
      throw new Error("Insufficient permissions");
    }

    // Get request body with validation
    const body = await req.json();
    const { email, password, company_name, phone, contact_name, role, tier_id, billing_cycle } = body;

    // Input validation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new Error("Valid email is required");
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    if (role && !['user', 'admin', 'super_admin'].includes(role)) {
      throw new Error("Invalid role. Must be one of: user, admin, super_admin");
    }

    // Create user in auth
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { company_name }
    });

    if (createError) {
      throw createError;
    }

    // Create profile
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .insert({
        user_id: newUser.user.id,
        company_name: company_name || null,
        phone: phone || null,
        contact_name: contact_name || null,
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
    }

    // Assign role (trigger will automatically log this)
    if (role && ['user', 'admin', 'super_admin'].includes(role)) {
      const { error: roleError } = await supabaseClient
        .from("user_roles")
        .insert({
          user_id: newUser.user.id,
          role: role
        });

      if (roleError) {
        console.error("Role assignment error:", roleError);
      }
    }

    // Create subscription if tier_id and billing_cycle are provided
    if (tier_id && billing_cycle && ['launch', 'growth', 'accel', 'free'].includes(tier_id) && ['monthly', 'quarterly', 'yearly'].includes(billing_cycle)) {
      const { error: subscriptionError } = await supabaseClient
        .from("subscriptions")
        .insert({
          user_id: newUser.user.id,
          tier_id: tier_id,
          billing_cycle: billing_cycle,
          status: 'active',
          started_at: new Date().toISOString()
        });

      if (subscriptionError) {
        console.error("Subscription creation error:", subscriptionError);
      }
    }

    // Send welcome email with login details (non-blocking)
    await sendWelcomeEmail(email, password, company_name, contact_name);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: newUser.user.id,
          email: newUser.user.email
        }
      }),
      {
        headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: error instanceof Error && error.message === "Insufficient permissions" ? 403 : 500,
        headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
