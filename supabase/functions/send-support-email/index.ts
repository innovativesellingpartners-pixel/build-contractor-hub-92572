import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

import { buildCorsHeaders } from '../_shared/cors.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
    return new Response(null, { headers: buildCorsHeaders(req) });
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
    
    // Validation helper function
    const validateTicket = (data: any): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];
      
      if (!data.full_name || typeof data.full_name !== 'string' || data.full_name.trim().length === 0) {
        errors.push('Full name is required');
      } else if (data.full_name.trim().length > 100) {
        errors.push('Full name must be less than 100 characters');
      }
      
      if (!data.email || typeof data.email !== 'string') {
        errors.push('Email is required');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Invalid email format');
      } else if (data.email.length > 255) {
        errors.push('Email must be less than 255 characters');
      }
      
      if (!data.phone_number || typeof data.phone_number !== 'string' || data.phone_number.trim().length === 0) {
        errors.push('Phone number is required');
      } else if (data.phone_number.trim().length > 20) {
        errors.push('Phone number must be less than 20 characters');
      }
      
      if (!data.reason || typeof data.reason !== 'string' || data.reason.trim().length === 0) {
        errors.push('Reason is required');
      } else if (data.reason.length > 200) {
        errors.push('Reason must be less than 200 characters');
      }
      
      if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
        errors.push('Description is required');
      } else if (data.description.length > 5000) {
        errors.push('Description must be less than 5000 characters');
      }
      
      if (data.business_name && typeof data.business_name === 'string' && data.business_name.length > 200) {
        errors.push('Business name must be less than 200 characters');
      }
      
      if (data.ticket_category && typeof data.ticket_category === 'string' && data.ticket_category.length > 100) {
        errors.push('Ticket category must be less than 100 characters');
      }
      
      return { valid: errors.length === 0, errors };
    };
    
    // HTML escape helper function
    const escapeHtml = (unsafe: string): string => {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };
    
    // Validate input
    const validation = validateTicket(ticketData);
    if (!validation.valid) {
      console.error("Validation errors:", validation.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: validation.errors 
        }),
        { 
          status: 400, 
          headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Sanitize inputs
    const sanitized = {
      full_name: escapeHtml(ticketData.full_name.trim().slice(0, 100)),
      business_name: ticketData.business_name ? escapeHtml(ticketData.business_name.trim().slice(0, 200)) : undefined,
      phone_number: escapeHtml(ticketData.phone_number.trim().slice(0, 20)),
      email: ticketData.email.trim().toLowerCase().slice(0, 255),
      reason: escapeHtml(ticketData.reason.trim().slice(0, 200)),
      ticket_category: ticketData.ticket_category ? escapeHtml(ticketData.ticket_category.trim().slice(0, 100)) : undefined,
      description: escapeHtml(ticketData.description.trim().slice(0, 5000)),
    };
    
    console.log("Ticket data validated and sanitized:", {
      full_name: sanitized.full_name,
      email: sanitized.email,
      reason: sanitized.reason,
    });

    // Send email to sales@myct1.com using sanitized data
    const emailResponse = await resend.emails.send({
      from: Deno.env.get('EMAIL_FROM') || 'pwm@myct1.com',
      to: ["sales@myct1.com"],
      reply_to: sanitized.email,
      subject: `New Support Ticket: ${sanitized.reason}`,
      html: `
        <h1>New Support Ticket</h1>
        <h2>Contact Information</h2>
        <p><strong>Name:</strong> ${sanitized.full_name}</p>
        <p><strong>Email:</strong> ${sanitized.email}</p>
        <p><strong>Phone:</strong> ${sanitized.phone_number}</p>
        ${sanitized.business_name ? `<p><strong>Business:</strong> ${sanitized.business_name}</p>` : ''}
        
        <h2>Ticket Details</h2>
        <p><strong>Reason:</strong> ${sanitized.reason}</p>
        ${sanitized.ticket_category ? `<p><strong>Category:</strong> ${sanitized.ticket_category}</p>` : ''}
        
        <h2>Description</h2>
        <p>${sanitized.description.replace(/\n/g, '<br>')}</p>
        
        <hr>
        <p style="color: #666; font-size: 12px;">
          Submitted by: ${user.email}<br>
          User ID: ${user.id}<br>
          Timestamp: ${new Date().toISOString()}
        </p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Send confirmation email to user using sanitized data
    await resend.emails.send({
      from: "CT1 Support <onboarding@resend.dev>",
      to: [sanitized.email],
      subject: "Support Ticket Received - CT1",
      html: `
        <h1>Thank you for contacting CT1 Support!</h1>
        <p>Dear ${sanitized.full_name},</p>
        <p>We have received your support ticket and our team will review it shortly.</p>
        
        <h2>Your Ticket Details</h2>
        <p><strong>Reason:</strong> ${sanitized.reason}</p>
        ${sanitized.ticket_category ? `<p><strong>Category:</strong> ${sanitized.ticket_category}</p>` : ''}
        <p><strong>Description:</strong> ${sanitized.description}</p>
        
        <p>We'll get back to you as soon as possible at ${ticketData.email} or ${ticketData.phone_number}.</p>
        
        <p>Best regards,<br>The CT1 Support Team</p>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...buildCorsHeaders(req),
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
        headers: { "Content-Type": "application/json", ...buildCorsHeaders(req) },
      }
    );
  }
};

serve(handler);
