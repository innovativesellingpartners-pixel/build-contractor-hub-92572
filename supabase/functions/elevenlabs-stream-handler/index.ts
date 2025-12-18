/**
 * ElevenLabs Stream Handler - Bridges Twilio Media Streams to ElevenLabs Conversational AI
 * 
 * This WebSocket handler receives audio from Twilio (mulaw 8kHz) and converts it to PCM
 * for ElevenLabs, then converts ElevenLabs PCM response back to mulaw for Twilio.
 * 
 * Agent ID: agent_9901kcrxhb4yfr7r2gzq3rfs6add
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const ELEVENLABS_AGENT_ID = "agent_9901kcrxhb4yfr7r2gzq3rfs6add";

/**
 * µ-law encoding/decoding lookup tables (ITU-T G.711)
 * Keep Twilio audio clean: Twilio Media Streams expect 8kHz µ-law.
 */
const MULAW_BIAS = 0x84;
const MULAW_CLIP = 32635;

const MULAW_DECODE_TABLE = new Int16Array(256);
const MULAW_ENCODE_TABLE = new Uint8Array(65536);

function encodeUlawSample(sample: number): number {
  const sign = sample < 0 ? 0x80 : 0;
  if (sample < 0) sample = -sample;
  if (sample > MULAW_CLIP) sample = MULAW_CLIP;

  sample += MULAW_BIAS;

  let exponent = 7;
  const expMask = 0x4000;
  for (let i = 0; i < 8; i++) {
    if (sample & expMask) break;
    exponent--;
    sample <<= 1;
  }

  const mantissa = (sample >> 10) & 0x0f;
  return ~(sign | (exponent << 4) | mantissa) & 0xff;
}

// Initialize decode table
// ITU-T G.711 µ-law: the encoded byte is bit-inverted, so we invert back during decode
for (let i = 0; i < 256; i++) {
  // Invert the byte first (G.711 µ-law stores inverted)
  const u = ~i & 0xff;
  const sign = (u & 0x80) ? -1 : 1;
  const exponent = (u >> 4) & 0x07;
  const mantissa = u & 0x0f;
  const magnitude = ((mantissa << 3) + MULAW_BIAS) << exponent;
  MULAW_DECODE_TABLE[i] = sign * (magnitude - MULAW_BIAS);
}

// Initialize encode table
for (let i = 0; i < 65536; i++) {
  const sample = i < 32768 ? i : i - 65536;
  MULAW_ENCODE_TABLE[i] = encodeUlawSample(sample);
}

// Convert mulaw bytes to PCM16 and upsample from 8kHz to target sample rate
function mulawToPcm16(mulawData: Uint8Array, targetSampleRate: number): Int16Array {
  // First decode mulaw to PCM at 8kHz
  const pcm8k = new Int16Array(mulawData.length);
  for (let i = 0; i < mulawData.length; i++) {
    pcm8k[i] = MULAW_DECODE_TABLE[mulawData[i]];
  }

  if (targetSampleRate === 8000) return pcm8k;

  const ratio = targetSampleRate / 8000;
  const outLength = Math.max(1, Math.floor(pcm8k.length * ratio));
  const pcmOut = new Int16Array(outLength);

  for (let i = 0; i < outLength; i++) {
    const srcPos = i / ratio;
    const idx = Math.floor(srcPos);
    const frac = srcPos - idx;

    const s0 = pcm8k[Math.min(idx, pcm8k.length - 1)];
    const s1 = pcm8k[Math.min(idx + 1, pcm8k.length - 1)];
    pcmOut[i] = Math.round(s0 + (s1 - s0) * frac);
  }

  return pcmOut;
}

/**
 * Simple low-pass filter to prevent aliasing when downsampling.
 * Uses a moving average with a window size based on the downsample ratio.
 */
