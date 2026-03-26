import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { buildCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authentication required');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify user
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error('Invalid authentication');

    const { job_id, customer_id, customer_email, customer_phone, channel = 'email' } = await req.json();

    if (!job_id) throw new Error('job_id is required');
    if (!customer_email && channel !== 'sms') throw new Error('customer_email is required for email channel');

    // Get job info
    const { data: job } = await supabase
      .from('jobs')
      .select('id, name, project_name, job_number')
      .eq('id', job_id)
      .single();

    if (!job) throw new Error('Job not found');

    // Get contractor profile for branding
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name, contact_name, logo_url, brand_primary_color, google_place_id, business_email')
      .eq('id', user.id)
      .single();

    // Create review request record
    const { data: reviewRequest, error: insertError } = await supabase
      .from('review_requests')
      .insert({
        user_id: user.id,
        job_id,
        customer_id: customer_id || null,
        customer_email: customer_email || null,
        customer_phone: customer_phone || null,
        channel,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const appUrl = Deno.env.get('APP_URL') || 'https://myct1.com';
    const reviewUrl = `${appUrl}/review/${reviewRequest.review_token}`;
    const companyName = profile?.company_name || profile?.contact_name || 'Your Contractor';
    const brandColor = profile?.brand_primary_color || '#2563eb';
    const jobName = job.project_name || job.name || job.job_number || 'your project';

    // Send email if applicable
    if (channel === 'email' || channel === 'both') {
      const resendKey = Deno.env.get('RESEND_API_KEY');
      if (resendKey && customer_email) {
        const emailFrom = Deno.env.get('EMAIL_FROM') || 'noreply@myct1.com';
        
        const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px">
    <div style="background:#fff;border-radius:12px;padding:40px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      ${profile?.logo_url ? `<img src="${profile.logo_url}" alt="${companyName}" style="height:48px;margin-bottom:24px">` : ''}
      <h1 style="font-size:22px;color:#111;margin:0 0 8px">${companyName}</h1>
      <p style="color:#666;font-size:15px;margin:0 0 24px">How was your experience with <strong>${jobName}</strong>?</p>
      <p style="color:#888;font-size:14px;margin:0 0 32px">Your feedback helps us improve and serve you better.</p>
      
      <div style="margin-bottom:32px">
        <a href="${reviewUrl}?r=5" style="text-decoration:none;font-size:28px;margin:0 4px">⭐</a>
        <a href="${reviewUrl}?r=4" style="text-decoration:none;font-size:28px;margin:0 4px">⭐</a>
        <a href="${reviewUrl}?r=3" style="text-decoration:none;font-size:28px;margin:0 4px">⭐</a>
        <a href="${reviewUrl}?r=2" style="text-decoration:none;font-size:28px;margin:0 4px">⭐</a>
        <a href="${reviewUrl}?r=1" style="text-decoration:none;font-size:28px;margin:0 4px">⭐</a>
      </div>
      
      <a href="${reviewUrl}" style="display:inline-block;background:${brandColor};color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
        Leave Your Review
      </a>
      
      <p style="color:#aaa;font-size:12px;margin-top:32px">Powered by MyCT1</p>
    </div>
  </div>
</body>
</html>`;

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: emailFrom,
            to: customer_email,
            subject: `How was your experience with ${companyName}?`,
            html: emailHtml,
          }),
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      review_request_id: reviewRequest.id,
      review_url: reviewUrl,
    }), {
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
