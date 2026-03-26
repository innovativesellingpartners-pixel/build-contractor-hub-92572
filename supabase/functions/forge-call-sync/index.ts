import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { buildCorsHeaders } from '../_shared/cors.ts';

/**
 * Forge Call Sync Webhook
 * 
 * Accepts call data (recordings, transcripts, summaries, outcomes) from
 * the Forge external platform and upserts into call_sessions so CT1
 * can display playback, transcripts, and audio.
 * 
 * Auth: Bearer token using CT1_SYNC_SECRET
 * 
 * POST body:
 * {
 *   call_sid: string (required — unique call identifier)
 *   contractor_id: string (required — CT1 contractor UUID or contractor_number)
 *   from_number: string
 *   to_number: string
 *   status: string (e.g. "completed")
 *   duration?: number (seconds)
 *   transcript?: string
 *   ai_summary?: string
 *   outcome?: string (e.g. "appointment_booked", "lead_captured", "voicemail", "message_taken")
 *   recording_url?: string (publicly accessible URL)
 *   recording_sid?: string
 *   recording_duration?: number
 *   recording_status?: string
 *   caller_name?: string
 *   action_taken?: string
 *   conversation_history?: Array<{role: string, content: string}>
 *   customer_info?: object
 * }
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    const expectedKey = Deno.env.get('CT1_SYNC_SECRET');
    if (!expectedKey || !authHeader || authHeader !== `Bearer ${expectedKey}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const {
      call_sid,
      contractor_id,
      from_number,
      to_number,
      status,
      duration,
      transcript,
      ai_summary,
      outcome,
      recording_url,
      recording_sid,
      recording_duration,
      recording_status,
      caller_name,
      action_taken,
      conversation_history,
      customer_info,
    } = body;

    if (!call_sid) {
      return new Response(JSON.stringify({ error: 'call_sid is required' }), {
        status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    if (!contractor_id) {
      return new Response(JSON.stringify({ error: 'contractor_id is required' }), {
        status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Resolve contractor_id — accept UUID directly or contractor_number (e.g. CT1000012)
    let resolvedContractorId = contractor_id;
    if (contractor_id.startsWith('CT')) {
      const { data: contractor } = await supabase
        .from('contractors')
        .select('id')
        .eq('contractor_number', contractor_id)
        .single();
      if (!contractor) {
        return new Response(JSON.stringify({ error: 'Contractor not found' }), {
          status: 404, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
        });
      }
      resolvedContractorId = contractor.id;
    }

    // Build upsert payload
    const upsertPayload: Record<string, any> = {
      call_sid,
      contractor_id: resolvedContractorId,
      from_number: from_number || 'unknown',
      to_number: to_number || 'unknown',
      status: status || 'completed',
      updated_at: new Date().toISOString(),
    };

    if (duration != null) upsertPayload.recording_duration = duration;
    if (transcript != null) upsertPayload.ai_summary = ai_summary ?? transcript?.substring(0, 500);
    if (ai_summary != null) upsertPayload.ai_summary = ai_summary;
    if (outcome != null) upsertPayload.outcome = outcome;
    if (recording_url != null) upsertPayload.recording_url = recording_url;
    if (recording_sid != null) upsertPayload.recording_sid = recording_sid;
    if (recording_duration != null) upsertPayload.recording_duration = recording_duration;
    if (recording_status != null) upsertPayload.recording_status = recording_status;
    if (caller_name != null) upsertPayload.caller_name = caller_name;
    if (action_taken != null) upsertPayload.action_taken = action_taken;
    if (conversation_history != null) upsertPayload.conversation_history = conversation_history;

    // Upsert into call_sessions by call_sid
    const { data: existingSession } = await supabase
      .from('call_sessions')
      .select('id')
      .eq('call_sid', call_sid)
      .maybeSingle();

    let resultData;
    if (existingSession) {
      // Update existing
      const { data, error } = await supabase
        .from('call_sessions')
        .update(upsertPayload)
        .eq('call_sid', call_sid)
        .select()
        .single();
      if (error) throw error;
      resultData = data;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('call_sessions')
        .insert(upsertPayload)
        .select()
        .single();
      if (error) throw error;
      resultData = data;
    }

    // Also mirror key fields into the calls table for the Forge Call Center UI
    const callsPayload: Record<string, any> = {
      call_sid,
      contractor_id: resolvedContractorId,
      from_number: from_number || 'unknown',
      to_number: to_number || 'unknown',
      call_status: status || 'completed',
      updated_at: new Date().toISOString(),
    };

    if (duration != null) callsPayload.duration = duration;
    if (transcript != null) callsPayload.transcript = transcript;
    if (ai_summary != null) callsPayload.ai_summary = ai_summary;
    if (outcome != null) callsPayload.outcome = outcome;
    if (recording_url != null) callsPayload.recording_url = recording_url;
    if (recording_sid != null) callsPayload.recording_sid = recording_sid;
    if (customer_info != null) callsPayload.customer_info = customer_info;

    const { data: existingCall } = await supabase
      .from('calls')
      .select('id')
      .eq('call_sid', call_sid)
      .maybeSingle();

    if (existingCall) {
      await supabase.from('calls').update(callsPayload).eq('call_sid', call_sid);
    } else {
      callsPayload.routing_status = 'forge_synced';
      await supabase.from('calls').insert(callsPayload);
    }

    console.log(`[forge-call-sync] Synced call ${call_sid} for contractor ${resolvedContractorId}`);

    return new Response(JSON.stringify({
      success: true,
      call_session_id: resultData.id,
      call_sid,
    }), {
      status: 200, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[forge-call-sync] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
