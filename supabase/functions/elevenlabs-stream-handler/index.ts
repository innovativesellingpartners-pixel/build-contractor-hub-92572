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

// μ-law decoding table (mulaw to linear PCM)
const MULAW_DECODE_TABLE = new Int16Array([
  -32124, -31100, -30076, -29052, -28028, -27004, -25980, -24956,
  -23932, -22908, -21884, -20860, -19836, -18812, -17788, -16764,
  -15996, -15484, -14972, -14460, -13948, -13436, -12924, -12412,
  -11900, -11388, -10876, -10364, -9852, -9340, -8828, -8316,
  -7932, -7676, -7420, -7164, -6908, -6652, -6396, -6140,
  -5884, -5628, -5372, -5116, -4860, -4604, -4348, -4092,
  -3900, -3772, -3644, -3516, -3388, -3260, -3132, -3004,
  -2876, -2748, -2620, -2492, -2364, -2236, -2108, -1980,
  -1884, -1820, -1756, -1692, -1628, -1564, -1500, -1436,
  -1372, -1308, -1244, -1180, -1116, -1052, -988, -924,
  -876, -844, -812, -780, -748, -716, -684, -652,
  -620, -588, -556, -524, -492, -460, -428, -396,
  -372, -356, -340, -324, -308, -292, -276, -260,
  -244, -228, -212, -196, -180, -164, -148, -132,
  -120, -112, -104, -96, -88, -80, -72, -64,
  -56, -48, -40, -32, -24, -16, -8, 0,
  32124, 31100, 30076, 29052, 28028, 27004, 25980, 24956,
  23932, 22908, 21884, 20860, 19836, 18812, 17788, 16764,
  15996, 15484, 14972, 14460, 13948, 13436, 12924, 12412,
  11900, 11388, 10876, 10364, 9852, 9340, 8828, 8316,
  7932, 7676, 7420, 7164, 6908, 6652, 6396, 6140,
  5884, 5628, 5372, 5116, 4860, 4604, 4348, 4092,
  3900, 3772, 3644, 3516, 3388, 3260, 3132, 3004,
  2876, 2748, 2620, 2492, 2364, 2236, 2108, 1980,
  1884, 1820, 1756, 1692, 1628, 1564, 1500, 1436,
  1372, 1308, 1244, 1180, 1116, 1052, 988, 924,
  876, 844, 812, 780, 748, 716, 684, 652,
  620, 588, 556, 524, 492, 460, 428, 396,
  372, 356, 340, 324, 308, 292, 276, 260,
  244, 228, 212, 196, 180, 164, 148, 132,
  120, 112, 104, 96, 88, 80, 72, 64,
  56, 48, 40, 32, 24, 16, 8, 0
]);

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

// Encode linear PCM to mulaw
function linearToMulaw(sample: number): number {
  const MULAW_MAX = 0x1FFF;
  const MULAW_BIAS = 33;
  
  let sign = (sample >> 8) & 0x80;
  if (sign !== 0) sample = -sample;
  if (sample > MULAW_MAX) sample = MULAW_MAX;
  
  sample = sample + MULAW_BIAS;
  let exponent = 7;
  for (let expMask = 0x4000; (sample & expMask) === 0 && exponent > 0; exponent--, expMask >>= 1) {}
  
  const mantissa = (sample >> (exponent + 3)) & 0x0F;
  const mulawByte = ~(sign | (exponent << 4) | mantissa);
  
  return mulawByte & 0xFF;
}

// Resample PCM16 to 8kHz and encode to mulaw
function pcm16ToMulaw(pcmData: Int16Array, inputSampleRate: number): Uint8Array {
  const targetRate = 8000;
  const ratio = inputSampleRate / targetRate;
  const outputLength = Math.max(1, Math.floor(pcmData.length / ratio));

  const mulaw = new Uint8Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const srcPos = i * ratio;
    const idx = Math.floor(srcPos);
    const frac = srcPos - idx;

    const s0 = pcmData[Math.min(idx, pcmData.length - 1)];
    const s1 = pcmData[Math.min(idx + 1, pcmData.length - 1)];
    const sample = Math.round(s0 + (s1 - s0) * frac);

    mulaw[i] = linearToMulaw(sample);
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
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('[ElevenLabs Handler] WebSocket connection established');

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
          
        case 'media':
          // Forward audio to ElevenLabs (convert mulaw 8kHz → PCM at ElevenLabs input sample rate)
          if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) {
            try {
              const mulawBytes = base64ToUint8Array(data.media.payload);
              const pcm = mulawToPcm16(mulawBytes, elevenInputSampleRate);
              const pcmBase64 = int16ArrayToBase64(pcm);
              
              elevenLabsWs.send(JSON.stringify({
                user_audio_chunk: pcmBase64
              }));
            } catch (err) {
              console.error('[ElevenLabs Handler] Error converting audio:', err);
            }
          }
          break;
          
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
            trade: trade
          }
        };
        
        console.log('[ElevenLabs Handler] Sending init message:', initMessage);
        elevenLabsWs!.send(JSON.stringify(initMessage));
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
                  // PCM16 is 2 bytes per sample (little-endian)
                  const pcm16 = new Int16Array(pcmBytes.buffer);

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
              
            case 'user_transcript':
              console.log('[ElevenLabs Handler] User said:', data.user_transcription_event?.user_transcript);
              break;
              
            case 'agent_response':
              console.log('[ElevenLabs Handler] Agent response:', data.agent_response_event?.agent_response);
              break;
              
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
        case 'schedule_appointment':
          // Save appointment to database
          const appointmentData = toolCall.parameters;
          await supabase.from('job_meetings').insert({
            user_id: contractorId,
            job_id: null,
            title: appointmentData.description || 'Scheduled Visit',
            meeting_type: 'site_visit',
            scheduled_date: appointmentData.date,
            scheduled_time: appointmentData.time,
            location: appointmentData.address,
            notes: `Customer: ${appointmentData.name}\nPhone: ${appointmentData.phone}\n${appointmentData.notes || ''}`
          });
          result = { success: true, message: "Appointment scheduled successfully" };
          break;
          
        case 'take_voicemail':
          // Save voicemail message
          const voicemailData = toolCall.parameters;
          await supabase.from('calls').update({
            ai_summary: `Voicemail from ${voicemailData.name} (${voicemailData.phone}): ${voicemailData.message}`,
            outcome: 'voicemail',
            message_type: voicemailData.urgency || 'normal'
          }).eq('call_sid', callSid);
          result = { success: true, message: "Voicemail saved successfully" };
          break;
          
        case 'lookup_job':
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

  function cleanup() {
    stopKeepAlive();
    
    if (elevenLabsWs) {
      elevenLabsWs.close();
      elevenLabsWs = null;
    }
    
    // Update call record
    if (callSid) {
      supabase.from('calls').update({
        call_status: 'completed',
        ai_handled: true
      }).eq('call_sid', callSid).then(() => {
        console.log('[ElevenLabs Handler] Call record updated');
      });
    }
  }

  return response;
});
