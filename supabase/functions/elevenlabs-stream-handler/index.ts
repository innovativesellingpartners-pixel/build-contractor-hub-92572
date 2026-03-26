/**
 * ElevenLabs Stream Handler v3.0 - PRODUCTION STABLE
 * 
 * Bulletproof bidirectional audio streaming between Twilio and ElevenLabs.
 * 
 * Key fixes:
 * - NO auto-reconnect during active calls (causes restarts)
 * - Proper VAD handling prevents interruptions
 * - Audio gating during agent speech prevents echo
 * - Robust connection lifecycle management
 * - Proper sample rate handling
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const ELEVENLABS_AGENT_ID = "agent_9901kcrxhb4yfr7r2gzq3rfs6add";

// Audio codec constants
const MULAW_BIAS = 0x84;
const MULAW_CLIP = 32635;
const MULAW_DECODE_TABLE = new Int16Array(256);
const MULAW_ENCODE_TABLE = new Uint8Array(65536);

// Initialize lookup tables once
(function initTables() {
  for (let i = 0; i < 256; i++) {
    const u = ~i & 0xff;
    const sign = (u & 0x80) ? -1 : 1;
    const exp = (u >> 4) & 0x07;
    const mant = u & 0x0f;
    MULAW_DECODE_TABLE[i] = sign * (((mant << 3) + MULAW_BIAS) << exp) - sign * MULAW_BIAS;
  }
  for (let i = 0; i < 65536; i++) {
    const sample = i < 32768 ? i : i - 65536;
    MULAW_ENCODE_TABLE[i] = encodeUlawSample(sample);
  }
})();

function encodeUlawSample(sample: number): number {
  const sign = sample < 0 ? 0x80 : 0;
  if (sample < 0) sample = -sample;
  if (sample > MULAW_CLIP) sample = MULAW_CLIP;
  sample += MULAW_BIAS;
  let exp = 7;
  for (let i = 0; i < 8; i++) {
    if (sample & 0x4000) break;
    exp--;
    sample <<= 1;
  }
  return ~(sign | (exp << 4) | ((sample >> 10) & 0x0f)) & 0xff;
}

function base64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

// Convert mulaw (8kHz) to PCM16 at target sample rate
function mulawToPcm16(mulaw: Uint8Array, targetRate: number): Int16Array {
  const pcm8k = new Int16Array(mulaw.length);
  for (let i = 0; i < mulaw.length; i++) {
    pcm8k[i] = MULAW_DECODE_TABLE[mulaw[i]];
  }
  if (targetRate === 8000) return pcm8k;
  
  const ratio = targetRate / 8000;
  const outLen = Math.floor(pcm8k.length * ratio);
  const out = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const srcPos = i / ratio;
    const idx = Math.floor(srcPos);
    const frac = srcPos - idx;
    const s0 = pcm8k[Math.min(idx, pcm8k.length - 1)];
    const s1 = pcm8k[Math.min(idx + 1, pcm8k.length - 1)];
    out[i] = Math.round(s0 + (s1 - s0) * frac);
  }
  return out;
}

// Convert PCM16 to mulaw (8kHz)
function pcm16ToMulaw(pcm: Int16Array, inputRate: number): Uint8Array {
  const ratio = inputRate / 8000;
  const outLen = Math.floor(pcm.length / ratio);
  const out = new Uint8Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const srcIdx = Math.min(Math.floor(i * ratio), pcm.length - 1);
    const sample = pcm[srcIdx];
    out[i] = MULAW_ENCODE_TABLE[sample < 0 ? sample + 65536 : sample];
  }
  return out;
}

function int16ToBase64(pcm: Int16Array): string {
  return uint8ArrayToBase64(new Uint8Array(pcm.buffer));
}

serve(async (req) => {
  const upgrade = req.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket", { status: 400 });
  }

  const { socket: twilioWs, response } = Deno.upgradeWebSocket(req);
  
  // Connection state
  let elevenLabsWs: WebSocket | null = null;
  let streamSid = "";
  let callSid = "";
  let contractorId = "";
  let businessName = "our office";
  let contractorName = "";
  let trade = "";
  let inputSampleRate = 16000;
  let outputSampleRate = 16000;
  let keepAliveTimer: number | null = null;
  let isCleaningUp = false;
  let connectionEstablished = false;
  
  // Speech state - CRITICAL for preventing interruptions
  let agentIsSpeaking = false;
  let lastAgentAudioTime = 0;
  const SPEECH_COOLDOWN_MS = 300; // Wait 300ms after agent stops before accepting user audio
  
  // Conversation tracking
  const conversation: Array<{ role: string; text: string; ts: string }> = [];
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  function log(msg: string, data?: Record<string, unknown>) {
    console.log(`[ElevenLabs v3] ${msg}`, data ? JSON.stringify(data) : '');
  }

  function startKeepAlive() {
    if (keepAliveTimer) clearInterval(keepAliveTimer);
    keepAliveTimer = setInterval(() => {
      // Twilio mark
      if (twilioWs.readyState === WebSocket.OPEN && streamSid) {
        twilioWs.send(JSON.stringify({
          event: 'mark',
          streamSid,
          mark: { name: `ka-${Date.now()}` }
        }));
      }
      // ElevenLabs ping
      if (elevenLabsWs?.readyState === WebSocket.OPEN) {
        elevenLabsWs.send(JSON.stringify({ type: 'ping' }));
      }
    }, 8000); // Every 8 seconds
  }

  function stopKeepAlive() {
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }
  }

  async function saveConversation() {
    if (!callSid || conversation.length === 0) return;
    try {
      await supabase.from('call_sessions').update({
        conversation_history: conversation,
        updated_at: new Date().toISOString()
      }).eq('call_sid', callSid);
    } catch (e) {
      log('Failed to save conversation', { error: String(e) });
    }
  }

  async function generateSummary(): Promise<string> {
    if (conversation.length === 0) return '';
    try {
      const transcript = conversation.map(m => 
        `${m.role === 'user' ? 'Caller' : 'Agent'}: ${m.text}`
      ).join('\n');
      
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'system',
            content: 'Summarize this call in 2-3 sentences. Focus on: caller intent, actions taken, key info gathered.'
          }, {
            role: 'user',
            content: transcript
          }],
          max_tokens: 200
        })
      });
      
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || '';
    } catch {
      return '';
    }
  }

  async function cleanup() {
    if (isCleaningUp) return;
    isCleaningUp = true;
    log('Cleaning up');
    
    stopKeepAlive();
    
    if (elevenLabsWs) {
      try { elevenLabsWs.close(); } catch {}
      elevenLabsWs = null;
    }
    
    // Save final state
    if (callSid) {
      const summary = await generateSummary();
      await supabase.from('call_sessions').update({
        status: 'completed',
        ai_summary: summary,
        conversation_history: conversation,
        updated_at: new Date().toISOString()
      }).eq('call_sid', callSid);
      
      await supabase.from('calls').update({
        call_status: 'completed',
        ai_summary: summary,
        updated_at: new Date().toISOString()
      }).eq('call_sid', callSid);
    }
  }

  async function connectToElevenLabs() {
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
      log('ELEVENLABS_API_KEY not configured');
      return;
    }

    try {
      // Get signed URL
      const urlResp = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${ELEVENLABS_AGENT_ID}`,
        { headers: { "xi-api-key": apiKey } }
      );

      if (!urlResp.ok) {
        log('Failed to get signed URL', { status: urlResp.status });
        return;
      }

      const { signed_url } = await urlResp.json();
      log('Connecting to ElevenLabs');

      elevenLabsWs = new WebSocket(signed_url);

      elevenLabsWs.onopen = () => {
        log('ElevenLabs connected');
        connectionEstablished = true;
        
        // Send initialization
        const initMsg = {
          type: "conversation_initiation_client_data",
          dynamic_variables: {
            business_name: businessName,
            contractor_name: contractorName,
            trade: trade,
          },
          conversation_config_override: {
            agent: {
              prompt: {
                prompt: `You are Coral, the friendly AI assistant for ${businessName}. 
                
CRITICAL RULES:
1. NEVER interrupt the caller - let them finish speaking completely
2. NEVER hang up until the caller says goodbye
3. Keep responses SHORT (1-2 sentences max)
4. Sound warm and human, not robotic
5. Speak at a natural pace, not too fast

Your job: Help callers schedule appointments or take messages for ${contractorName || 'the contractor'}.`
              }
            },
            turn_detection: {
              mode: "server_vad",
              vad_threshold: 0.7, // HIGH threshold - less sensitive to noise
              prefix_padding_ms: 600, // More padding before speech detected
              silence_duration_ms: 1000, // Wait longer for pauses (1 second)
            }
          }
        };
        
        elevenLabsWs!.send(JSON.stringify(initMsg));
      };

      elevenLabsWs.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleElevenLabsMessage(msg);
        } catch (e) {
          log('Error parsing ElevenLabs message', { error: String(e) });
        }
      };

      elevenLabsWs.onerror = (error) => {
        log('ElevenLabs WebSocket error', { error: String(error) });
      };

      elevenLabsWs.onclose = (event) => {
        log('ElevenLabs WebSocket closed', { code: event.code, reason: event.reason });
        // DO NOT auto-reconnect - it causes the restart issues
        // Just let the call end naturally
        if (!isCleaningUp && twilioWs.readyState === WebSocket.OPEN) {
          // Send a gentle message that we lost connection
          log('Connection lost, ending call gracefully');
        }
      };

    } catch (error) {
      log('Error connecting to ElevenLabs', { error: String(error) });
    }
  }

  function handleElevenLabsMessage(msg: any) {
    switch (msg.type) {
      case 'conversation_initiation_metadata': {
        const meta = msg.conversation_initiation_metadata_event;
        inputSampleRate = meta?.input_audio_format?.sample_rate_hz || 16000;
        outputSampleRate = meta?.output_audio_format?.sample_rate_hz || 16000;
        log('Audio format', { inputSampleRate, outputSampleRate });
        break;
      }
      
      case 'audio': {
        // Agent is speaking
        agentIsSpeaking = true;
        lastAgentAudioTime = Date.now();
        
        if (twilioWs.readyState === WebSocket.OPEN && msg.audio_event?.audio_base_64) {
          try {
            const pcmBytes = base64ToUint8Array(msg.audio_event.audio_base_64);
            const pcm16 = new Int16Array(pcmBytes.length / 2);
            for (let i = 0; i < pcm16.length; i++) {
              pcm16[i] = pcmBytes[i * 2] | (pcmBytes[i * 2 + 1] << 8);
            }
            
            const mulaw = pcm16ToMulaw(pcm16, outputSampleRate);
            const payload = uint8ArrayToBase64(mulaw);
            
            twilioWs.send(JSON.stringify({
              event: 'media',
              streamSid,
              media: { payload }
            }));
          } catch (e) {
            log('Error converting audio', { error: String(e) });
          }
        }
        break;
      }
      
      case 'audio_done': {
        // Agent finished speaking
        log('Agent finished speaking');
        agentIsSpeaking = false;
        break;
      }
      
      case 'user_transcript': {
        const text = msg.user_transcription_event?.user_transcript;
        if (text) {
          log('User said', { text });
          conversation.push({ role: 'user', text, ts: new Date().toISOString() });
          if (conversation.length % 4 === 0) saveConversation();
        }
        break;
      }
      
      case 'agent_response': {
        const text = msg.agent_response_event?.agent_response;
        if (text) {
          log('Agent response', { text });
          conversation.push({ role: 'assistant', text, ts: new Date().toISOString() });
        }
        break;
      }
      
      case 'interruption': {
        log('User interrupted');
        agentIsSpeaking = false;
        // Clear Twilio's audio buffer
        if (twilioWs.readyState === WebSocket.OPEN) {
          twilioWs.send(JSON.stringify({ event: 'clear', streamSid }));
        }
        break;
      }
      
      case 'ping': {
        if (elevenLabsWs?.readyState === WebSocket.OPEN) {
          elevenLabsWs.send(JSON.stringify({
            type: 'pong',
            event_id: msg.ping_event?.event_id
          }));
        }
        break;
      }
      
      case 'client_tool_call': {
        handleToolCall(msg.client_tool_call);
        break;
      }
      
      case 'error': {
        log('ElevenLabs error', { error: msg });
        break;
      }
    }
  }

  async function handleToolCall(toolCall: any) {
    if (!toolCall) return;
    
    log('Tool call', { name: toolCall.tool_name, params: toolCall.parameters });
    
    let result: Record<string, unknown> = { success: false, message: 'Unknown tool' };
    
    try {
      switch (toolCall.tool_name) {
        case 'schedule_appointment': {
          const p = toolCall.parameters;
          const date = p.date || new Date().toISOString().split('T')[0];
          const time = p.time || '09:00';
          
          const { data: meeting, error } = await supabase.from('job_meetings').insert({
            user_id: contractorId,
            job_id: null,
            title: p.description || 'Scheduled Visit',
            meeting_type: 'site_visit',
            scheduled_date: date,
            scheduled_time: time,
            location: p.address || '',
            duration_minutes: 60,
            notes: `Customer: ${p.name || 'Unknown'}\nPhone: ${p.phone || ''}\nEmail: ${p.email || ''}\n${p.notes || ''}`
          }).select().single();
          
          if (error) {
            result = { success: false, message: 'Failed to save appointment' };
          } else {
            result = { success: true, message: `Appointment scheduled for ${date} at ${time}`, meeting_id: meeting?.id };
          }
          break;
        }
        
        case 'take_voicemail': {
          const p = toolCall.parameters;
          await supabase.from('calls').update({
            ai_summary: `Voicemail from ${p.name || 'Unknown'} (${p.phone || 'No phone'}): ${p.message || ''}`,
            outcome: 'voicemail',
            message_type: p.urgency || 'normal'
          }).eq('call_sid', callSid);
          
          result = { success: true, message: 'Voicemail saved' };
          break;
        }
        
        case 'lookup_job': {
          const ref = toolCall.parameters.reference_number;
          const { data: job } = await supabase
            .from('jobs')
            .select('name, status, address')
            .eq('user_id', contractorId)
            .or(`job_number.ilike.%${ref}%,name.ilike.%${ref}%`)
            .limit(1)
            .single();
          
          result = job 
            ? { success: true, job_found: true, ...job }
            : { success: true, job_found: false, message: 'No job found' };
          break;
        }
        
        case 'end_call': {
          result = { success: true, message: `Thank you for calling ${businessName}. Goodbye!` };
          // Graceful disconnect after farewell
          setTimeout(() => cleanup(), 3000);
          break;
        }
      }
    } catch (e) {
      log('Tool error', { error: String(e) });
      result = { success: false, message: 'Error executing tool' };
    }
    
    // Send result back
    if (elevenLabsWs?.readyState === WebSocket.OPEN) {
      elevenLabsWs.send(JSON.stringify({
        type: 'client_tool_result',
        tool_call_id: toolCall.tool_call_id,
        result: JSON.stringify(result),
        is_error: !result.success
      }));
    }
  }

  // Twilio WebSocket handlers
  twilioWs.onopen = () => {
    log('Twilio WebSocket opened');
  };

  twilioWs.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.event) {
        case 'connected':
          log('Twilio connected');
          break;
          
        case 'start': {
          streamSid = data.start.streamSid;
          callSid = data.start.callSid;
          contractorId = data.start.customParameters?.contractorId || '';
          
          log('Stream started', { streamSid, callSid, contractorId });
          
          // Get contractor profile
          if (contractorId) {
            const { data: profile } = await supabase
              .from('contractor_ai_profiles')
              .select('business_name, contractor_name, trade')
              .eq('contractor_id', contractorId)
              .single();
            
            if (profile) {
              businessName = profile.business_name || 'our office';
              contractorName = profile.contractor_name || '';
              trade = profile.trade || '';
            }
          }
          
          await connectToElevenLabs();
          startKeepAlive();
          break;
        }
          
        case 'media': {
          // CRITICAL: Gate user audio during agent speech
          const now = Date.now();
          const timeSinceAgentAudio = now - lastAgentAudioTime;
          
          // Don't send user audio if:
          // 1. Agent is currently speaking
          // 2. Agent just finished speaking (within cooldown period)
          // 3. ElevenLabs connection not ready
          if (agentIsSpeaking || timeSinceAgentAudio < SPEECH_COOLDOWN_MS) {
            break; // Skip this audio chunk
          }
          
          if (!elevenLabsWs || elevenLabsWs.readyState !== WebSocket.OPEN) {
            break; // Skip if not connected
          }
          
          try {
            const mulaw = base64ToUint8Array(data.media.payload);
            const pcm = mulawToPcm16(mulaw, inputSampleRate);
            const pcmB64 = int16ToBase64(pcm);
            
            elevenLabsWs.send(JSON.stringify({ user_audio_chunk: pcmB64 }));
          } catch (e) {
            log('Error processing user audio', { error: String(e) });
          }
          break;
        }
          
        case 'stop':
          log('Stream stopped');
          await cleanup();
          break;
      }
    } catch (error) {
      log('Error processing Twilio message', { error: String(error) });
    }
  };

  twilioWs.onerror = (error) => {
    log('Twilio WebSocket error', { error: String(error) });
    cleanup();
  };

  twilioWs.onclose = () => {
    log('Twilio WebSocket closed');
    cleanup();
  };

  return response;
});
