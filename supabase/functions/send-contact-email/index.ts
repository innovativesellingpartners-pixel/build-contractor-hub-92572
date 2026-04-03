import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

import { buildCorsHeaders } from '../_shared/cors.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface ContactEmailRequest {
  name: string;
  phone: string;
  email: string;
  companyName?: string;
  reason?: string;
  formType?: string;
  smsConsent?: boolean;
}

// Server-side validation function
function validateContactForm(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Name validation
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Name is required');
  } else if (data.name.trim().length > 100) {
    errors.push('Name must be less than 100 characters');
  }
  
  // Email validation
  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.push('Invalid email address');
    } else if (data.email.trim().length > 255) {
      errors.push('Email must be less than 255 characters');
    }
  }
  
  // Phone validation
  if (!data.phone || typeof data.phone !== 'string' || data.phone.trim().length === 0) {
    errors.push('Phone is required');
  } else if (data.phone.trim().length > 20) {
    errors.push('Phone must be less than 20 characters');
  }
  
  // Optional fields validation
  if (data.companyName && typeof data.companyName === 'string' && data.companyName.trim().length > 200) {
    errors.push('Company name must be less than 200 characters');
  }
  
  if (data.reason && typeof data.reason === 'string' && data.reason.trim().length > 2000) {
    errors.push('Reason must be less than 2000 characters');
  }
  
  if (data.formType && typeof data.formType === 'string' && data.formType.trim().length > 50) {
    errors.push('Form type must be less than 50 characters');
  }
  
  return { valid: errors.length === 0, errors };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const requestData = await req.json();
    
    // Server-side validation
    const validation = validateContactForm(requestData);
    if (!validation.valid) {
      console.error('Validation errors:', validation.errors);
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validation.errors }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...buildCorsHeaders(req) }
        }
      );
    }
    
    // Sanitize and trim inputs
    const { name, phone, email, companyName, reason, formType, smsConsent } = {
      name: requestData.name.trim().slice(0, 100),
      phone: requestData.phone.trim().slice(0, 20),
      email: requestData.email.trim().toLowerCase().slice(0, 255),
      companyName: requestData.companyName?.trim().slice(0, 200),
      reason: requestData.reason?.trim().slice(0, 2000),
      formType: requestData.formType?.trim().slice(0, 50),
      smsConsent: requestData.smsConsent === true,
    };

    // Send notification email to sales team
    const salesEmailResponse = await resend.emails.send({
      from: Deno.env.get('EMAIL_FROM') || 'pwm@myct1.com',
      to: ["sales@myct1.com"],
      subject: `New CT1 Contact Form Submission - ${formType || 'General'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0; font-size: 28px; font-weight: bold;">CT1</h1>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">New Contact Form Submission</p>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">Contact Information</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600; width: 140px;">Name:</td>
                  <td style="padding: 8px 0; color: #374151;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Phone:</td>
                  <td style="padding: 8px 0; color: #374151;"><a href="tel:${phone}" style="color: #dc2626; text-decoration: none;">${phone}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Email:</td>
                  <td style="padding: 8px 0; color: #374151;"><a href="mailto:${email}" style="color: #dc2626; text-decoration: none;">${email}</a></td>
                </tr>
                ${companyName ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Company:</td>
                  <td style="padding: 8px 0; color: #374151;">${companyName}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Form Type:</td>
                  <td style="padding: 8px 0; color: #374151;">${formType || 'General'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">SMS Consent:</td>
                  <td style="padding: 8px 0; color: #374151;">${smsConsent ? '✅ Yes — opted in' : '❌ No'}</td>
                </tr>
              </table>
            </div>
            
            ${reason ? `
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 16px;">Reason for Inquiry:</h3>
              <p style="color: #374151; margin: 0; line-height: 1.5;">${reason}</p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                This email was sent from the CT1 website contact form.<br>
                Please respond promptly to maintain our high service standards.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    // Send confirmation email to the user
    const userEmailResponse = await resend.emails.send({
      from: Deno.env.get('EMAIL_FROM') || 'pwm@myct1.com',
      to: [email],
      subject: "Thank you for contacting CT1 - We'll be in touch soon!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0; font-size: 32px; font-weight: bold;">CT1</h1>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 16px;">One-Up Your Business</p>
            </div>
            
            <h2 style="color: #374151; margin: 0 0 20px 0; font-size: 24px; text-align: center;">Thank you for your interest in CT1!</h2>
            
            <p style="color: #374151; margin: 0 0 20px 0; line-height: 1.6; font-size: 16px;">
              Hi ${name},
            </p>
            
            <p style="color: #374151; margin: 0 0 20px 0; line-height: 1.6; font-size: 16px;">
              We've received your inquiry and our sales team will be in touch with you shortly. At CT1, we're committed to helping contractors like you grow, manage, and scale your business with our comprehensive platform.
            </p>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 18px;">While you wait, here's what CT1 offers:</h3>
              <ul style="color: #374151; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>AI-powered Pocket Agents for business automation</li>
                <li>Comprehensive CRM & PSA integration</li>
                <li>Lead generation and management</li>
                <li>Professional training and certifications</li>
                <li>Marketplace for tools and services</li>
                <li>Complete business management suite</li>
              </ul>
            </div>
            
            <p style="color: #374151; margin: 20px 0; line-height: 1.6; font-size: 16px;">
              Our team typically responds within 24 hours during business days. If you have any urgent questions, feel free to call us directly at <strong style="color: #dc2626;">(555) 123-4567</strong>.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://myct1.com" style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Visit CT1 Website</a>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                Best regards,<br>
                <strong style="color: #dc2626;">The CT1 Team</strong><br>
                <em>Empowering contractors to build better businesses</em>
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Emails sent successfully:", { salesEmailResponse, userEmailResponse });

    return new Response(JSON.stringify({ 
      success: true, 
      salesEmailId: salesEmailResponse.data?.id,
      userEmailId: userEmailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...buildCorsHeaders(req),
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
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