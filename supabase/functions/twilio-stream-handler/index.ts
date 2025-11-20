/**
 * Twilio Media Stream WebSocket Handler
 * 
 * Handles bidirectional audio streaming between Twilio and OpenAI Realtime API.
 * Receives audio from caller via Twilio, sends to OpenAI, and returns AI responses.
 * 
 * Note: WebSocket connections from Twilio don't include signature headers.
 * Security is ensured by:
 * 1. Validating call_sid exists in our database (created by verified webhook)
 * 2. Using unique, hard-to-guess WebSocket URLs
 * 3. Short-lived call sessions
 * 
 * WebSocket URL: wss://faqrzzodtmsybofakcvv.supabase.co/functions/v1/twilio-stream-handler
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface CallSession {
  call_sid: string;
  contractor_id: string;
  conversation_history: any[];
}

/**
 * Convert Twilio's mulaw (8kHz) to OpenAI's PCM16 (24kHz)
 * Uses cubic interpolation for smoother upsampling
 */
function mulawToPCM16(mulawData: Uint8Array): string {
  const MULAW_BIAS = 0x84;
  
  // Decode mulaw to PCM16 at 8kHz
  const pcm8k = new Int16Array(mulawData.length);
  
  for (let i = 0; i < mulawData.length; i++) {
    let mulaw = mulawData[i];
    mulaw = ~mulaw;
    
    const sign = (mulaw & 0x80) ? -1 : 1;
    const exponent = (mulaw >> 4) & 0x07;
    const mantissa = mulaw & 0x0F;
    
    let sample = ((mantissa << 3) + MULAW_BIAS) << exponent;
    sample = sign * sample;
    
    pcm8k[i] = Math.max(-32768, Math.min(32767, sample));
  }
  
  // Upsample from 8kHz to 24kHz using cubic interpolation for better quality
  const pcm24k = new Int16Array(pcm8k.length * 3);
  
  for (let i = 0; i < pcm8k.length; i++) {
    const p0 = pcm8k[Math.max(0, i - 1)];
    const p1 = pcm8k[i];
    const p2 = pcm8k[Math.min(pcm8k.length - 1, i + 1)];
    const p3 = pcm8k[Math.min(pcm8k.length - 1, i + 2)];
    
    // Original sample
    pcm24k[i * 3] = p1;
    
    // Cubic interpolation for the two intermediate samples
    for (let j = 1; j < 3; j++) {
      const t = j / 3;
      const t2 = t * t;
      const t3 = t2 * t;
      
      // Catmull-Rom spline interpolation
      const v = 0.5 * (
        (2 * p1) +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t3
      );
      
      pcm24k[i * 3 + j] = Math.round(Math.max(-32768, Math.min(32767, v)));
    }
  }
  
  // Convert to base64
  const uint8 = new Uint8Array(pcm24k.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8.length; i += chunkSize) {
    const chunk = uint8.subarray(i, Math.min(i + chunkSize, uint8.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

/**
 * Convert OpenAI's PCM16 audio (24kHz) to Twilio's mulaw (8kHz)
 * Uses low-pass filtering before downsampling to reduce aliasing
 */
function pcm16ToMulaw(base64PCM: string): Uint8Array {
  // Decode base64
  const binaryString = atob(base64PCM);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Convert bytes to Int16 PCM samples (little-endian) at 24kHz
  const pcm24k: number[] = [];
  for (let i = 0; i < bytes.length; i += 2) {
    if (i + 1 < bytes.length) {
      const sample = bytes[i] | (bytes[i + 1] << 8);
      pcm24k.push(sample > 32767 ? sample - 65536 : sample);
    }
  }
  
  // Apply simple low-pass filter before downsampling (weighted moving average)
  const filtered: number[] = [];
  for (let i = 0; i < pcm24k.length; i++) {
    const prev = pcm24k[Math.max(0, i - 1)];
    const curr = pcm24k[i];
    const next = pcm24k[Math.min(pcm24k.length - 1, i + 1)];
    // Weighted average: 25% prev, 50% curr, 25% next
    filtered[i] = Math.round((prev * 0.25 + curr * 0.5 + next * 0.25));
  }
  
  // Downsample from 24kHz to 8kHz (take every 3rd sample after filtering)
  const pcm8k: number[] = [];
  for (let i = 0; i < filtered.length; i += 3) {
    pcm8k.push(filtered[i]);
  }
  
  // Convert PCM16 to mulaw
  const mulaw = new Uint8Array(pcm8k.length);
  
  for (let i = 0; i < pcm8k.length; i++) {
    let sample = pcm8k[i];
    
    const sign = (sample < 0) ? 0x80 : 0x00;
    if (sample < 0) sample = -sample;
    
    sample += 132;
    if (sample > 32767) sample = 32767;
    
    let exponent = 7;
    for (let exp = 0; exp < 8; exp++) {
      if (sample <= (0x1F << (exp + 3))) {
        exponent = exp;
        break;
      }
    }
    
    const mantissa = (sample >> (exponent + 3)) & 0x0F;
    mulaw[i] = ~(sign | (exponent << 4) | mantissa);
  }
  
  return mulaw;
}

Deno.serve(async (req) => {
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("Expected WebSocket", { status: 400 });
  }

  const { socket: twilioWs, response } = Deno.upgradeWebSocket(req);
  let openaiWs: any = null;
  let callSid = '';
  let streamSid = '';
  let callSession: CallSession | null = null;
  let hasGreeted = false;
  let recordingStarted = false;

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

  // Function to start Twilio recording
  const startRecording = async (sid: string) => {
    if (recordingStarted) return;
    recordingStarted = true;

    try {
      const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const projectId = Deno.env.get('SUPABASE_PROJECT_ID') || 'faqrzzodtmsybofakcvv';
      
      console.log(`[Recording] Starting recording for call ${sid}`);
      
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${sid}/Recordings.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`)
          },
          body: new URLSearchParams({
            RecordingStatusCallback: `https://${projectId}.supabase.co/functions/v1/twilio-recording-callback`,
            RecordingStatusCallbackEvent: 'completed',
            RecordingChannels: 'dual'
          })
        }
      );
      
      const data = await response.json();
      console.log('[Recording] Started:', data);
      
      // Update call_sessions with recording_sid
      await supabase
        .from('call_sessions')
        .update({ 
          recording_sid: data.sid, 
          recording_status: 'in-progress' 
        })
        .eq('call_sid', sid);
        
      console.log('[Recording] Database updated with recording_sid');
    } catch (error) {
      console.error('[Recording] Failed to start recording:', error);
    }
  };

  twilioWs.onopen = () => {
    console.log('Twilio WebSocket connected');
  };

  twilioWs.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      
      // Handle Twilio events
      if (message.event === 'start') {
        callSid = message.start.callSid;
        streamSid = message.start.streamSid;
        
        console.log(`Stream started for call ${callSid}`);
        
        // Start recording the call
        startRecording(callSid);
        
        // Verify call_sid exists in database (ensures it came from verified webhook)
        const { data: session, error } = await supabase
          .from('call_sessions')
          .select('*')
          .eq('call_sid', callSid)
          .single();
        
        if (error || !session) {
          console.error('Invalid call session:', callSid, error);
          twilioWs.close();
          return;
        }
        
        callSession = session as CallSession;
        const config = callSession.conversation_history[0];
        
        // Validate and normalize voice_id (same logic as twilio-voice-inbound)
        const supportedVoices = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'marin', 'cedar'];
        let voiceId = config.voice_id || 'alloy';
        if (!supportedVoices.includes(voiceId)) {
          console.log(`Unsupported voice_id '${voiceId}', defaulting to 'alloy'`);
          voiceId = 'alloy';
        }

        // Prefer a warmer, more upbeat female voice when using the default
        if (voiceId === 'alloy') {
          console.log('Using default voice; switching to more upbeat "verse" voice for a friendlier tone');
          voiceId = 'verse';
        }
        
        // Connect directly to OpenAI Realtime API using API key
        if (!OPENAI_API_KEY) {
          console.error('OPENAI_API_KEY is not configured');
          twilioWs.close();
          return;
        }

        const model = 'gpt-4o-realtime-preview-2024-12-17';
        console.log('Connecting to OpenAI Realtime API...');

        try {
          // Use query param "authorization" since we can't set headers on WebSocket
          // Format: authorization=Bearer <API_KEY>
          const authParam = encodeURIComponent(`Bearer ${OPENAI_API_KEY}`);
          openaiWs = new WebSocket(
            `wss://api.openai.com/v1/realtime?model=${model}&authorization=${authParam}`
          );

          openaiWs.onopen = () => {
            console.log('Connected to OpenAI Realtime API');
          };

          openaiWs.onmessage = async (openaiEvent: MessageEvent) => {
            const openaiMessage = JSON.parse(openaiEvent.data);

            // Handle session.created - configure session
            if (openaiMessage.type === 'session.created') {
              console.log('OpenAI session created, configuring...');

              openaiWs!.send(JSON.stringify({
                type: 'session.update',
                session: {
                  modalities: ['text', 'audio'],
                  instructions: `${config.system_prompt || ''}\n\nSpeaking style: You are "Sarah", a warm, upbeat and highly personable assistant.\n- Sound clear and confident, with a friendly tone.\n- Be empathetic and conversational, like a great office receptionist.\n- Do NOT interrupt the caller right after saying "tell me what's going on" – always wait for them to finish.\n- Avoid over‑apologizing; only say "I'm sorry" when something truly went wrong.`,
                  voice: voiceId,
                  input_audio_format: 'pcm16',
                  output_audio_format: 'pcm16',
                  input_audio_transcription: {
                    model: 'whisper-1'
                  },
                  turn_detection: {
                    type: 'server_vad',
                    threshold: 0.6,
                    prefix_padding_ms: 500,
                    silence_duration_ms: 2500
                  },
                  temperature: 0.8,
                  max_response_output_tokens: 'inf'
                }
              }));
            }

            // Handle session.updated - send greeting
            if (openaiMessage.type === 'session.updated' && !hasGreeted) {
              hasGreeted = true;
              console.log('Session configured, sending greeting');

              openaiWs!.send(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'message',
                  role: 'user',
                  content: [{
                    type: 'input_text',
                    text: '[System: Start the conversation by greeting the caller with: ' + config.greeting + ']'
                  }]
                }
              }));

              openaiWs!.send(JSON.stringify({
                type: 'response.create'
              }));
            }

            // Handle audio output from AI
            if (openaiMessage.type === 'response.audio.delta') {
              const mulawData = pcm16ToMulaw(openaiMessage.delta);
              const base64Mulaw = btoa(String.fromCharCode(...mulawData));

              twilioWs.send(JSON.stringify({
                event: 'media',
                streamSid: streamSid,
                media: {
                  payload: base64Mulaw
                }
              }));
            }

            // Log transcripts
            if (openaiMessage.type === 'conversation.item.input_audio_transcription.completed') {
              console.log('User said:', openaiMessage.transcript);

              if (callSession) {
                const history = callSession.conversation_history || [];
                history.push({ role: 'user', content: openaiMessage.transcript });
                await supabase
                  .from('call_sessions')
                  .update({ conversation_history: history })
                  .eq('call_sid', callSid);
              }
            }

            if (openaiMessage.type === 'response.audio_transcript.done') {
              console.log('AI said:', openaiMessage.transcript);

              if (callSession) {
                const history = callSession.conversation_history || [];
                history.push({ role: 'assistant', content: openaiMessage.transcript });
                await supabase
                  .from('call_sessions')
                  .update({ conversation_history: history })
                  .eq('call_sid', callSid);
              }
            }

            if (openaiMessage.type === 'error') {
              console.error('OpenAI error:', openaiMessage);
            }
          };

          openaiWs.onerror = (error: unknown) => {
            console.error('OpenAI WebSocket error:', error);
          };

          openaiWs.onclose = () => {
            console.log('OpenAI WebSocket closed');
          };
        } catch (error) {
          console.error('Failed to connect to OpenAI Realtime API:', error);
          twilioWs.close();
          return;
        }
      }
      
      // Handle incoming audio from caller
      if (message.event === 'media' && openaiWs && openaiWs.readyState === WebSocket.OPEN) {
        const mulawBase64 = message.media.payload;
        const mulawBinary = atob(mulawBase64);
        const mulawData = new Uint8Array(mulawBinary.length);
        for (let i = 0; i < mulawBinary.length; i++) {
          mulawData[i] = mulawBinary.charCodeAt(i);
        }
        
        const pcm16Base64 = mulawToPCM16(mulawData);
        
        openaiWs.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: pcm16Base64
        }));
      }
      
      // Handle stream stop
      if (message.event === 'stop') {
        console.log('Stream stopped');
        if (openaiWs) {
          openaiWs.close();
        }
        
        await supabase
          .from('call_sessions')
          .update({ status: 'completed' })
          .eq('call_sid', callSid);
      }
      
    } catch (error) {
      console.error('Error processing message:', error);
    }
  };

  twilioWs.onerror = (error) => {
    console.error('Twilio WebSocket error:', error);
  };
  
  twilioWs.onclose = () => {
    console.log('Twilio WebSocket closed');
    if (openaiWs) {
      openaiWs.close();
    }
  };
  
  return response;
});
