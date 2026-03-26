import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { buildCorsHeaders } from "../_shared/cors.ts";

const ALLOWED_ROLES = ["owner", "manager", "sales_rep", "project_manager", "field_tech", "office_staff", "viewer"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  const headers = { ...buildCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Verify requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }

    // Only account owners (no parent_owner_id) can create team members
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("parent_owner_id, company_name, contact_name")
      .eq("user_id", caller.id)
      .single();

    if (callerProfile?.parent_owner_id) {
      return new Response(JSON.stringify({ error: "Sub-users cannot create other sub-users" }), { status: 403, headers });
    }

    // Parse and validate input
    const { email, password, name, phone, job_title, role } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Valid email is required" }), { status: 400, headers });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), { status: 400, headers });
    }
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Name is required" }), { status: 400, headers });
    }
    if (role && !ALLOWED_ROLES.includes(role)) {
      return new Response(JSON.stringify({ error: `Invalid role. Must be one of: ${ALLOWED_ROLES.join(", ")}` }), { status: 400, headers });
    }

    // Check duplicate
    const { data: existingMember } = await adminClient
      .from("team_members")
      .select("id")
      .eq("owner_id", caller.id)
      .eq("email", email.toLowerCase())
      .neq("status", "removed")
      .maybeSingle();

    if (existingMember) {
      return new Response(JSON.stringify({ error: "A team member with this email already exists" }), { status: 409, headers });
    }

    // 1. Create auth user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { company_name: callerProfile?.company_name },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers });
    }

    // 2. Update profile with parent_owner_id and company info
    const { error: profileUpdateError } = await adminClient
      .from("profiles")
      .update({
        parent_owner_id: caller.id,
        company_name: callerProfile?.company_name || null,
        contact_name: name.trim(),
        phone: phone || null,
      })
      .eq("user_id", newUser.user.id);

    if (profileUpdateError) {
      console.error("Profile update error:", profileUpdateError);
      // Profile may have been auto-created by trigger, try upsert
      await adminClient.from("profiles").upsert({
        id: newUser.user.id,
        user_id: newUser.user.id,
        parent_owner_id: caller.id,
        company_name: callerProfile?.company_name || null,
        contact_name: name.trim(),
        phone: phone || null,
      });
    }

    // 3. Insert team_members row
    const { error: teamError } = await adminClient
      .from("team_members")
      .insert({
        owner_id: caller.id,
        member_id: newUser.user.id,
        role: role || "viewer",
        name: name.trim(),
        email: email.toLowerCase(),
        phone: phone || null,
        job_title: job_title || null,
        status: "active",
        accepted_at: new Date().toISOString(),
      });

    if (teamError) {
      console.error("Team member insert error:", teamError);
      return new Response(JSON.stringify({ error: teamError.message }), { status: 500, headers });
    }

    // 4. Send welcome email
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const emailFrom = Deno.env.get("EMAIL_FROM") || "CT1 <noreply@myct1.com>";
    const appUrl = Deno.env.get("APP_URL") || "https://myct1.com";
    const companyName = callerProfile?.company_name || "CT1";

    if (resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: emailFrom,
            to: [email.toLowerCase()],
            subject: `Welcome to ${companyName}'s team on CT1`,
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background-color:#15172A;padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Welcome to ${companyName}</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 20px;color:#333;font-size:16px;">Hi ${name},</p>
          <p style="margin:0 0 20px;color:#333;font-size:16px;">You've been added to <strong>${companyName}</strong>'s team on CT1 as a <strong>${(role || "viewer").replace(/_/g, " ")}</strong>.</p>
          <table width="100%" style="background-color:#f8f9fa;border-radius:8px;margin:0 0 24px;border:1px solid #e9ecef;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 8px;color:#6c757d;font-size:13px;text-transform:uppercase;">Email</p>
              <p style="margin:0 0 16px;color:#15172A;font-size:16px;font-weight:600;">${email}</p>
              <p style="margin:0 0 8px;color:#6c757d;font-size:13px;text-transform:uppercase;">Temporary Password</p>
              <p style="margin:0;color:#15172A;font-size:16px;font-weight:600;font-family:monospace;background:#e9ecef;display:inline-block;padding:4px 12px;border-radius:4px;">${password}</p>
            </td></tr>
          </table>
          <p style="margin:0 0 24px;color:#333;font-size:16px;">Please change your password after logging in.</p>
          <table width="100%"><tr><td align="center">
            <a href="${appUrl}/auth" style="display:inline-block;background-color:#D50A22;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:600;">Log In Now</a>
          </td></tr></table>
        </td></tr>
        <tr><td style="background-color:#f8f9fa;padding:24px 40px;border-top:1px solid #e9ecef;">
          <p style="margin:0;color:#999;font-size:12px;text-align:center;">&copy; ${new Date().getFullYear()} CT1. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
          }),
        });
      } catch (err) {
        console.error("Failed to send welcome email:", err);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      member: { id: newUser.user.id, email: email.toLowerCase(), name: name.trim(), role: role || "viewer" },
    }), { headers });

  } catch (error: any) {
    console.error("Error creating team member:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), { status: 500, headers });
  }
});