function lowPassFilter(pcmData: Int16Array, windowSize: number): Int16Array {
  if (windowSize <= 1) return pcmData;
  
  const halfWindow = Math.floor(windowSize / 2);
  const filtered = new Int16Array(pcmData.length);
  
  for (let i = 0; i < pcmData.length; i++) {
    let sum = 0;
    let count = 0;
    
    for (let j = -halfWindow; j <= halfWindow; j++) {
      const idx = i + j;
      if (idx >= 0 && idx < pcmData.length) {
        sum += pcmData[idx];
        count++;
      }
    }
    
    filtered[i] = Math.round(sum / count);
  }
  
  return filtered;
}

// Resample PCM16 to 8kHz and encode to µ-law with anti-aliasing filter
function pcm16ToMulaw(pcmData: Int16Array, inputSampleRate: number): Uint8Array {
  const targetRate = 8000;
  const ratio = inputSampleRate / targetRate;
  
  // Apply low-pass filter before downsampling to prevent aliasing (fuzzy s's)
  // Window size should be at least the downsample ratio
  const filterWindowSize = Math.max(3, Math.ceil(ratio));
  const filteredData = lowPassFilter(pcmData, filterWindowSize);
  
  const outputLength = Math.max(1, Math.floor(filteredData.length / ratio));

  // Downsample using simple decimation (taking every Nth sample)
  // This is safe now because we've already filtered out high frequencies
  const mulaw = new Uint8Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const srcIdx = Math.min(Math.floor(i * ratio), filteredData.length - 1);
    const sample = filteredData[srcIdx];

    const tableIdx = sample < 0 ? sample + 65536 : sample;
    mulaw[i] = MULAW_ENCODE_TABLE[tableIdx];
  }

  return mulaw;
}

// Base64 helpers
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function int16ArrayToBase64(int16: Int16Array): string {
  const uint8 = new Uint8Array(int16.buffer);
  return uint8ArrayToBase64(uint8);
}

