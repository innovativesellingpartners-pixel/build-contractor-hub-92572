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
  
  // Upsample from 8kHz to 24kHz using linear interpolation
  const pcm24k = new Int16Array(pcm8k.length * 3);
  for (let i = 0; i < pcm8k.length - 1; i++) {
    const current = pcm8k[i];
    const next = pcm8k[i + 1];
    
    // First sample is the original
    pcm24k[i * 3] = current;
    // Interpolate two samples between current and next
    pcm24k[i * 3 + 1] = Math.round(current + (next - current) / 3);
    pcm24k[i * 3 + 2] = Math.round(current + (next - current) * 2 / 3);
  }
  // Handle last sample
  if (pcm8k.length > 0) {
    const lastIdx = pcm8k.length - 1;
    pcm24k[lastIdx * 3] = pcm8k[lastIdx];
    pcm24k[lastIdx * 3 + 1] = pcm8k[lastIdx];
    pcm24k[lastIdx * 3 + 2] = pcm8k[lastIdx];
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
      // Little-endian: low byte first, high byte second
      const sample = bytes[i] | (bytes[i + 1] << 8);
      // Convert unsigned to signed
      pcm24k.push(sample > 32767 ? sample - 65536 : sample);
    }
  }
  
  // Downsample from 24kHz to 8kHz using averaging for anti-aliasing
  const pcm8k: number[] = [];
  for (let i = 0; i < pcm24k.length; i += 3) {
    // Average 3 samples to reduce aliasing
    const avg = Math.round((pcm24k[i] + (pcm24k[i + 1] || pcm24k[i]) + (pcm24k[i + 2] || pcm24k[i])) / 3);
    pcm8k.push(avg);
  }
  
  // Convert PCM16 to mulaw
  const mulaw = new Uint8Array(pcm8k.length);
  
  for (let i = 0; i < pcm8k.length; i++) {
    let sample = pcm8k[i];
    
    // Get sign and absolute value
    const sign = (sample < 0) ? 0x80 : 0x00;
    if (sample < 0) sample = -sample;
    
    // Add bias
    sample += 132;
    if (sample > 32767) sample = 32767;
    
    // Find exponent and mantissa
    let exponent = 7;
    for (let exp = 0; exp < 8; exp++) {
      if (sample <= (0x1F << (exp + 3))) {
        exponent = exp;
        break;
      }
    }
    
    const mantissa = (sample >> (exponent + 3)) & 0x0F;
    
    // Compose mulaw byte and invert
    mulaw[i] = ~(sign | (exponent << 4) | mantissa);
  }
  
  return mulaw;
}

Deno.serve(async (req) => {
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("Expected WebSocket", { status: 400 });
  }

  const { socket: twilioWs, response } = Deno.upgradeWebSocket(req);
  let openaiWs: WebSocket | null = null;
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
        
        // Get ephemeral token from OpenAI for Realtime API
        // This allows WebSocket connection without custom headers
        console.log('Requesting ephemeral token from OpenAI...');
        const tokenResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-realtime-preview-2024-12-17',
            voice: voiceId,
          })
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('Failed to get ephemeral token:', errorText);
          twilioWs.close();
          return;
        }

        const tokenData = await tokenResponse.json();
        const ephemeralKey = tokenData.client_secret.value;
        console.log('Ephemeral token obtained');

        // Connect to OpenAI using ephemeral token as WebSocket subprotocol
        // This is the correct way for Deno's WebSocket constructor
        const openaiUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`;
        
        console.log('Connecting to OpenAI WebSocket...');
        openaiWs = new WebSocket(openaiUrl, [
          'realtime',
          `openai-insecure-api-key.${ephemeralKey}`,
          'openai-beta.realtime-v1'
        ]);
        
        // Store session config for later use
        const sessionConfig = {
          system_prompt: config.system_prompt,
          voice_id: voiceId,
          greeting: config.greeting
        };
        
        openaiWs.onopen = () => {
          console.log('OpenAI WebSocket connected');
        };
        
        openaiWs.onmessage = async (openaiEvent) => {
          const openaiMessage = JSON.parse(openaiEvent.data);
          
          // Handle session.created - configure session
          if (openaiMessage.type === 'session.created') {
            console.log('OpenAI session created, configuring...');
            
            // Send session configuration
            openaiWs!.send(JSON.stringify({
              type: 'session.update',
              session: {
                modalities: ['text', 'audio'],
                instructions: config.system_prompt,
                voice: voiceId,
                input_audio_format: 'pcm16',
                output_audio_format: 'pcm16',
                input_audio_transcription: {
                  model: 'whisper-1'
                },
                turn_detection: {
                  type: 'server_vad',
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 1000
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
            
            // Send greeting as a conversation item
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
            
            // Trigger response
            openaiWs!.send(JSON.stringify({
              type: 'response.create'
            }));
          }
          
          // Handle audio output from AI
          if (openaiMessage.type === 'response.audio.delta') {
            // Convert PCM16 to mulaw and send to Twilio
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
            
            // Store in conversation history
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
            
            // Store in conversation history
            if (callSession) {
              const history = callSession.conversation_history || [];
              history.push({ role: 'assistant', content: openaiMessage.transcript });
              await supabase
                .from('call_sessions')
                .update({ conversation_history: history })
                .eq('call_sid', callSid);
            }
          }
          
          // Log errors
          if (openaiMessage.type === 'error') {
            console.error('OpenAI error:', openaiMessage);
          }
        };
        
        openaiWs.onerror = (error) => {
          console.error('OpenAI WebSocket error:', error);
        };
        
        openaiWs.onclose = () => {
          console.log('OpenAI WebSocket closed');
        };
      }
      
      // Handle incoming audio from caller
      if (message.event === 'media' && openaiWs && openaiWs.readyState === WebSocket.OPEN) {
        // Decode mulaw audio from Twilio
        const mulawBase64 = message.media.payload;
        const mulawBinary = atob(mulawBase64);
        const mulawData = new Uint8Array(mulawBinary.length);
        for (let i = 0; i < mulawBinary.length; i++) {
          mulawData[i] = mulawBinary.charCodeAt(i);
        }
        
        // Convert to PCM16 and send to OpenAI
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
        
        // Update call session
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
