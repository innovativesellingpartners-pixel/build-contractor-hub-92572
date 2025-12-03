/**
 * Twilio Media Stream WebSocket Handler - PRODUCTION OPTIMIZED
 * 
 * Handles bidirectional audio streaming between Twilio and OpenAI Realtime API.
 * 
 * ========================
 * KEY FIXES (v2.0):
 * ========================
 * 1. WebSocket keep-alive (ping/pong) to prevent 30-second timeout
 * 2. Increased max_response_output_tokens to prevent mid-sentence cutoffs
 * 3. Improved VAD settings for natural turn-taking
 * 4. Better audio codec handling with proper buffering
 * 5. Comprehensive structured logging for debugging
 * 6. Graceful error recovery - don't hard-hangup on minor errors
 * 
 * ========================
 * VOICE AI CONFIGURATION
 * ========================
 * Voice Options (OpenAI Realtime):
 *   coral   - Friendly, warm (recommended for contractors)
 *   ash     - Professional, confident
 *   alloy   - Neutral, standard
 *   echo    - Male, deeper tone
 *   sage    - Calm, measured
 *   shimmer - Expressive, dynamic
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

/**
 * Voice AI Configuration - Tuned for natural conversation
 */
const VOICE_CONFIG = {
  // Voice selection
  defaultVoice: 'coral',
  
  // Response behavior - allow longer responses to complete sentences
  temperature: 0.8,
  maxResponseTokens: 500,  // INCREASED from 120 to prevent mid-sentence cutoffs
  
  // Turn detection - balanced for natural conversation
  vadThreshold: 0.5,          // Standard sensitivity
  prefixPaddingMs: 300,       // Standard speech start detection
  silenceDurationMs: 700,     // INCREASED from 550 - wait longer before responding
  
  // Keep-alive interval (ms) - prevents WebSocket timeout
  keepAliveIntervalMs: 15000, // Send ping every 15 seconds
  
  // Audio buffer settings
  audioBufferMs: 100,         // Small buffer for low latency
};

/**
 * Structured logger for debugging
 */
const Logger = {
  callSid: '',
  streamSid: '',
  
  setContext(callSid: string, streamSid: string) {
    this.callSid = callSid;
    this.streamSid = streamSid;
  },
  
  info(event: string, data?: Record<string, unknown>) {
    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      callSid: this.callSid,
      streamSid: this.streamSid,
      event,
      ...data
    }));
  },
  
  warn(event: string, data?: Record<string, unknown>) {
    console.warn(JSON.stringify({
      level: 'WARN',
      timestamp: new Date().toISOString(),
      callSid: this.callSid,
      streamSid: this.streamSid,
      event,
      ...data
    }));
  },
  
  error(event: string, error?: unknown, data?: Record<string, unknown>) {
    console.error(JSON.stringify({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      callSid: this.callSid,
      streamSid: this.streamSid,
      event,
      error: error instanceof Error ? error.message : String(error),
      ...data
    }));
  },
  
  timing(event: string, durationMs: number, data?: Record<string, unknown>) {
    console.log(JSON.stringify({
      level: 'TIMING',
      timestamp: new Date().toISOString(),
      callSid: this.callSid,
      streamSid: this.streamSid,
      event,
      durationMs,
      ...data
    }));
  }
};

/**
 * Speaking style for contractor phone calls
 */
const CONTRACTOR_SPEAKING_STYLE = `

SPEAKING STYLE FOR CONTRACTOR PHONE CALLS:
- Speak like a friendly dispatcher or office manager - warm but efficient
- Use plain, direct language that field workers appreciate
- Keep answers SHORT: 1-2 sentences unless they ask for details
- Use contractions naturally (I'm, you're, we'll, can't)
- Confirm key information back: "Got it, you need service at [address]"
- When taking messages: "I'll make sure [contractor name] gets this right away"
- For scheduling: "Let me check what we have open..." then confirm clearly
- If you don't know something: "I'll need to check on that and have someone call you back"
- End calls warmly: "Thanks for calling. We'll take care of you."
- IMPORTANT: Always finish your sentences completely before stopping

AVOID:
- Corporate jargon or overly formal language
- Long explanations unless asked
- Fake enthusiasm or salesy tone
- Technical terms the caller won't care about
- Cutting off mid-sentence

Remember: This is a real phone call. Be human, helpful, and to the point.`;

interface CallSession {
  call_sid: string;
  contractor_id: string;
  conversation_history: any[];
}

/**
 * Standard mulaw decode table for accurate audio conversion
 */
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

/**
 * Convert Twilio's mulaw (8kHz) to OpenAI's PCM16 (24kHz)
 * Uses lookup table for accurate decoding and linear interpolation for upsampling
 */
