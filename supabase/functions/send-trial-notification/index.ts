import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TrialNotificationRequest {
  firstName: string;
  lastName: string;
  email: string;
  businessName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  cardNumber: string; // Last 4 digits only
  trialEndDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      businessName,
      address,
      city,
      state,
      zipCode,
      cardNumber,
      trialEndDate,
    }: TrialNotificationRequest = await req.json();

    const trialEnd = new Date(trialEndDate);
    const formattedDate = trialEnd.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const emailResponse = await resend.emails.send({
      from: "CT1 Trial Notifications <notifications@myct1.com>",
      to: ["sales@myct1.com"],
      subject: `🎉 New Free Trial Signup - ${businessName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 10px 10px;
                border: 1px solid #e5e7eb;
              }
              .info-row {
                display: flex;
                margin-bottom: 15px;
                padding: 10px;
                background: white;
                border-radius: 5px;
                border-left: 3px solid #667eea;
              }
              .label {
                font-weight: bold;
                color: #667eea;
                min-width: 150px;
              }
              .value {
                color: #4b5563;
              }
              .highlight {
                background: #dbeafe;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
                border-left: 4px solid #3b82f6;
              }
              .footer {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0;">🎉 New Free Trial Signup!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">A new contractor has started their 30-day trial</p>
            </div>
            
            <div class="content">
              <h2 style="color: #667eea; margin-top: 0;">Contact Information</h2>
              
              <div class="info-row">
                <span class="label">Name:</span>
                <span class="value">${firstName} ${lastName}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">${email}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Business Name:</span>
                <span class="value">${businessName}</span>
              </div>
              
              <h2 style="color: #667eea; margin-top: 30px;">Business Address</h2>
              
              <div class="info-row">
                <span class="label">Street:</span>
                <span class="value">${address}</span>
              </div>
              
              <div class="info-row">
                <span class="label">City, State ZIP:</span>
                <span class="value">${city}, ${state} ${zipCode}</span>
              </div>
              
              <h2 style="color: #667eea; margin-top: 30px;">Payment Information</h2>
              
              <div class="info-row">
                <span class="label">Card (Last 4):</span>
                <span class="value">•••• ${cardNumber}</span>
              </div>
              
              <div class="highlight">
                <strong>📅 Trial End Date:</strong> ${formattedDate}
                <br>
                <span style="color: #6b7280; font-size: 14px;">
                  The contractor will have access to 5-Star Training, CRM, and Marketplace until this date.
                </span>
              </div>
              
              <div class="footer">
                <p>This is an automated notification from the CT1 Trial Signup System</p>
                <p style="margin: 5px 0;">Follow up with the contractor to ensure a smooth onboarding experience!</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Trial notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-trial-notification function:", error);
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
