import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  opportunityId: string;
  templateId?: string;
  customSubject?: string;
  customBody?: string;
  stage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { opportunityId, templateId, customSubject, customBody, stage }: SendEmailRequest = await req.json();

    console.log("Sending email for opportunity:", opportunityId);

    // Get opportunity details
    const { data: opportunity, error: oppError } = await supabase
      .from("opportunities")
      .select("*")
      .eq("id", opportunityId)
      .eq("user_id", user.id)
      .single();

    if (oppError || !opportunity) {
      throw new Error("Opportunity not found");
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name, full_name")
      .eq("id", user.id)
      .single();

    let subject = customSubject;
    let body = customBody;

    // If template is specified, fetch it
    if (templateId) {
      const { data: template, error: templateError } = await supabase
        .from("email_templates")
        .select("*")
        .eq("id", templateId)
        .eq("user_id", user.id)
        .single();

      if (templateError || !template) {
        throw new Error("Template not found");
      }

      subject = template.subject;
      body = template.body;
    }

    // Replace template variables
    const variables: Record<string, string> = {
      customer_name: opportunity.customer_name || "Valued Customer",
      company_name: profile?.business_name || "Our Company",
      user_name: profile?.full_name || user.email?.split("@")[0] || "Your Account Manager",
      trade_type: opportunity.trade_type || "construction",
      title: opportunity.title || "Your Project",
      estimated_value: opportunity.estimated_value ? `${opportunity.estimated_value.toLocaleString()}` : "TBD",
      need_description: opportunity.need_description || "your project needs",
      meeting_date: opportunity.next_action_date || "TBD",
      timeline: opportunity.estimated_close_date || "TBD",
      start_date: opportunity.job_start_target_date || "TBD",
      scope: opportunity.need_description || "As discussed",
    };

    // Replace all variables in subject and body
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      if (subject) subject = subject.replace(regex, value);
      if (body) body = body.replace(regex, value);
    });

    // Send email
    const fromEmail = Deno.env.get("EMAIL_FROM") || "noreply@myct1.com";
    
    const emailResponse = await resend.emails.send({
      from: `${variables.company_name} <${fromEmail}>`,
      to: [opportunity.customer_email || ""],
      subject: subject || "Update from " + variables.company_name,
      html: body?.replace(/\n/g, "<br>") || "",
    });

    console.log("Email sent successfully:", emailResponse);

    // Log email send
    const { error: logError } = await supabase
      .from("email_logs")
      .insert({
        user_id: user.id,
        opportunity_id: opportunityId,
        template_id: templateId || null,
        recipient_email: opportunity.customer_email,
        subject: subject || "",
        body: body || "",
        status: "sent",
      });

    if (logError) {
      console.error("Error logging email:", logError);
    }

    // Update opportunity last_activity_at
    await supabase
      .from("opportunities")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", opportunityId);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-stage-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