serve(async (req) => {
  // Handle WebSocket upgrade
  const upgrade = req.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket", { status: 400 });
  }

  const { socket: twilioWs, response } = Deno.upgradeWebSocket(req);
  
  let elevenLabsWs: WebSocket | null = null;
  let streamSid: string = "";
  let callSid: string = "";
  let contractorId: string = "";
  let businessName: string = "our office";
  let contractorName: string = "";
  let trade: string = "";
  let elevenInputSampleRate = 16000;
  let elevenOutputSampleRate = 16000;
  let keepAliveInterval: number | null = null;

  // Reconnect state (ElevenLabs signed_url can expire quickly; we reconnect without dropping the call)
  let reconnectTimer: number | null = null;
  let reconnectAttempts = 0;
  let isCleaningUp = false;
  let hasEverConnectedToElevenLabs = false;

  // When ElevenLabs drops mid-call, buffer a small amount of user audio so we can
  // flush it immediately after reconnect (prevents "I can't hear you" and restarts).
  const MAX_PENDING_AUDIO_CHUNKS = 80;
  const pendingUserAudioChunks: string[] = [];

  // Conversation transcript accumulator
  const conversationMessages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }> = [];
  let lastScheduledMeeting: string | null = null;
  let lastVoicemail: string | null = null;
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('[ElevenLabs Handler] WebSocket connection established');

  function enqueueUserAudioChunk(pcmBase64: string) {
    pendingUserAudioChunks.push(pcmBase64);
    if (pendingUserAudioChunks.length > MAX_PENDING_AUDIO_CHUNKS) {
      pendingUserAudioChunks.splice(0, pendingUserAudioChunks.length - MAX_PENDING_AUDIO_CHUNKS);
    }
  }

  function flushPendingUserAudio() {
    if (!elevenLabsWs || elevenLabsWs.readyState !== WebSocket.OPEN) return;
    if (!pendingUserAudioChunks.length) return;

    const chunks = pendingUserAudioChunks.splice(0, pendingUserAudioChunks.length);
    for (const pcmBase64 of chunks) {
      try {
        elevenLabsWs.send(JSON.stringify({ user_audio_chunk: pcmBase64 }));
      } catch (err) {
        console.error('[ElevenLabs Handler] Failed to flush buffered audio chunk:', err);
        // If sending fails mid-flush, re-buffer remaining chunks and bail.
        enqueueUserAudioChunk(pcmBase64);
        break;
      }
    }
  }

  function buildResumeContextText() {
    // Keep it short to avoid blowing up context.
    const lastTurns = conversationMessages.slice(-12);
    const transcript = lastTurns
      .map((m) => `${m.role === 'user' ? 'Caller' : 'Agent'}: ${m.content}`)
      .join('\n');

    const extras = [
      lastScheduledMeeting ? `Latest scheduled appointment: ${lastScheduledMeeting}` : null,
      lastVoicemail ? `Latest voicemail taken: ${lastVoicemail}` : null,
    ].filter(Boolean);

    return [
      'We were mid-call but the connection briefly dropped and reconnected.',
      'Continue the same conversation naturally. Do NOT restart with an intro/greeting.',
      transcript ? `Recent transcript:\n${transcript}` : null,
      extras.length ? extras.join('\n') : null,
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  function sendResumeContextIfNeeded() {
    if (!elevenLabsWs || elevenLabsWs.readyState !== WebSocket.OPEN) return;
    // Only send on reconnects (not first connect).
    if (!hasEverConnectedToElevenLabs) return;
    if (!conversationMessages.length && !lastScheduledMeeting && !lastVoicemail) return;

    try {
      elevenLabsWs.send(
        JSON.stringify({
          type: 'contextual_update',
          text: buildResumeContextText(),
        })
      );
    } catch (err) {
      console.error('[ElevenLabs Handler] Failed to send resume contextual update:', err);
    }
  }

  // Keep-alive ping to prevent idle timeouts
  function startKeepAlive() {
    if (keepAliveInterval) clearInterval(keepAliveInterval);

    keepAliveInterval = setInterval(() => {
      console.log('[ElevenLabs Handler] Keep-alive ping');

      // Send mark event to Twilio to keep connection alive
      if (twilioWs.readyState === WebSocket.OPEN && streamSid) {
        twilioWs.send(
          JSON.stringify({
            event: 'mark',
            streamSid: streamSid,
            mark: { name: 'keepalive-' + Date.now() },
          })
        );
      }

      // Send ping to ElevenLabs
      if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) {
        elevenLabsWs.send(
          JSON.stringify({
            type: 'ping',
          })
        );
      }
    }, 10000); // ~every 10s
  }

  function stopKeepAlive() {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
  }

  function scheduleElevenReconnect(reason: string) {
    if (isCleaningUp) return;
    if (twilioWs.readyState !== WebSocket.OPEN) return;

    reconnectAttempts += 1;
    const delayMs = Math.min(5000, 500 * reconnectAttempts);
    console.log(
      `[ElevenLabs Handler] Scheduling ElevenLabs reconnect in ${delayMs}ms (attempt ${reconnectAttempts}) — reason: ${reason}`
    );

    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(async () => {
      if (isCleaningUp) return;
      if (twilioWs.readyState !== WebSocket.OPEN) return;

      try {
        if (elevenLabsWs) {
          try {
            elevenLabsWs.close();
          } catch {
            // ignore
          }
          elevenLabsWs = null;
        }

        await connectToElevenLabs();
        // successful connect resets attempt counter
        reconnectAttempts = 0;
      } catch (err) {
        console.error('[ElevenLabs Handler] Reconnect attempt failed:', err);
        scheduleElevenReconnect('reconnect_failed');
      }
    }, delayMs);
  }

  twilioWs.onopen = () => {
    console.log('[ElevenLabs Handler] Twilio WebSocket opened');
  };

  twilioWs.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.event) {
        case 'connected':
          console.log('[ElevenLabs Handler] Twilio connected event');
          break;
          
        case 'start':
          streamSid = data.start.streamSid;
          callSid = data.start.callSid;
          
          // Extract custom parameters
          if (data.start.customParameters) {
            contractorId = data.start.customParameters.contractorId || '';
          }
          
          console.log('[ElevenLabs Handler] Stream started:', { streamSid, callSid, contractorId });
          
          // Fetch contractor profile to get business_name
          if (contractorId) {
            const { data: aiProfile } = await supabase
              .from('contractor_ai_profiles')
              .select('business_name, contractor_name, trade')
              .eq('contractor_id', contractorId)
              .single();
            
            if (aiProfile) {
              businessName = aiProfile.business_name || 'our office';
              contractorName = aiProfile.contractor_name || '';
              trade = aiProfile.trade || '';
              console.log('[ElevenLabs Handler] Got contractor profile:', { businessName, contractorName, trade });
            }
          }
          
          // Connect to ElevenLabs agent
          await connectToElevenLabs();
          
          // Start keep-alive pings
          startKeepAlive();
          break;
          
        case 'media': {
          // Forward audio to ElevenLabs (convert mulaw 8kHz → PCM at ElevenLabs input sample rate)
          try {
            const mulawBytes = base64ToUint8Array(data.media.payload);
            const pcm = mulawToPcm16(mulawBytes, elevenInputSampleRate);

            // Debug: Log audio levels periodically to verify audio is being received
            if (Math.random() < 0.01) { // Log ~1% of audio chunks
              let maxLevel = 0;
              for (let i = 0; i < pcm.length; i++) {
                const absVal = Math.abs(pcm[i]);
                if (absVal > maxLevel) maxLevel = absVal;
              }
              console.log('[ElevenLabs Handler] Audio chunk - bytes:', mulawBytes.length, 'pcm samples:', pcm.length, 'max level:', maxLevel);
            }

            const pcmBase64 = int16ArrayToBase64(pcm);

            if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) {
              elevenLabsWs.send(JSON.stringify({ user_audio_chunk: pcmBase64 }));
            } else {
              // Buffer while reconnecting so the agent doesn't lose the user's speech.
              enqueueUserAudioChunk(pcmBase64);
            }
          } catch (err) {
            console.error('[ElevenLabs Handler] Error converting audio:', err);
          }
          break;
        }
          
        case 'stop':
          console.log('[ElevenLabs Handler] Stream stopped');
          cleanup();
          break;
          
        default:
          // Ignore other events like 'mark'
          break;
      }
    } catch (error) {
      console.error('[ElevenLabs Handler] Error processing Twilio message:', error);
    }
  };

  twilioWs.onerror = (error) => {
    console.error('[ElevenLabs Handler] Twilio WebSocket error:', error);
    cleanup();
  };

  twilioWs.onclose = () => {
    console.log('[ElevenLabs Handler] Twilio WebSocket closed');
    cleanup();
  };

  async function connectToElevenLabs() {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!ELEVENLABS_API_KEY) {
      console.error('[ElevenLabs Handler] ELEVENLABS_API_KEY not configured');
      return;
    }

    try {
      // Get signed URL for the agent
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${ELEVENLABS_AGENT_ID}`,
        {
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ElevenLabs Handler] Failed to get signed URL:', response.status, errorText);
        return;
      }

      const { signed_url } = await response.json();
      console.log('[ElevenLabs Handler] Got signed URL, connecting to ElevenLabs agent');

      // Connect to ElevenLabs WebSocket
      elevenLabsWs = new WebSocket(signed_url);

      elevenLabsWs.onopen = () => {
        console.log('[ElevenLabs Handler] ElevenLabs WebSocket connected');

        // Send initial configuration with dynamic variables
        const initMessage = {
          type: "conversation_initiation_client_data",
          dynamic_variables: {
            business_name: businessName,
            contractor_name: contractorName,
            trade: trade,
            farewell_message: `Thank you for calling ${businessName}. Have a wonderful day!`,
            email_collection_reminder: "Always ask for the caller's email address when scheduling appointments so you can send them a calendar invite and confirmation email."
          }
        };

        console.log('[ElevenLabs Handler] Sending init message:', initMessage);
        elevenLabsWs!.send(JSON.stringify(initMessage));

        // If we've connected before during this call, this is a reconnect. Send context
        // so the agent doesn't "start over".
        sendResumeContextIfNeeded();

        // Mark that we've successfully connected at least once.
        hasEverConnectedToElevenLabs = true;

        // Immediately flush any buffered caller audio captured during reconnect.
        flushPendingUserAudio();
      };

      elevenLabsWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'conversation_initiation_metadata': {
              const meta = data.conversation_initiation_metadata_event;
              console.log('[ElevenLabs Handler] Conversation initiation metadata:', meta);
              console.log('[ElevenLabs Handler] Conversation initiated:', meta?.conversation_id);

              // Try to infer audio sample rates from metadata if present
              const inferredInput = meta?.input_audio_format?.sample_rate_hz ?? meta?.input_audio_format?.sample_rate ?? meta?.input_audio_format?.sample_rate_hz;
              const inferredOutput = meta?.output_audio_format?.sample_rate_hz ?? meta?.output_audio_format?.sample_rate ?? meta?.output_audio_format?.sample_rate_hz;

              if (typeof inferredInput === 'number' && inferredInput > 0) {
                elevenInputSampleRate = inferredInput;
                console.log('[ElevenLabs Handler] Using ElevenLabs input sample rate:', elevenInputSampleRate);
              }
              if (typeof inferredOutput === 'number' && inferredOutput > 0) {
                elevenOutputSampleRate = inferredOutput;
                console.log('[ElevenLabs Handler] Using ElevenLabs output sample rate:', elevenOutputSampleRate);
              }
              break;
            }
              
            case 'audio':
              // Forward audio back to Twilio (convert PCM → mulaw 8kHz)
              if (twilioWs.readyState === WebSocket.OPEN && data.audio_event?.audio_base_64) {
                try {
                  const pcmBytes = base64ToUint8Array(data.audio_event.audio_base_64);

                  // Convert bytes to Int16 samples (little-endian)
                  const pcm16 = new Int16Array(pcmBytes.length / 2);
                  for (let i = 0; i < pcm16.length; i++) {
                    pcm16[i] = pcmBytes[i * 2] | (pcmBytes[i * 2 + 1] << 8);
                  }

                  const mulawBytes = pcm16ToMulaw(pcm16, elevenOutputSampleRate);
                  const mulawBase64 = uint8ArrayToBase64(mulawBytes);
                  
                  twilioWs.send(JSON.stringify({
                    event: 'media',
                    streamSid: streamSid,
                    media: {
                      payload: mulawBase64
                    }
                  }));
                } catch (err) {
                  console.error('[ElevenLabs Handler] Error converting ElevenLabs audio:', err);
                }
              }
              break;
              
            case 'user_transcript': {
              const userText = data.user_transcription_event?.user_transcript;
              if (userText) {
                console.log('[ElevenLabs Handler] User said:', userText);
                conversationMessages.push({
                  role: 'user',
                  content: userText,
                  timestamp: new Date().toISOString()
                });
                // Periodically save conversation to database
                if (conversationMessages.length % 4 === 0 && callSid) {
                  supabase.from('call_sessions').update({
                    conversation_history: conversationMessages,
                    updated_at: new Date().toISOString()
                  }).eq('call_sid', callSid).then(() => {
                    console.log('[ElevenLabs Handler] Conversation saved (interim)');
                  });
                }
              }
              break;
            }
              
            case 'agent_response': {
              const agentText = data.agent_response_event?.agent_response;
              if (agentText) {
                console.log('[ElevenLabs Handler] Agent response:', agentText);
                conversationMessages.push({
                  role: 'assistant',
                  content: agentText,
                  timestamp: new Date().toISOString()
                });
              }
              break;
            }
              
            case 'interruption':
              console.log('[ElevenLabs Handler] User interrupted');
              // Clear Twilio's audio buffer
              if (twilioWs.readyState === WebSocket.OPEN) {
                twilioWs.send(JSON.stringify({
                  event: 'clear',
                  streamSid: streamSid
                }));
              }
              break;
              
            case 'ping':
              // Respond to ping with pong
              if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) {
                elevenLabsWs.send(JSON.stringify({
                  type: 'pong',
                  event_id: data.ping_event?.event_id
                }));
              }
              break;
              
            case 'client_tool_call':
              // Handle tool calls from the agent
              handleToolCall(data);
              break;
              
            default:
              console.log('[ElevenLabs Handler] ElevenLabs event:', data.type);
          }
        } catch (error) {
          console.error('[ElevenLabs Handler] Error processing ElevenLabs message:', error);
        }
      };

      elevenLabsWs.onerror = (error) => {
        console.error('[ElevenLabs Handler] ElevenLabs WebSocket error:', error);
        scheduleElevenReconnect('eleven_ws_error');
      };

      elevenLabsWs.onclose = (event) => {
        console.log('[ElevenLabs Handler] ElevenLabs WebSocket closed:', event.code, event.reason);
        scheduleElevenReconnect(`eleven_ws_close_${event.code}`);
      };

    } catch (error) {
      console.error('[ElevenLabs Handler] Error connecting to ElevenLabs:', error);
    }
  }

  async function handleToolCall(data: any) {
    const toolCall = data.client_tool_call;
    if (!toolCall) return;
    
    console.log('[ElevenLabs Handler] Tool call:', toolCall.tool_name, toolCall.parameters);
    
    let result: Record<string, any> = { success: false, message: "Unknown tool" };
    
    try {
      switch (toolCall.tool_name) {
        case 'schedule_appointment': {
          // Save appointment to database
          const appointmentData = toolCall.parameters;
          const scheduledDate = appointmentData.date || new Date().toISOString().split('T')[0];
          const scheduledTime = appointmentData.time || '09:00';
          const location = appointmentData.address || '';
          const customerName = appointmentData.name || 'Customer';
          const customerPhone = appointmentData.phone || '';
          const customerEmail = appointmentData.email || '';
          const description = appointmentData.description || 'Scheduled Visit';
          
          // 1. Insert job_meetings record
          const { data: meeting, error: meetingError } = await supabase.from('job_meetings').insert({
            user_id: contractorId,
            job_id: null,
            title: description,
            meeting_type: 'site_visit',
            scheduled_date: scheduledDate,
            scheduled_time: scheduledTime,
            location: location,
            duration_minutes: 60,
            notes: `Customer: ${customerName}\nPhone: ${customerPhone}\nEmail: ${customerEmail}\n${appointmentData.notes || ''}`
          }).select().single();
          
          if (meetingError) {
            console.error('[ElevenLabs Handler] Failed to create meeting:', meetingError);
            result = { success: false, message: "Failed to save appointment" };
            break;
          }
          
          console.log('[ElevenLabs Handler] Meeting created:', meeting?.id);
          
          // 2. Create calendar event via edge function (server-to-server call)
          try {
            const calendarPayload = {
              jobId: meeting?.id || 'voice-ai-booking',
              jobName: `${description} - ${customerName}`,
              description: `Voice AI Scheduled Visit\nCustomer: ${customerName}\nPhone: ${customerPhone}\nAddress: ${location}`,
              startDate: `${scheduledDate}T${scheduledTime}:00`,
              endDate: `${scheduledDate}T${String(parseInt(scheduledTime.split(':')[0]) + 1).padStart(2, '0')}:${scheduledTime.split(':')[1]}:00`,
              location: location,
              address: location,
              contractorId: contractorId, // Pass for service role call
            };
            
            // Get contractor's calendar connection
            const { data: calendarConnection } = await supabase
              .from('calendar_connections')
              .select('*')
              .eq('user_id', contractorId)
              .limit(1)
              .single();
              
            if (calendarConnection) {
              console.log('[ElevenLabs Handler] Found calendar connection, creating event...');
              // Call the create-calendar-event function internally
              const calResponse = await fetch(
                `${Deno.env.get('SUPABASE_URL')}/functions/v1/create-calendar-event`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                  },
                  body: JSON.stringify(calendarPayload),
                }
              );
              const calResult = await calResponse.json();
              console.log('[ElevenLabs Handler] Calendar event result:', calResult);
            } else {
              console.log('[ElevenLabs Handler] No calendar connection for contractor');
            }
          } catch (calError) {
            console.error('[ElevenLabs Handler] Calendar event error:', calError);
            // Don't fail the whole operation if calendar fails
          }
          
          // 3. Send email confirmation if customer email provided
          if (customerEmail) {
            try {
              console.log('[ElevenLabs Handler] Sending email confirmation to:', customerEmail);
              
              // Get contractor profile for business info
              const { data: profile } = await supabase
                .from('profiles')
                .select('business_name, business_phone, business_email')
                .eq('id', contractorId)
                .single();
              
              const emailPayload = {
                recipientEmail: customerEmail,
                meetingTitle: description,
                meetingDate: scheduledDate,
                meetingTime: scheduledTime,
                duration: 60,
                location: location,
                notes: `Scheduled by ${profile?.business_name || businessName} AI Assistant.\n\nWe look forward to seeing you!`,
                contractorId: contractorId, // Pass for service role call
              };
              
              const emailResponse = await fetch(
                `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-meeting-invite`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                  },
                  body: JSON.stringify(emailPayload),
                }
              );
              const emailResult = await emailResponse.json();
              console.log('[ElevenLabs Handler] Email result:', emailResult);
            } catch (emailError) {
              console.error('[ElevenLabs Handler] Email error:', emailError);
              // Don't fail the operation if email fails
            }
          }
          
          // Track that we scheduled a meeting
          lastScheduledMeeting = `Appointment with ${customerName} on ${scheduledDate} at ${scheduledTime}. Location: ${location || 'TBD'}. Phone: ${customerPhone || 'Not provided'}. Email: ${customerEmail || 'Not provided'}.`;
          
          result = { 
            success: true, 
            message: `Appointment scheduled for ${scheduledDate} at ${scheduledTime}. ${customerEmail ? 'Confirmation email sent.' : 'No email provided for confirmation.'}`,
            meeting_id: meeting?.id
          };
          break;
        }
          
        case 'take_voicemail': {
          // Save voicemail message
          const voicemailData = toolCall.parameters;
          await supabase.from('calls').update({
            ai_summary: `Voicemail from ${voicemailData.name} (${voicemailData.phone}): ${voicemailData.message}`,
            outcome: 'voicemail',
            message_type: voicemailData.urgency || 'normal'
          }).eq('call_sid', callSid);
          
          // Track the voicemail
          lastVoicemail = `Voicemail from ${voicemailData.name || 'Unknown'} (${voicemailData.phone || 'No phone'}): ${voicemailData.message || 'No message'}. Urgency: ${voicemailData.urgency || 'normal'}.`;
          
          result = { success: true, message: "Voicemail saved successfully" };
          break;
        }
          
        case 'lookup_job': {
          // Look up job by reference number
          const { reference_number } = toolCall.parameters;
          const { data: job } = await supabase
            .from('jobs')
            .select('name, status, address, description')
            .eq('user_id', contractorId)
            .or(`job_number.ilike.%${reference_number}%,name.ilike.%${reference_number}%`)
            .limit(1)
            .single();
          
          if (job) {
            result = { 
              success: true, 
              job_found: true,
              job_name: job.name,
              job_status: job.status,
              job_address: job.address,
              job_description: job.description
            };
          } else {
            result = { success: true, job_found: false, message: "No job found with that reference" };
          }
          break;
        }
          
        case 'end_call': {
          // Agent is ready to end the call gracefully
          console.log('[ElevenLabs Handler] Agent ending call gracefully');
          result = { 
            success: true, 
            message: `Call ended. Thank you for calling ${businessName}.`
          };
          
          // Wait a moment to let the farewell play, then clean up
          setTimeout(() => {
            console.log('[ElevenLabs Handler] Closing connections after farewell');
            if (twilioWs.readyState === WebSocket.OPEN) {
              // Send a stop event to Twilio to end the call
              twilioWs.send(JSON.stringify({
                event: 'stop',
                streamSid: streamSid
              }));
            }
            cleanup();
          }, 3000); // 3 second delay to let farewell play
          break;
        }
          
        default:
          console.log('[ElevenLabs Handler] Unknown tool:', toolCall.tool_name);
      }
    } catch (error) {
      console.error('[ElevenLabs Handler] Tool execution error:', error);
      result = { success: false, message: "Error executing tool" };
    }
    
    // Send tool result back to ElevenLabs
    if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) {
      elevenLabsWs.send(JSON.stringify({
        type: 'client_tool_result',
        tool_call_id: toolCall.tool_call_id,
        result: JSON.stringify(result),
        is_error: !result.success
      }));
    }
  }

  async function cleanup() {
    if (isCleaningUp) return;
    isCleaningUp = true;
    
    stopKeepAlive();
    
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    
    if (elevenLabsWs) {
      elevenLabsWs.close();
      elevenLabsWs = null;
    }
    
    // Save final conversation and generate summary
    if (callSid && conversationMessages.length > 0) {
      try {
        // Determine outcome and action taken
        let outcome = 'call_completed';
        let actionTaken = '';
        
        if (lastScheduledMeeting) {
          outcome = 'meeting_scheduled';
          actionTaken = lastScheduledMeeting;
        } else if (lastVoicemail) {
          outcome = 'voicemail';
          actionTaken = lastVoicemail;
        }
        
        // Generate AI summary using conversation transcript
        let aiSummary = '';
        try {
          const transcriptText = conversationMessages.map(m => 
            `${m.role === 'user' ? 'Caller' : 'AI'}: ${m.content}`
          ).join('\n');
          
          const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: 'Summarize this phone call transcript in 2-3 sentences. Focus on: caller intent, any appointments scheduled, key information gathered (name, phone, address), and outcome. Be concise.'
                },
                {
                  role: 'user',
                  content: transcriptText
                }
              ],
              max_tokens: 200
            })
          });
          
          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json();
            aiSummary = summaryData.choices?.[0]?.message?.content || '';
            console.log('[ElevenLabs Handler] Generated AI summary:', aiSummary);
          }
        } catch (summaryError) {
          console.error('[ElevenLabs Handler] Summary generation error:', summaryError);
          // Fallback summary from conversation
          aiSummary = `Call with ${conversationMessages.length} exchanges. ${outcome === 'meeting_scheduled' ? 'Appointment was scheduled.' : outcome === 'voicemail' ? 'Voicemail was taken.' : 'General inquiry.'}`;
        }
        
        // Update call_sessions with final data
        await supabase.from('call_sessions').update({
          conversation_history: conversationMessages,
          ai_summary: aiSummary,
          outcome: outcome,
          action_taken: actionTaken,
          status: 'completed',
          updated_at: new Date().toISOString()
        }).eq('call_sid', callSid);
        
        console.log('[ElevenLabs Handler] Call session updated with transcript and summary');
      } catch (updateError) {
        console.error('[ElevenLabs Handler] Error updating call session:', updateError);
      }
    }
    
    // Update call record
    if (callSid) {
      await supabase.from('calls').update({
        call_status: 'completed',
        ai_handled: true
      }).eq('call_sid', callSid);
      console.log('[ElevenLabs Handler] Call record updated');
    }
  }

  return response;
});