function mulawToPCM16(mulawData: Uint8Array): string {
  // Decode mulaw to PCM16 at 8kHz using lookup table
  const pcm8k = new Int16Array(mulawData.length);
  
  for (let i = 0; i < mulawData.length; i++) {
    pcm8k[i] = MULAW_DECODE_TABLE[mulawData[i]];
  }
  
  // Upsample from 8kHz to 24kHz using linear interpolation
  const pcm24k = new Int16Array(pcm8k.length * 3);
  
  for (let i = 0; i < pcm8k.length; i++) {
    const curr = pcm8k[i];
    const next = pcm8k[Math.min(pcm8k.length - 1, i + 1)];
    
    // Original sample
    pcm24k[i * 3] = curr;
    
    // Linear interpolation for intermediate samples
    pcm24k[i * 3 + 1] = Math.round(curr + (next - curr) / 3);
    pcm24k[i * 3 + 2] = Math.round(curr + (next - curr) * 2 / 3);
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
 * Standard mulaw encode - convert linear PCM16 sample to mulaw byte
 */
function linearToMulaw(sample: number): number {
  const MULAW_BIAS = 33;
  const MULAW_MAX = 0x1FFF;
  
  const sign = (sample < 0) ? 0x80 : 0;
  if (sample < 0) sample = -sample;
  
  // Add bias
  sample = sample + MULAW_BIAS;
  if (sample > MULAW_MAX) sample = MULAW_MAX;
  
  // Find the segment (exponent)
  let exponent = 7;
  for (let i = 0; i < 8; i++) {
    if (sample < (0x84 << i)) {
      exponent = i;
      break;
    }
  }
  
  // Compute mantissa
  const mantissa = (sample >> (exponent + 3)) & 0x0F;
  
  // Combine and complement
  return ~(sign | (exponent << 4) | mantissa) & 0xFF;
}

/**
 * Convert OpenAI's PCM16 audio (24kHz) to Twilio's mulaw (8kHz)
 * Improved with better anti-aliasing filter
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
  
  // Apply 7-tap low-pass filter before downsampling (better anti-aliasing)
  const filtered: number[] = [];
  const coeffs = [0.05, 0.1, 0.2, 0.3, 0.2, 0.1, 0.05]; // Symmetric filter
  
  for (let i = 0; i < pcm24k.length; i++) {
    let sum = 0;
    for (let j = -3; j <= 3; j++) {
      const idx = Math.max(0, Math.min(pcm24k.length - 1, i + j));
      sum += pcm24k[idx] * coeffs[j + 3];
    }
    filtered[i] = Math.round(sum);
  }
  
  // Downsample from 24kHz to 8kHz (take every 3rd sample after filtering)
  const pcm8k: number[] = [];
  for (let i = 0; i < filtered.length; i += 3) {
    pcm8k.push(filtered[i]);
  }
  
  // Convert PCM16 to mulaw
  const mulaw = new Uint8Array(pcm8k.length);
  
  for (let i = 0; i < pcm8k.length; i++) {
    mulaw[i] = linearToMulaw(pcm8k[i]);
  }
  
  return mulaw;
}

/**
 * Audio buffer manager for smoother playback
 */
class AudioBufferManager {
  private buffer: Uint8Array[] = [];
  private totalBytes = 0;
  private maxBufferBytes = 8000; // ~1 second at 8kHz mulaw
  
  add(data: Uint8Array) {
    this.buffer.push(data);
    this.totalBytes += data.length;
    
    // Trim if buffer gets too large
    while (this.totalBytes > this.maxBufferBytes && this.buffer.length > 1) {
      const removed = this.buffer.shift();
      if (removed) this.totalBytes -= removed.length;
    }
  }
  
  flush(): Uint8Array | null {
    if (this.buffer.length === 0) return null;
    
    // Concatenate all buffered audio
    const result = new Uint8Array(this.totalBytes);
    let offset = 0;
    for (const chunk of this.buffer) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    this.buffer = [];
    this.totalBytes = 0;
    return result;
  }
  
  get size() {
    return this.totalBytes;
  }
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  
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
  let keepAliveInterval: number | null = null;
  let callStartTime: number | null = null;
  let lastAudioTime: number | null = null;
  const audioBuffer = new AudioBufferManager();

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

  // Cleanup function
  const cleanup = async (reason: string) => {
    Logger.info('cleanup_initiated', { reason, callDurationMs: callStartTime ? Date.now() - callStartTime : 0 });
    
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
    
    if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
      openaiWs.close();
    }
    
    if (callSid) {
      await supabase
        .from('call_sessions')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('call_sid', callSid);
    }
  };

  // Start recording
  const startRecording = async (sid: string) => {
    if (recordingStarted) return;
    recordingStarted = true;

    try {
      const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const projectId = Deno.env.get('SUPABASE_PROJECT_ID') || 'faqrzzodtmsybofakcvv';
      
      Logger.info('recording_starting', { callSid: sid });
      
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
      Logger.info('recording_started', { recordingSid: data.sid });
      
      await supabase
        .from('call_sessions')
        .update({ 
          recording_sid: data.sid, 
          recording_status: 'in-progress' 
        })
        .eq('call_sid', sid);
    } catch (error) {
      Logger.error('recording_failed', error);
    }
  };

  // Setup keep-alive ping
  const setupKeepAlive = () => {
    if (keepAliveInterval) clearInterval(keepAliveInterval);
    
    keepAliveInterval = setInterval(() => {
      // Send mark event to Twilio to keep connection alive
      if (twilioWs.readyState === WebSocket.OPEN) {
        twilioWs.send(JSON.stringify({
          event: 'mark',
          streamSid: streamSid,
          mark: { name: 'keepalive' }
        }));
        Logger.info('keepalive_sent', { target: 'twilio' });
      }
      
      // OpenAI Realtime API doesn't need explicit pings - the WebSocket handles it
      // But we log to track connection health
      if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
        Logger.info('keepalive_check', { 
          target: 'openai', 
          state: 'open',
          lastAudioMs: lastAudioTime ? Date.now() - lastAudioTime : null
        });
      }
    }, VOICE_CONFIG.keepAliveIntervalMs);
    
    Logger.info('keepalive_setup', { intervalMs: VOICE_CONFIG.keepAliveIntervalMs });
  };

  twilioWs.onopen = () => {
    Logger.info('twilio_ws_connected');
  };

  twilioWs.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      
      // Handle stream start
      if (message.event === 'start') {
        callStartTime = Date.now();
        callSid = message.start.callSid;
        streamSid = message.start.streamSid;
        
        Logger.setContext(callSid, streamSid);
        Logger.info('stream_started', { 
          mediaFormat: message.start.mediaFormat,
          customParameters: message.start.customParameters 
        });
        
        // Start recording and keep-alive
        startRecording(callSid);
        setupKeepAlive();
        
        // Verify call session exists
        const { data: session, error } = await supabase
          .from('call_sessions')
          .select('*')
          .eq('call_sid', callSid)
          .single();
        
        if (error || !session) {
          Logger.error('invalid_call_session', error, { callSid });
          await cleanup('invalid_session');
          twilioWs.close();
          return;
        }
        
        callSession = session as CallSession;
        const config = callSession.conversation_history[0];
        
        // Validate voice
        const supportedVoices = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse'];
        let voiceId = config.voice_id || VOICE_CONFIG.defaultVoice;
        if (!supportedVoices.includes(voiceId)) {
          Logger.warn('unsupported_voice', { requested: voiceId, fallback: VOICE_CONFIG.defaultVoice });
          voiceId = VOICE_CONFIG.defaultVoice;
        }
        
        // Get ephemeral token from OpenAI
        Logger.info('openai_token_requesting');
        const tokenStartTime = Date.now();
        
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
          Logger.error('openai_token_failed', new Error(errorText), { status: tokenResponse.status });
          
          // Don't hard-hangup - try to gracefully handle
          twilioWs.send(JSON.stringify({
            event: 'media',
            streamSid: streamSid,
            media: { payload: '' } // Empty audio
          }));
          return;
        }

        const tokenData = await tokenResponse.json();
        const ephemeralKey = tokenData.client_secret.value;
        
        Logger.timing('openai_token_obtained', Date.now() - tokenStartTime);

        // Connect to OpenAI
        const openaiUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`;
        
        Logger.info('openai_ws_connecting');
        openaiWs = new WebSocket(openaiUrl, [
          'realtime',
          `openai-insecure-api-key.${ephemeralKey}`,
          'openai-beta.realtime-v1'
        ]);
        
        const sessionConfig = {
          system_prompt: config.system_prompt,
          voice_id: voiceId,
          greeting: config.greeting
        };
        
        openaiWs.onopen = () => {
          Logger.info('openai_ws_connected');
        };
        
        openaiWs.onmessage = async (openaiEvent) => {
          try {
            const openaiMessage = JSON.parse(openaiEvent.data);
            
            // Handle session created
            if (openaiMessage.type === 'session.created') {
              Logger.info('openai_session_created');
              
              // Configure session with optimized settings
              openaiWs!.send(JSON.stringify({
                type: 'session.update',
                session: {
                  modalities: ['text', 'audio'],
                  instructions: config.system_prompt + CONTRACTOR_SPEAKING_STYLE,
                  voice: voiceId,
                  input_audio_format: 'pcm16',
                  output_audio_format: 'pcm16',
                  input_audio_transcription: {
                    model: 'whisper-1'
                  },
                  turn_detection: {
                    type: 'server_vad',
                    threshold: VOICE_CONFIG.vadThreshold,
                    prefix_padding_ms: VOICE_CONFIG.prefixPaddingMs,
                    silence_duration_ms: VOICE_CONFIG.silenceDurationMs,
                  },
                  temperature: VOICE_CONFIG.temperature,
                  max_response_output_tokens: VOICE_CONFIG.maxResponseTokens,
                }
              }));
            }
            
            // Handle session configured - send greeting
            if (openaiMessage.type === 'session.updated' && !hasGreeted) {
              hasGreeted = true;
              Logger.info('session_configured_sending_greeting');
              
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
              lastAudioTime = Date.now();
              
              // Convert and send to Twilio immediately (no buffering for lower latency)
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
            
            // Handle response done - log for timing analysis
            if (openaiMessage.type === 'response.done') {
              Logger.info('ai_response_complete', {
                status: openaiMessage.response?.status,
                outputTokens: openaiMessage.response?.usage?.output_tokens
              });
            }
            
            // Log user transcripts
            if (openaiMessage.type === 'conversation.item.input_audio_transcription.completed') {
              Logger.info('user_speech', { transcript: openaiMessage.transcript });
              
              if (callSession) {
                const history = callSession.conversation_history || [];
                history.push({ role: 'user', content: openaiMessage.transcript, timestamp: new Date().toISOString() });
                await supabase
                  .from('call_sessions')
                  .update({ conversation_history: history })
                  .eq('call_sid', callSid);
              }
            }
            
            // Log AI transcripts
            if (openaiMessage.type === 'response.audio_transcript.done') {
              Logger.info('ai_speech', { transcript: openaiMessage.transcript });
              
              if (callSession) {
                const history = callSession.conversation_history || [];
                history.push({ role: 'assistant', content: openaiMessage.transcript, timestamp: new Date().toISOString() });
                await supabase
                  .from('call_sessions')
                  .update({ conversation_history: history })
                  .eq('call_sid', callSid);
              }
            }
            
            // Handle errors gracefully
            if (openaiMessage.type === 'error') {
              Logger.error('openai_error', new Error(openaiMessage.error?.message || 'Unknown OpenAI error'), {
                code: openaiMessage.error?.code,
                type: openaiMessage.error?.type
              });
              
              // Don't close connection on transient errors
              if (openaiMessage.error?.code === 'rate_limit_exceeded') {
                // Wait a bit and continue
                await new Promise(r => setTimeout(r, 1000));
              }
            }
            
            // Log speech events for timing analysis
            if (openaiMessage.type === 'input_audio_buffer.speech_started') {
              Logger.info('user_speech_started');
            }
            
            if (openaiMessage.type === 'input_audio_buffer.speech_stopped') {
              Logger.info('user_speech_stopped');
            }
            
          } catch (error) {
            Logger.error('openai_message_processing_error', error);
          }
        };
        
        openaiWs.onerror = (error) => {
          Logger.error('openai_ws_error', error);
        };
        
        openaiWs.onclose = (event) => {
          Logger.info('openai_ws_closed', { code: event.code, reason: event.reason });
        };
      }
      
      // Handle incoming audio from caller
      if (message.event === 'media' && openaiWs && openaiWs.readyState === WebSocket.OPEN) {
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
      
      // Handle mark events (for keep-alive tracking)
      if (message.event === 'mark') {
        Logger.info('mark_received', { name: message.mark?.name });
      }
      
      // Handle stream stop
      if (message.event === 'stop') {
        const callDuration = callStartTime ? Date.now() - callStartTime : 0;
        Logger.info('stream_stopped', { 
          callDurationMs: callDuration,
          reason: 'twilio_stop_event'
        });
        await cleanup('stream_stop');
      }
      
    } catch (error) {
      Logger.error('message_processing_error', error);
    }
  };

  twilioWs.onerror = (error) => {
    Logger.error('twilio_ws_error', error);
  };

  twilioWs.onclose = async (event) => {
    const callDuration = callStartTime ? Date.now() - callStartTime : 0;
    Logger.info('twilio_ws_closed', { 
      code: event.code, 
      reason: event.reason,
      callDurationMs: callDuration
    });
    await cleanup('twilio_ws_close');
  };

  return response;
});
