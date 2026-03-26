import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { buildCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const headers = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const { subEmail, subName, jobName, scopeOfWork, agreedAmount, startDate } = await req.json();

    if (!subEmail) {
      return new Response(JSON.stringify({ error: 'Missing sub email' }), { status: 400, headers });
    }

    const resendKey = Deno.env.get('RESEND_API_KEY');
    const emailFrom = Deno.env.get('EMAIL_FROM') || 'CT1 <notifications@myct1.com>';

    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'Email not configured' }), { status: 500, headers });
    }

    const formatCurrency = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0ea5e9, #0284c7); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">New Job Assignment</h1>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px;">Hi ${subName},</p>
          <p>You've been assigned to a new job. Here are the details:</p>
          
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Job</td>
                <td style="padding: 8px 0; font-weight: 600;">${jobName}</td>
              </tr>
              ${scopeOfWork ? `<tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Scope</td>
                <td style="padding: 8px 0;">${scopeOfWork}</td>
              </tr>` : ''}
              ${agreedAmount ? `<tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Amount</td>
                <td style="padding: 8px 0; font-weight: 600; color: #059669;">${formatCurrency(agreedAmount)}</td>
              </tr>` : ''}
              ${startDate ? `<tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Start Date</td>
                <td style="padding: 8px 0;">${startDate}</td>
              </tr>` : ''}
            </table>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">Please confirm your availability and acceptance of this assignment.</p>
          <p style="color: #64748b; font-size: 12px; margin-top: 24px;">— Sent via CT1 Contractor Hub</p>
        </div>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: emailFrom,
        to: [subEmail],
        subject: `New Job Assignment: ${jobName}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...headers, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
  }
});
