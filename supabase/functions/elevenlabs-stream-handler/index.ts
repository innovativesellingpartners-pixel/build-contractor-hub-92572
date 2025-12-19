/**
 * ElevenLabs Stream Handler - Bridges Twilio Media Streams to ElevenLabs Conversational AI
 * 
 * This WebSocket handler receives audio from Twilio (mulaw 8kHz) and converts it to PCM
 * for ElevenLabs, then converts ElevenLabs PCM response back to mulaw for Twilio.
 * 
 * Agent ID: agent_9901kcrxhb4yfr7r2gzq3rfs6add
 * 
 * FIXES v2:
 * - Improved audio buffering during reconnects
 * - Better VAD handling to prevent interruptions
 * - Reduced keep-alive interval
 * - Improved reconnect logic
 * - Added agent_response tracking to prevent talking over itself
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
for (let i = 0; i < 256; i++) {
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
  
  const filterWindowSize = Math.max(3, Math.ceil(ratio));
  const filteredData = lowPassFilter(pcmData, filterWindowSize);
  
  const outputLength = Math.max(1, Math.floor(filteredData.length / ratio));

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

  // Reconnect state
  let reconnectTimer: number | null = null;
  let reconnectAttempts = 0;
  let isCleaningUp = false;
  let hasEverConnectedToElevenLabs = false;
  
  // Track if agent is currently speaking to prevent sending audio during output
  let agentIsSpeaking = false;
  let lastAgentAudioTime = 0;
  
  // Audio queue for smoother playback
  const audioQueue: string[] = [];
  let isProcessingQueue = false;

  // Larger audio buffer for reconnects (about 5 seconds of audio at 8kHz)
  const MAX_PENDING_AUDIO_CHUNKS = 200;
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

    console.log(`[ElevenLabs Handler] Flushing ${pendingUserAudioChunks.length} buffered audio chunks`);
    const chunks = pendingUserAudioChunks.splice(0, pendingUserAudioChunks.length);
    for (const pcmBase64 of chunks) {
      try {
        elevenLabsWs.send(JSON.stringify({ user_audio_chunk: pcmBase64 }));
      } catch (err) {
        console.error('[ElevenLabs Handler] Failed to flush buffered audio chunk:', err);
        enqueueUserAudioChunk(pcmBase64);
        break;
      }
    }
  }

  function buildResumeContextText() {
    const lastTurns = conversationMessages.slice(-12);
    const transcript = lastTurns
      .map((m) => `${m.role === 'user' ? 'Caller' : 'Agent'}: ${m.content}`)
      .join('\n');

    const extras = [
      lastScheduledMeeting ? `Latest scheduled appointment: ${lastScheduledMeeting}` : null,
      lastVoicemail ? `Latest voicemail taken: ${lastVoicemail}` : null,
    ].filter(Boolean);

    return [
      'IMPORTANT: We are CONTINUING an ongoing phone call. The connection briefly dropped but we are still on the same call with the same person.',
      'DO NOT greet them again or introduce yourself. Continue the conversation naturally from where we left off.',
      'If you were in the middle of saying something, continue that thought.',
      transcript ? `Recent conversation:\n${transcript}` : null,
      extras.length ? extras.join('\n') : null,
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  function sendResumeContextIfNeeded() {
    if (!elevenLabsWs || elevenLabsWs.readyState !== WebSocket.OPEN) return;
    if (!hasEverConnectedToElevenLabs) return;
    if (!conversationMessages.length && !lastScheduledMeeting && !lastVoicemail) return;

    console.log('[ElevenLabs Handler] Sending resume context to prevent re-greeting');
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
      // Send mark event to Twilio
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
        elevenLabsWs.send(JSON.stringify({ type: 'ping' }));
      }
    }, 5000); // Every 5 seconds (reduced from 10)
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
    // Faster reconnect with exponential backoff capped at 3 seconds
    const delayMs = Math.min(3000, 300 * reconnectAttempts);
    console.log(
      `[ElevenLabs Handler] Scheduling reconnect in ${delayMs}ms (attempt ${reconnectAttempts}) — reason: ${reason}`
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
        reconnectAttempts = 0;
      } catch (err) {
        console.error('[ElevenLabs Handler] Reconnect attempt failed:', err);
        scheduleElevenReconnect('reconnect_failed');
      }
    }, delayMs);
  }

  // Process audio queue to send to Twilio with proper timing
  async function processAudioQueue() {
    if (isProcessingQueue || audioQueue.length === 0) return;
    isProcessingQueue = true;

    while (audioQueue.length > 0 && twilioWs.readyState === WebSocket.OPEN) {
      const audioPayload = audioQueue.shift();
      if (audioPayload) {
        twilioWs.send(JSON.stringify({
          event: 'media',
          streamSid: streamSid,
          media: { payload: audioPayload }
        }));
        // Small delay between chunks for smoother playback
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    isProcessingQueue = false;
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
          
          if (data.start.customParameters) {
            contractorId = data.start.customParameters.contractorId || '';
          }
          
          console.log('[ElevenLabs Handler] Stream started:', { streamSid, callSid, contractorId });
          
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
          
          await connectToElevenLabs();
          startKeepAlive();
          break;
          
        case 'media': {
          // Don't forward user audio while agent is speaking (prevents echo/interruption)
          const now = Date.now();
          if (agentIsSpeaking && (now - lastAgentAudioTime) < 500) {
            // Agent is actively speaking, skip this audio to prevent echo
            break;
          }
          
          try {
            const mulawBytes = base64ToUint8Array(data.media.payload);
            const pcm = mulawToPcm16(mulawBytes, elevenInputSampleRate);

            // Log audio levels periodically
            if (Math.random() < 0.005) {
              let maxLevel = 0;
              for (let i = 0; i < pcm.length; i++) {
                const absVal = Math.abs(pcm[i]);
                if (absVal > maxLevel) maxLevel = absVal;
              }
              console.log('[ElevenLabs Handler] User audio - samples:', pcm.length, 'max level:', maxLevel);
            }

            const pcmBase64 = int16ArrayToBase64(pcm);

            if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) {
              elevenLabsWs.send(JSON.stringify({ user_audio_chunk: pcmBase64 }));
            } else {
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

      elevenLabsWs = new WebSocket(signed_url);

      elevenLabsWs.onopen = () => {
        console.log('[ElevenLabs Handler] ElevenLabs WebSocket connected');

        // Determine if this is a reconnect - affects first message
        const isReconnect = hasEverConnectedToElevenLabs && conversationMessages.length > 0;

        const initMessage: Record<string, any> = {
          type: "conversation_initiation_client_data",
          dynamic_variables: {
            business_name: businessName,
            contractor_name: contractorName,
            trade: trade,
            farewell_message: `Thank you for calling ${businessName}. Have a wonderful day!`,
            email_collection_reminder: "Always ask for the caller's email address when scheduling appointments.",
            // Pass reconnect context as a variable
            is_reconnect: isReconnect ? "true" : "false",
          },
          // Request specific audio format for better compatibility
          conversation_config_override: {
            // Higher VAD threshold to reduce false interruptions
            turn_detection: {
              mode: "server_vad",
              vad_threshold: 0.6, // Higher = less sensitive (default is ~0.5)
              prefix_padding_ms: 500, // More padding before speech
              silence_duration_ms: 800, // Longer silence before turn ends
            }
          }
        };

        console.log('[ElevenLabs Handler] Sending init message:', JSON.stringify(initMessage));
        elevenLabsWs!.send(JSON.stringify(initMessage));

        // Send resume context if this is a reconnect
        if (isReconnect) {
          sendResumeContextIfNeeded();
        }

        hasEverConnectedToElevenLabs = true;
        flushPendingUserAudio();
      };

      elevenLabsWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'conversation_initiation_metadata': {
              const meta = data.conversation_initiation_metadata_event;
              console.log('[ElevenLabs Handler] Conversation metadata:', JSON.stringify(meta));

              const inferredInput = meta?.input_audio_format?.sample_rate_hz ?? 
                                   meta?.input_audio_format?.sample_rate ?? 16000;
              const inferredOutput = meta?.output_audio_format?.sample_rate_hz ?? 
                                    meta?.output_audio_format?.sample_rate ?? 16000;

              if (typeof inferredInput === 'number' && inferredInput > 0) {
                elevenInputSampleRate = inferredInput;
                console.log('[ElevenLabs Handler] Input sample rate:', elevenInputSampleRate);
              }
              if (typeof inferredOutput === 'number' && inferredOutput > 0) {
                elevenOutputSampleRate = inferredOutput;
                console.log('[ElevenLabs Handler] Output sample rate:', elevenOutputSampleRate);
              }
              break;
            }
              
            case 'audio':
              // Track that agent is speaking
              agentIsSpeaking = true;
              lastAgentAudioTime = Date.now();
              
              if (twilioWs.readyState === WebSocket.OPEN && data.audio_event?.audio_base_64) {
                try {
                  const pcmBytes = base64ToUint8Array(data.audio_event.audio_base_64);
                  const pcm16 = new Int16Array(pcmBytes.length / 2);
                  for (let i = 0; i < pcm16.length; i++) {
                    pcm16[i] = pcmBytes[i * 2] | (pcmBytes[i * 2 + 1] << 8);
                  }

                  const mulawBytes = pcm16ToMulaw(pcm16, elevenOutputSampleRate);
                  const mulawBase64 = uint8ArrayToBase64(mulawBytes);
                  
                  // Queue audio for smoother playback
                  audioQueue.push(mulawBase64);
                  processAudioQueue();
                } catch (err) {
                  console.error('[ElevenLabs Handler] Error converting ElevenLabs audio:', err);
                }
              }
              break;
              
            case 'audio_done':
              // Agent finished speaking this response
              console.log('[ElevenLabs Handler] Agent finished speaking');
              agentIsSpeaking = false;
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
                
                if (conversationMessages.length % 4 === 0 && callSid) {
                  supabase.from('call_sessions').update({
                    conversation_history: conversationMessages,
                    updated_at: new Date().toISOString()
                  }).eq('call_sid', callSid).then(() => {
                    console.log('[ElevenLabs Handler] Conversation saved');
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
              console.log('[ElevenLabs Handler] User interrupted - clearing audio');
              agentIsSpeaking = false;
              audioQueue.length = 0; // Clear pending audio
              
              if (twilioWs.readyState === WebSocket.OPEN) {
                twilioWs.send(JSON.stringify({
                  event: 'clear',
                  streamSid: streamSid
                }));
              }
              break;
              
            case 'ping':
              if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) {
                elevenLabsWs.send(JSON.stringify({
                  type: 'pong',
                  event_id: data.ping_event?.event_id
                }));
              }
              break;
              
            case 'client_tool_call':
              handleToolCall(data);
              break;
              
            case 'error':
              console.error('[ElevenLabs Handler] ElevenLabs error:', data);
              break;
              
            default:
              if (data.type) {
                console.log('[ElevenLabs Handler] Event:', data.type);
              }
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
        // Only reconnect if not cleaning up and Twilio is still connected
        if (!isCleaningUp && twilioWs.readyState === WebSocket.OPEN) {
          scheduleElevenReconnect(`eleven_ws_close_${event.code}`);
        }
      };

    } catch (error) {
      console.error('[ElevenLabs Handler] Error connecting to ElevenLabs:', error);
    }
  }

  async function handleToolCall(data: any) {
    const toolCall = data.client_tool_call;
    if (!toolCall) return;
    
    console.log('[ElevenLabs Handler] Tool call:', toolCall.tool_name, JSON.stringify(toolCall.parameters));
    
    let result: Record<string, any> = { success: false, message: "Unknown tool" };
    
    try {
      switch (toolCall.tool_name) {
        case 'schedule_appointment': {
          const appointmentData = toolCall.parameters;
          const scheduledDate = appointmentData.date || new Date().toISOString().split('T')[0];
          const scheduledTime = appointmentData.time || '09:00';
          const location = appointmentData.address || '';
          const customerName = appointmentData.name || 'Customer';
          const customerPhone = appointmentData.phone || '';
          const customerEmail = appointmentData.email || '';
          const description = appointmentData.description || 'Scheduled Visit';
          
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
          
          // Create calendar event
          try {
            const calendarPayload = {
              jobId: meeting?.id || 'voice-ai-booking',
              jobName: `${description} - ${customerName}`,
              description: `Voice AI Scheduled Visit\nCustomer: ${customerName}\nPhone: ${customerPhone}\nAddress: ${location}`,
              startDate: `${scheduledDate}T${scheduledTime}:00`,
              endDate: `${scheduledDate}T${String(parseInt(scheduledTime.split(':')[0]) + 1).padStart(2, '0')}:${scheduledTime.split(':')[1]}:00`,
              location: location,
              address: location,
              contractorId: contractorId,
            };
            
            const { data: calendarConnection } = await supabase
              .from('calendar_connections')
              .select('*')
              .eq('user_id', contractorId)
              .limit(1)
              .single();
              
            if (calendarConnection) {
              console.log('[ElevenLabs Handler] Creating calendar event...');
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
              console.log('[ElevenLabs Handler] Calendar result:', calResult);
            }
          } catch (calError) {
            console.error('[ElevenLabs Handler] Calendar error:', calError);
          }
          
          // Send email confirmation
          if (customerEmail) {
            try {
              console.log('[ElevenLabs Handler] Sending email to:', customerEmail);
              
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
                contractorId: contractorId,
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
            }
          }
          
          lastScheduledMeeting = `Appointment with ${customerName} on ${scheduledDate} at ${scheduledTime}. Location: ${location || 'TBD'}. Phone: ${customerPhone || 'Not provided'}.`;
          
          result = { 
            success: true, 
            message: `Appointment scheduled for ${scheduledDate} at ${scheduledTime}. ${customerEmail ? 'Confirmation email sent.' : ''}`,
            meeting_id: meeting?.id
          };
          break;
        }
          
        case 'take_voicemail': {
          const voicemailData = toolCall.parameters;
          await supabase.from('calls').update({
            ai_summary: `Voicemail from ${voicemailData.name} (${voicemailData.phone}): ${voicemailData.message}`,
            outcome: 'voicemail',
            message_type: voicemailData.urgency || 'normal'
          }).eq('call_sid', callSid);
          
          lastVoicemail = `Voicemail from ${voicemailData.name || 'Unknown'} (${voicemailData.phone || 'No phone'}): ${voicemailData.message || 'No message'}.`;
          
          result = { success: true, message: "Voicemail saved successfully" };
          break;
        }
          
        case 'lookup_job': {
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
          console.log('[ElevenLabs Handler] Agent ending call');
          result = { 
            success: true, 
            message: `Call ended. Thank you for calling ${businessName}.`
          };
          
          setTimeout(() => {
            console.log('[ElevenLabs Handler] Closing connections after farewell');
            if (twilioWs.readyState === WebSocket.OPEN) {
              twilioWs.send(JSON.stringify({
                event: 'stop',
                streamSid: streamSid
              }));
            }
            cleanup();
          }, 3000);
          break;
        }
          
        default:
          console.log('[ElevenLabs Handler] Unknown tool:', toolCall.tool_name);
      }
    } catch (error) {
      console.error('[ElevenLabs Handler] Tool execution error:', error);
      result = { success: false, message: "Error executing tool" };
    }
    
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
    
    console.log('[ElevenLabs Handler] Cleaning up...');
    
    stopKeepAlive();
    
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    
    if (elevenLabsWs) {
      try {
        elevenLabsWs.close();
      } catch {}
      elevenLabsWs = null;
    }
    
    // Save final conversation and generate summary
    if (callSid && conversationMessages.length > 0) {
      try {
        let outcome = 'call_completed';
        let actionTaken = '';
        
        if (lastScheduledMeeting) {
          outcome = 'meeting_scheduled';
          actionTaken = lastScheduledMeeting;
        } else if (lastVoicemail) {
          outcome = 'voicemail';
          actionTaken = lastVoicemail;
        }
        
        // Generate AI summary
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
            console.log('[ElevenLabs Handler] Generated summary:', aiSummary);
          }
        } catch (summaryError) {
          console.error('[ElevenLabs Handler] Summary generation error:', summaryError);
        }
        
        // Update call session
        await supabase.from('call_sessions').update({
          status: 'completed',
          conversation_history: conversationMessages,
          ai_summary: aiSummary || actionTaken || 'Call completed',
          outcome: outcome,
          action_taken: actionTaken,
          updated_at: new Date().toISOString()
        }).eq('call_sid', callSid);
        
        // Update calls record
        await supabase.from('calls').update({
          call_status: 'completed',
          ai_summary: aiSummary || actionTaken || 'Call completed',
          outcome: outcome,
          updated_at: new Date().toISOString()
        }).eq('call_sid', callSid);
        
        console.log('[ElevenLabs Handler] Final conversation saved');
      } catch (saveError) {
        console.error('[ElevenLabs Handler] Error saving final conversation:', saveError);
      }
    }
  }

  return response;
});
