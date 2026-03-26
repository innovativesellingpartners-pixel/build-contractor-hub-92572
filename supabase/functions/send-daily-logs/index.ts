/**
 * Send Daily Logs via Email
 * 
 * POST /functions/v1/send-daily-logs
 * Body: { jobId, logIds, recipientEmails, jobName }
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { Resend } from "npm:resend@2.0.0";

import { buildCorsHeaders } from '../_shared/cors.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: buildCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const fromEmail = Deno.env.get('EMAIL_FROM') || 'onboarding@resend.dev';
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const jwt = authHeader.replace('Bearer ', '').trim();
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const { jobId, logIds, recipientEmails, jobName } = await req.json();

    if (!jobId || !recipientEmails?.length) {
      return new Response(JSON.stringify({ error: 'jobId and recipientEmails are required' }), {
        status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = recipientEmails.filter((e: string) => emailRegex.test(e?.trim()));
    if (!validEmails.length) {
      return new Response(JSON.stringify({ error: 'No valid email addresses provided' }), {
        status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Fetch logs
    let query = adminSupabase
      .from('daily_logs')
      .select('*')
      .eq('job_id', jobId)
      .order('log_date', { ascending: false });

    if (logIds?.length) {
      query = query.in('id', logIds);
    }

    const { data: logs, error: logsError } = await query;
    if (logsError) throw logsError;

    if (!logs?.length) {
      return new Response(JSON.stringify({ error: 'No logs found' }), {
        status: 404, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    // Get contractor profile for sender name
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('full_name, business_name')
      .eq('id', user.id)
      .single();

    const senderName = profile?.business_name || profile?.full_name || 'CT1 Contractor';
    const displayJobName = jobName || 'Job';

    // Build HTML email
    const logsHtml = logs.map((log: any) => {
      const date = new Date(log.log_date).toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });
      
      const details: string[] = [];
      if (log.weather) details.push(`<strong>Weather:</strong> ${escapeHtml(log.weather)}`);
      if (log.crew_count) details.push(`<strong>Crew:</strong> ${log.crew_count}`);
      if (log.hours_worked) details.push(`<strong>Hours:</strong> ${log.hours_worked}`);
      if (log.materials_used) details.push(`<strong>Materials:</strong> ${escapeHtml(log.materials_used)}`);
      if (log.equipment_used) details.push(`<strong>Equipment:</strong> ${escapeHtml(log.equipment_used)}`);

      return `
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">${date}</h3>
          ${details.length ? `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; margin-bottom: 8px; font-size: 14px; color: #4b5563;">${details.join('')}</div>` : ''}
          ${log.work_completed ? `<div style="font-size: 14px; color: #374151; margin-top: 8px;"><strong>Work Completed:</strong><br/>${escapeHtml(log.work_completed)}</div>` : ''}
          ${log.notes ? `<div style="font-size: 13px; color: #6b7280; margin-top: 8px;"><em>Notes: ${escapeHtml(log.notes)}</em></div>` : ''}
        </div>
      `;
    }).join('');

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 32px;">
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="margin: 0; color: #1f2937; font-size: 22px;">Daily Logs — ${escapeHtml(displayJobName)}</h1>
          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Sent by ${escapeHtml(senderName)} • ${logs.length} log${logs.length > 1 ? 's' : ''}</p>
        </div>
        ${logsHtml}
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">Sent via CT1 — Contractor Tools</p>
        </div>
      </div>
    `;

    const subject = `Daily Logs: ${displayJobName} (${logs.length} log${logs.length > 1 ? 's' : ''})`;

    const emailResponse = await resend.emails.send({
      from: `${senderName} <${fromEmail}>`,
      to: validEmails,
      subject,
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error('Resend error:', emailResponse.error);
      
      // Handle test mode restriction
      if ((emailResponse.error as any).statusCode === 403) {
        return new Response(JSON.stringify({ 
          error: 'Email sending restricted. You may need to verify your email domain.',
          details: emailResponse.error.message
        }), {
          status: 403, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(emailResponse.error.message);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Logs sent to ${validEmails.length} recipient(s)`,
      messageId: emailResponse.data?.id 
    }), {
      status: 200, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error sending daily logs:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to send logs', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
