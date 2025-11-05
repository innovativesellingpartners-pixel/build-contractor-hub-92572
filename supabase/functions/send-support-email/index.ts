import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SupportTicketRequest {
  full_name: string;
  business_name?: string;
  phone_number: string;
  email: string;
  reason: string;
  ticket_category?: string;
  description: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing support ticket email request");

    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Authentication error:", userError);
      throw new Error("User not authenticated");
    }

    const ticketData: SupportTicketRequest = await req.json();
    console.log("Ticket data:", {
      full_name: ticketData.full_name,
      email: ticketData.email,
      reason: ticketData.reason,
    });

    // Send email to sales@myct1.com
    const emailResponse = await resend.emails.send({
      from: "CT1 Support <onboarding@resend.dev>",
      to: ["sales@myct1.com"],
      reply_to: ticketData.email,
      subject: `New Support Ticket: ${ticketData.reason}`,
      html: `
        <h1>New Support Ticket</h1>
        <h2>Contact Information</h2>
        <p><strong>Name:</strong> ${ticketData.full_name}</p>
        <p><strong>Email:</strong> ${ticketData.email}</p>
        <p><strong>Phone:</strong> ${ticketData.phone_number}</p>
        ${ticketData.business_name ? `<p><strong>Business:</strong> ${ticketData.business_name}</p>` : ''}
        
        <h2>Ticket Details</h2>
        <p><strong>Reason:</strong> ${ticketData.reason}</p>
        ${ticketData.ticket_category ? `<p><strong>Category:</strong> ${ticketData.ticket_category}</p>` : ''}
        
        <h2>Description</h2>
        <p>${ticketData.description.replace(/\n/g, '<br>')}</p>
        
        <hr>
        <p style="color: #666; font-size: 12px;">
          Submitted by: ${user.email}<br>
          User ID: ${user.id}<br>
          Timestamp: ${new Date().toISOString()}
        </p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Send confirmation email to user
    await resend.emails.send({
      from: "CT1 Support <onboarding@resend.dev>",
      to: [ticketData.email],
      subject: "Support Ticket Received - CT1",
      html: `
        <h1>Thank you for contacting CT1 Support!</h1>
        <p>Dear ${ticketData.full_name},</p>
        <p>We have received your support ticket and our team will review it shortly.</p>
        
        <h2>Your Ticket Details</h2>
        <p><strong>Reason:</strong> ${ticketData.reason}</p>
        ${ticketData.ticket_category ? `<p><strong>Category:</strong> ${ticketData.ticket_category}</p>` : ''}
        <p><strong>Description:</strong> ${ticketData.description}</p>
        
        <p>We'll get back to you as soon as possible at ${ticketData.email} or ${ticketData.phone_number}.</p>
        
        <p>Best regards,<br>The CT1 Support Team</p>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error in send-support-email function:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: "Failed to send support email",
        details: errorMessage
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
