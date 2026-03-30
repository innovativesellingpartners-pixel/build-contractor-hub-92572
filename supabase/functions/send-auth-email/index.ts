import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

import { buildCorsHeaders } from '../_shared/cors.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM_EMAIL = Deno.env.get('EMAIL_FROM') || 'pwm@myct1.com';

interface AuthEmailRequest {
  user: {
    email: string;
  };
  email_data: {
    token?: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const payload: AuthEmailRequest = await req.json();
    console.log("Received auth email request:", {
      email: payload.user.email,
      action: payload.email_data.email_action_type,
    });

    const { user, email_data } = payload;
    const { token_hash, redirect_to, email_action_type } = email_data;

    let subject = "";
    let html = "";

    // Build the verification URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const verificationUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

    if (email_action_type === "recovery") {
      subject = "Reset Your Password - ConstructeAM";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Reset Your Password</h1>
          <p>Hi there,</p>
          <p>You requested to reset your password for your ConstructeAM account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${verificationUrl}" 
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Reset Password
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #999; font-size: 14px; margin-top: 32px;">
            If you didn't request this password reset, you can safely ignore this email.
          </p>
          <p style="color: #999; font-size: 14px;">
            Best regards,<br>
            The ConstructeAM Team
          </p>
        </div>
      `;
    } else if (email_action_type === "signup" || email_action_type === "invite") {
      subject = "Confirm Your Email - ConstructeAM";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to ConstructeAM!</h1>
          <p>Hi there,</p>
          <p>Thanks for signing up! Please confirm your email address to get started.</p>
          <a href="${verificationUrl}" 
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Confirm Email
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #999; font-size: 14px; margin-top: 32px;">
            If you didn't create this account, you can safely ignore this email.
          </p>
          <p style="color: #999; font-size: 14px;">
            Best regards,<br>
            The ConstructeAM Team
          </p>
        </div>
      `;
    } else {
      subject = "Email Verification - ConstructeAM";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Verify Your Email</h1>
          <p>Hi there,</p>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" 
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Verify Email
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #999; font-size: 14px; margin-top: 32px;">
            Best regards,<br>
            The ConstructeAM Team
          </p>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "ConstructeAM <noreply@resend.dev>",
      to: [user.email],
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...buildCorsHeaders(req),
      },
    });
  } catch (error: any) {
    console.error("Error sending auth email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...buildCorsHeaders(req) },
      }
    );
  }
};

serve(handler);
