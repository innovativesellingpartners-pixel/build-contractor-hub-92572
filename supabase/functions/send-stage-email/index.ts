import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { Resend } from "https://esm.sh/resend@2.0.0";

import { buildCorsHeaders } from '../_shared/cors.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface SendEmailRequest {
  entityType: 'lead' | 'job' | 'customer';
  entityId: string;
  templateId?: string;
  customSubject?: string;
  customBody?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
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

    const { entityType, entityId, templateId, customSubject, customBody }: SendEmailRequest = await req.json();

    console.log(`Sending email for ${entityType}:`, entityId);

    // Get entity details based on type
    let entity: any;
    let recipientEmail: string = '';
    let recipientName: string = '';

    if (entityType === 'lead') {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", entityId)
        .eq("user_id", user.id)
        .single();

      if (error || !data) throw new Error("Lead not found");
      entity = data;
      recipientEmail = entity.email;
      recipientName = entity.name;
    } else if (entityType === 'job') {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", entityId)
        .eq("user_id", user.id)
        .single();

      if (error || !data) throw new Error("Job not found");
      entity = data;
      recipientEmail = entity.customer_email;
      recipientName = entity.customer_name;
    } else if (entityType === 'customer') {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", entityId)
        .eq("user_id", user.id)
        .single();

      if (error || !data) throw new Error("Customer not found");
      entity = data;
      recipientEmail = entity.email;
      recipientName = entity.name || entity.company_name;
    }

    if (!recipientEmail) {
      throw new Error(`${entityType} does not have an email address`);
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
      customer_name: recipientName || "Valued Customer",
      company_name: profile?.business_name || "Our Company",
      user_name: profile?.full_name || user.email?.split("@")[0] || "Your Account Manager",
      project_type: entity.project_type || entity.trade_type || "",
      address: entity.address || entity.job_address || entity.site_address || "",
      value: entity.value ? `$${entity.value.toLocaleString()}` : entity.total_cost ? `$${entity.total_cost.toLocaleString()}` : "TBD",
      status: entity.status || "",
      notes: entity.notes || "",
    };

    // Replace all variables in subject and body
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      if (subject) subject = subject.replace(regex, value);
      if (body) body = body.replace(regex, value);
    });

    // Send email
    const fromEmail = Deno.env.get("EMAIL_FROM") || "pwm@myct1.com";
    
    const emailResponse = await resend.emails.send({
      from: `${variables.company_name} <${fromEmail}>`,
      to: [recipientEmail],
      subject: subject || "Update from " + variables.company_name,
      html: body?.replace(/\n/g, "<br>") || "",
    });

    console.log("Email sent successfully:", emailResponse);

    // Log email send
    const { error: logError } = await supabase
      .from("email_logs")
      .insert({
        user_id: user.id,
        entity_type: entityType,
        entity_id: entityId,
        template_id: templateId || null,
        recipient_email: recipientEmail,
        subject: subject || "",
        body: body || "",
        status: "sent",
      });

    if (logError) {
      console.error("Error logging email:", logError);
    }

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...buildCorsHeaders(req) },
      }
    );
  } catch (error: any) {
    console.error("Error in send-stage-email function:", error);
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
