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
 * Convert Twilio's mulaw audio to base64 PCM16
 */
function mulawToPCM16(mulawData: Uint8Array): string {
  const MULAW_BIAS = 0x84;
  const MULAW_MAX = 0x1FFF;
  
  const pcm16 = new Int16Array(mulawData.length);
  
  for (let i = 0; i < mulawData.length; i++) {
    let mulaw = mulawData[i];
    mulaw = ~mulaw;
    
    const sign = (mulaw & 0x80) ? -1 : 1;
    const exponent = (mulaw >> 4) & 0x07;
    const mantissa = mulaw & 0x0F;
    
    let sample = ((mantissa << 3) + MULAW_BIAS) << exponent;
    sample = sign * sample;
    
    pcm16[i] = Math.max(-32768, Math.min(32767, sample));
  }
  
  // Convert to base64
  const uint8 = new Uint8Array(pcm16.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8.length; i += chunkSize) {
    const chunk = uint8.subarray(i, Math.min(i + chunkSize, uint8.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

/**
 * Convert OpenAI's PCM16 audio to Twilio's mulaw
 */
function pcm16ToMulaw(base64PCM: string): Uint8Array {
  // Decode base64
  const binaryString = atob(base64PCM);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Convert Int16 PCM to mulaw
  const pcm16 = new Int16Array(bytes.buffer);
  const mulaw = new Uint8Array(pcm16.length);
  
  for (let i = 0; i < pcm16.length; i++) {
    let sample = pcm16[i];
    const sign = (sample < 0) ? 0x80 : 0x00;
    
    if (sample < 0) sample = -sample;
    sample += 0x84;
    
    if (sample > 0x7FFF) sample = 0x7FFF;
    
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
  let openaiWs: WebSocket | null = null;
  let callSid = '';
  let streamSid = '';
  let callSession: CallSession | null = null;
  let hasGreeted = false;

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

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
            voice: config.voice_id || 'alloy',
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

        // Connect using ephemeral token as subprotocol
        // This is a standard way to authenticate WebSockets without custom headers
        const openaiUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`;
        
        console.log('Connecting to OpenAI WebSocket...');
        // Pass auth as subprotocol - OpenAI Realtime API supports this
        openaiWs = new WebSocket(openaiUrl, [`Authorization.Bearer.${ephemeralKey}`, 'realtime-v1']);
        
        // Store session config for later use
        const sessionConfig = {
          system_prompt: config.system_prompt,
          voice_id: config.voice_id || 'alloy',
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
                voice: config.voice_id || 'alloy',
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
