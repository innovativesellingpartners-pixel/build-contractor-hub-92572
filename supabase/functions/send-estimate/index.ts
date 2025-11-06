import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendEstimateRequest {
  estimateId: string;
  contractorName: string;
  contractorEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { estimateId, contractorName, contractorEmail }: SendEstimateRequest = await req.json();

    // Fetch estimate details
    const { data: estimate, error: fetchError } = await supabase
      .from('estimates')
      .select('*')
      .eq('id', estimateId)
      .single();

    if (fetchError || !estimate) {
      throw new Error('Estimate not found');
    }

    if (!estimate.client_email) {
      throw new Error('Client email is required to send estimate');
    }

    // Generate public view URL
    const publicUrl = `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovableproject.com')}/estimate/${estimate.public_token}`;

    // Send email to client
    const emailResponse = await resend.emails.send({
      from: `${contractorName} <onboarding@resend.dev>`,
      to: [estimate.client_email],
      subject: `Estimate ${estimate.estimate_number || 'from ' + contractorName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #E02424;">New Estimate from ${contractorName}</h1>
          <p>Hello ${estimate.client_name},</p>
          <p>You have received a new estimate for your project: <strong>${estimate.title}</strong></p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #374151; margin-top: 0;">Estimate Details</h2>
            <p><strong>Project:</strong> ${estimate.title}</p>
            <p><strong>Total Amount:</strong> $${estimate.total_amount?.toFixed(2) || '0.00'}</p>
            ${estimate.valid_until ? `<p><strong>Valid Until:</strong> ${new Date(estimate.valid_until).toLocaleDateString()}</p>` : ''}
          </div>

          <p>To view, sign, and approve this estimate, please click the button below:</p>
          
          <a href="${publicUrl}" 
             style="display: inline-block; background: #E02424; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
            View & Sign Estimate
          </a>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you have any questions, please reply to this email or contact:<br>
            ${contractorEmail}
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px;">
            This is an automated message from ${contractorName}. 
            Please do not reply directly to this email if it's from a no-reply address.
          </p>
        </div>
      `,
    });

    // Update estimate status
    const { error: updateError } = await supabase
      .from('estimates')
      .update({ 
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', estimateId);

    if (updateError) {
      console.error('Error updating estimate status:', updateError);
    }

    console.log("Estimate email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailResponse,
      publicUrl 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-estimate function:", error);
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
