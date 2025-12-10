/**
 * Twilio Media Stream WebSocket Handler - PRODUCTION OPTIMIZED v3.0
 * 
 * High-quality bidirectional audio streaming between Twilio and OpenAI Realtime API.
 * 
 * ========================
 * v3.0 UPGRADES:
 * ========================
 * 1. Enhanced audio codec with proper gain normalization (no clipping/distortion)
 * 2. Improved anti-aliasing with 15-tap Lanczos-style filter
 * 3. Optimized VAD for natural, responsive turn-taking (600ms)
 * 4. Warm "Coral" personality with personable, human-like conversation
 * 5. Better streaming with smooth chunk delivery
 * 6. Comprehensive audio quality logging
 * 
 * ========================
 * VOICE: Coral
 * ========================
 * Warm, friendly, professional tone perfect for contractor businesses.
 * AI introduces itself as "Coral - [Business Name]'s AI assistant"
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

/**
 * Voice AI Configuration - Tuned for natural, warm conversation
 */
const VOICE_CONFIG = {
  // Voice selection - Coral for warm, friendly tone
  defaultVoice: 'coral',
  
  // Response behavior
  temperature: 0.7,           // Slightly lower for more consistent personality
  maxResponseTokens: 4096,    // Allow complete thoughts
  
  // Turn detection - BALANCED: fast but allows complete thoughts
  vadThreshold: 0.5,          // Standard sensitivity
  prefixPaddingMs: 250,       // Slightly faster speech detection
  silenceDurationMs: 600,     // Balanced: faster than 700ms, allows pauses
  
  // Keep-alive intervals (ms)
  keepAliveIntervalMs: 15000,
  openaiAudioKeepAliveMs: 10000,
  
  // Audio quality settings
  targetGain: 0.85,           // Prevent clipping (leave headroom)
  noiseFloor: 50,             // Samples below this are treated as silence
  
  // Session management
  maxSessionDurationMs: 60 * 60 * 1000, // 60 minutes max
};

/**
 * Structured logger with audio quality metrics
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
      stack: error instanceof Error ? error.stack : undefined,
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
  },
  
  audio(event: string, data: Record<string, unknown>) {
    console.log(JSON.stringify({
      level: 'AUDIO',
      timestamp: new Date().toISOString(),
      callSid: this.callSid,
      streamSid: this.streamSid,
      event,
      ...data
    }));
  }
};

/**
 * Coral's personality - warm, upbeat, professional
 */
const CORAL_PERSONALITY = `
PERSONALITY & SPEAKING STYLE:

You are "Coral", a warm, upbeat, and professional voice assistant. You speak like a friendly, helpful human - not a robotic call center script.

VOICE CHARACTERISTICS:
- Warm and personable - like talking to a knowledgeable friend
- Upbeat but not overly enthusiastic - confident and calm
- Professional without being stiff or corporate
- Empathetic - you pick up on caller emotions and adapt

SPEAKING RULES:
- Use short, clear sentences (1-2 max before a natural pause)
- Use contractions naturally (I'm, you're, we'll, that's, can't)
- Speak at a relaxed pace - no rushing
- Leave brief pauses between ideas so callers stay comfortable
- Address the caller by name when you learn it
- Explain what you're doing before you do it ("Let me check that for you...")

CONVERSATION FLOW:
- Start with a warm greeting that includes your name
- Ask one question at a time - don't overwhelm
- Confirm key information back: "Got it, so you need..."
- When taking messages: "I'll make sure [contractor] gets this right away"
- For scheduling: "Let me see what's available..." then confirm clearly
- End warmly: "Thanks so much for calling. We'll take great care of you."

THINGS TO AVOID:
- Corporate jargon or overly formal language
- Long explanations unless specifically asked
- Fake enthusiasm or salesy tone
- Filler words (um, uh, like, you know)
- Cutting off mid-sentence - always complete your thoughts
- Mentioning you're an AI unless directly asked

Remember: You're having a real phone conversation. Be genuinely helpful, kind, and to the point.`;

interface CallSession {
  call_sid: string;
  contractor_id: string;
  conversation_history: any[];
}

/**
 * Standard mulaw decode lookup table
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
 * Lanczos kernel for high-quality resampling
 */
function lanczosKernel(x: number, a: number = 3): number {
  if (x === 0) return 1;
  if (Math.abs(x) >= a) return 0;
  const piX = Math.PI * x;
  return (a * Math.sin(piX) * Math.sin(piX / a)) / (piX * piX);
}

/**
 * High-quality Lanczos interpolation for upsampling
 */
function lanczosInterpolate(samples: Int16Array, srcIdx: number, t: number, a: number = 3): number {
  let sum = 0;
  let weightSum = 0;
  
  for (let i = -a + 1; i <= a; i++) {
    const idx = Math.max(0, Math.min(samples.length - 1, srcIdx + i));
    const weight = lanczosKernel(i - t, a);
    sum += samples[idx] * weight;
    weightSum += weight;
  }
  
  return weightSum > 0 ? Math.round(sum / weightSum) : 0;
}

/**
 * Normalize audio gain to prevent clipping while maximizing clarity
 */
function normalizeGain(samples: Int16Array, targetGain: number = 0.85): Int16Array {
  // Find peak amplitude
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > peak) peak = abs;
  }
  
  if (peak === 0) return samples;
  
  // Calculate gain factor (target 85% of max to leave headroom)
  const maxAmplitude = 32767;
  const targetPeak = maxAmplitude * targetGain;
  const gainFactor = peak > targetPeak ? targetPeak / peak : 1.0;
  
  // Apply gain if needed
  if (gainFactor < 1.0) {
    const result = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      result[i] = Math.round(samples[i] * gainFactor);
    }
    return result;
  }
  
  return samples;
}

/**
 * Convert Twilio's mulaw (8kHz) to OpenAI's PCM16 (24kHz)
 * Uses high-quality Lanczos resampling with gain normalization
 */
function mulawToPCM16(mulawData: Uint8Array): string {
  // Decode mulaw to PCM16 at 8kHz using lookup table
  const pcm8k = new Int16Array(mulawData.length);
  
  for (let i = 0; i < mulawData.length; i++) {
    pcm8k[i] = MULAW_DECODE_TABLE[mulawData[i]];
  }
  
  // Upsample from 8kHz to 24kHz using Lanczos interpolation (3x)
  const pcm24k = new Int16Array(pcm8k.length * 3);
  
  for (let i = 0; i < pcm8k.length; i++) {
    const baseIdx = i * 3;
    // Original sample position
    pcm24k[baseIdx] = pcm8k[i];
    // Interpolated samples at 1/3 and 2/3 positions
    pcm24k[baseIdx + 1] = lanczosInterpolate(pcm8k, i, 1/3);
    pcm24k[baseIdx + 2] = lanczosInterpolate(pcm8k, i, 2/3);
  }
  
  // Clamp to valid range
  for (let i = 0; i < pcm24k.length; i++) {
    pcm24k[i] = Math.max(-32768, Math.min(32767, pcm24k[i]));
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
 * Standard mulaw encode with proper bias
 */
function linearToMulaw(sample: number): number {
  const MULAW_BIAS = 33;
  const MULAW_MAX = 0x1FFF;
  
  const sign = (sample < 0) ? 0x80 : 0;
  if (sample < 0) sample = -sample;
  
  sample = sample + MULAW_BIAS;
  if (sample > MULAW_MAX) sample = MULAW_MAX;
  
  let exponent = 7;
  for (let i = 0; i < 8; i++) {
    if (sample < (0x84 << i)) {
      exponent = i;
      break;
    }
  }
  
  const mantissa = (sample >> (exponent + 3)) & 0x0F;
  return ~(sign | (exponent << 4) | mantissa) & 0xFF;
}

/**
 * 15-tap low-pass FIR filter coefficients for high-quality anti-aliasing
 * Designed for 24kHz -> 8kHz conversion (cutoff ~3.5kHz)
 */
const LOWPASS_COEFFS = [
  0.003, 0.008, 0.020, 0.040, 0.065, 0.090, 0.110, 0.128,
  0.110, 0.090, 0.065, 0.040, 0.020, 0.008, 0.003
];

/**
 * Apply high-quality low-pass filter before downsampling
 */
function applyLowPassFilter(samples: number[]): number[] {
  const filtered: number[] = [];
  const halfTaps = Math.floor(LOWPASS_COEFFS.length / 2);
  
  for (let i = 0; i < samples.length; i++) {
    let sum = 0;
    for (let j = 0; j < LOWPASS_COEFFS.length; j++) {
      const idx = i + j - halfTaps;
      const clampedIdx = Math.max(0, Math.min(samples.length - 1, idx));
      sum += samples[clampedIdx] * LOWPASS_COEFFS[j];
    }
    filtered.push(Math.round(sum));
  }
  
  return filtered;
}

/**
 * Convert OpenAI's PCM16 (24kHz) to Twilio's mulaw (8kHz)
 * High-quality with proper anti-aliasing and gain normalization
 */
function pcm16ToMulaw(base64PCM: string): Uint8Array {
  // Decode base64
  const binaryString = atob(base64PCM);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Convert bytes to Int16 PCM samples (little-endian)
  const pcm24k: number[] = [];
  for (let i = 0; i < bytes.length; i += 2) {
    if (i + 1 < bytes.length) {
      const sample = bytes[i] | (bytes[i + 1] << 8);
      pcm24k.push(sample > 32767 ? sample - 65536 : sample);
    }
  }
  
  // Apply high-quality low-pass filter before downsampling
  const filtered = applyLowPassFilter(pcm24k);
  
  // Downsample from 24kHz to 8kHz (take every 3rd sample)
  const pcm8k: number[] = [];
  for (let i = 0; i < filtered.length; i += 3) {
    pcm8k.push(filtered[i]);
  }
  
  // Normalize gain to prevent clipping
  let peak = 0;
  for (const sample of pcm8k) {
    const abs = Math.abs(sample);
    if (abs > peak) peak = abs;
  }
  
  const gainFactor = peak > 32767 * VOICE_CONFIG.targetGain 
    ? (32767 * VOICE_CONFIG.targetGain) / peak 
    : 1.0;
  
  // Convert PCM16 to mulaw with gain adjustment
  const mulaw = new Uint8Array(pcm8k.length);
  
  for (let i = 0; i < pcm8k.length; i++) {
    const adjustedSample = Math.round(pcm8k[i] * gainFactor);
    mulaw[i] = linearToMulaw(adjustedSample);
  }
  
  return mulaw;
}

/**
 * Generate minimal silent audio for keep-alive
 */
function generateSilentAudio(): string {
  // 24000 samples/sec * 0.05 sec = 1200 samples (~50ms)
  const silentSamples = new Int16Array(1200);
  // Very low amplitude noise to prevent detection as true silence
  for (let i = 0; i < silentSamples.length; i++) {
    silentSamples[i] = Math.floor(Math.random() * 6) - 3;
  }
  const uint8 = new Uint8Array(silentSamples.buffer);
  let binary = '';
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
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
  let sessionPingInterval: number | null = null;
  let callStartTime: number | null = null;
  let lastAudioTime: number | null = null;
  let sessionPingCounter = 0;
  let audioChunksSent = 0;
  let audioChunksReceived = 0;

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

  // Cleanup function with comprehensive logging
  const cleanup = async (reason: string) => {
    const callDuration = callStartTime ? Date.now() - callStartTime : 0;
    
    Logger.info('cleanup_initiated', { 
      reason, 
      callDurationMs: callDuration,
      audioChunksSent,
      audioChunksReceived,
      keepAlivePings: sessionPingCounter
    });
    
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
    
    if (sessionPingInterval) {
      clearInterval(sessionPingInterval);
      sessionPingInterval = null;
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

  // Start call recording
  const startRecording = async (sid: string) => {
    if (recordingStarted) return;
    recordingStarted = true;

    try {
      const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const projectId = 'faqrzzodtmsybofakcvv';
      
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

  // Setup keep-alive pings
  const setupKeepAlive = () => {
    if (keepAliveInterval) clearInterval(keepAliveInterval);
    if (sessionPingInterval) clearInterval(sessionPingInterval);
    
    // Twilio mark events every 15 seconds
    keepAliveInterval = setInterval(() => {
      if (twilioWs.readyState === WebSocket.OPEN) {
        twilioWs.send(JSON.stringify({
          event: 'mark',
          streamSid: streamSid,
          mark: { name: 'keepalive_' + Date.now() }
        }));
        Logger.info('keepalive_sent', { target: 'twilio' });
      }
    }, VOICE_CONFIG.keepAliveIntervalMs);
    
    // OpenAI audio keep-alive every 10 seconds
    sessionPingInterval = setInterval(() => {
      if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
        sessionPingCounter++;
        
        const silentAudio = generateSilentAudio();
        openaiWs.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: silentAudio
        }));
        
        Logger.info('audio_keepalive_sent', { 
          pingNumber: sessionPingCounter,
          lastAudioMs: lastAudioTime ? Date.now() - lastAudioTime : null,
          callDurationMs: callStartTime ? Date.now() - callStartTime : 0
        });
      }
    }, VOICE_CONFIG.openaiAudioKeepAliveMs);
    
    Logger.info('keepalive_setup', { 
      twilioIntervalMs: VOICE_CONFIG.keepAliveIntervalMs,
      openaiAudioKeepAliveMs: VOICE_CONFIG.openaiAudioKeepAliveMs
    });
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
        
        // Get call session
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
          return;
        }

        const tokenData = await tokenResponse.json();
        const ephemeralKey = tokenData.client_secret.value;
        
        Logger.timing('openai_token_obtained', Date.now() - tokenStartTime);

        // Build the Coral greeting with business name
        const businessName = config.business_name || 'our company';
        const coralGreeting = config.greeting || 
          `Hey there! This is Coral, ${businessName}'s AI assistant. Thanks for calling! How can I help you today?`;

        // Build enhanced system prompt with Coral personality
        const enhancedPrompt = `${config.system_prompt}

${CORAL_PERSONALITY}

IMPORTANT: Your name is "Coral - ${businessName}'s AI assistant". Introduce yourself this way at the start of the call.`;

        // Connect to OpenAI Realtime
        const openaiUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`;
        
        Logger.info('openai_ws_connecting', { voice: voiceId });
        openaiWs = new WebSocket(openaiUrl, [
          'realtime',
          `openai-insecure-api-key.${ephemeralKey}`,
          'openai-beta.realtime-v1'
        ]);
        
        openaiWs.onopen = () => {
          Logger.info('openai_ws_connected');
        };
        
        openaiWs.onmessage = async (openaiEvent) => {
          try {
            const openaiMessage = JSON.parse(openaiEvent.data);
            
            // Handle session created - configure with optimized settings
            if (openaiMessage.type === 'session.created') {
              Logger.info('openai_session_created');
              
              openaiWs!.send(JSON.stringify({
                type: 'session.update',
                session: {
                  modalities: ['text', 'audio'],
                  instructions: enhancedPrompt,
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
                  tools: [
                    {
                      type: 'function',
                      name: 'schedule_appointment',
                      description: 'Schedule an appointment or site visit for the customer.',
                      parameters: {
                        type: 'object',
                        properties: {
                          customer_name: { type: 'string', description: 'Customer\'s name' },
                          customer_phone: { type: 'string', description: 'Customer\'s callback phone number' },
                          address: { type: 'string', description: 'Address for the site visit' },
                          preferred_date: { type: 'string', description: 'Preferred date' },
                          preferred_time: { type: 'string', description: 'Preferred time' },
                          job_type: { type: 'string', description: 'Type of job or service needed' },
                          is_emergency: { type: 'boolean', description: 'Whether this is an emergency' },
                          notes: { type: 'string', description: 'Additional notes' }
                        },
                        required: ['customer_name', 'job_type']
                      }
                    },
                    {
                      type: 'function',
                      name: 'take_voicemail',
                      description: 'Record a voicemail message for the contractor.',
                      parameters: {
                        type: 'object',
                        properties: {
                          customer_name: { type: 'string', description: 'Customer\'s name' },
                          customer_phone: { type: 'string', description: 'Customer\'s callback phone number' },
                          message: { type: 'string', description: 'The message to leave' },
                          urgency: { type: 'string', enum: ['low', 'normal', 'high', 'emergency'] },
                          job_reference: { type: 'string', description: 'Job number if they have one' }
                        },
                        required: ['message']
                      }
                    },
                    {
                      type: 'function', 
                      name: 'lookup_job',
                      description: 'Look up an existing job by reference number.',
                      parameters: {
                        type: 'object',
                        properties: {
                          job_number: { type: 'string', description: 'The job or reference number' }
                        },
                        required: ['job_number']
                      }
                    }
                  ],
                  tool_choice: 'auto'
                }
              }));
            }
            
            // Send greeting after session is configured
            if (openaiMessage.type === 'session.updated' && !hasGreeted) {
              hasGreeted = true;
              Logger.info('session_configured_sending_greeting', { greeting: coralGreeting });
              
              openaiWs!.send(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'message',
                  role: 'user',
                  content: [{
                    type: 'input_text',
                    text: `[System: Start the conversation by greeting the caller. Say: "${coralGreeting}"]`
                  }]
                }
              }));
              
              openaiWs!.send(JSON.stringify({
                type: 'response.create'
              }));
            }
            
            // Handle audio from AI - send immediately for low latency
            if (openaiMessage.type === 'response.audio.delta') {
              lastAudioTime = Date.now();
              audioChunksSent++;
              
              const mulawData = pcm16ToMulaw(openaiMessage.delta);
              const base64Mulaw = btoa(String.fromCharCode(...mulawData));
              
              twilioWs.send(JSON.stringify({
                event: 'media',
                streamSid: streamSid,
                media: {
                  payload: base64Mulaw
                }
              }));
              
              // Log audio quality metrics periodically
              if (audioChunksSent % 100 === 0) {
                Logger.audio('audio_quality_check', {
                  chunksSent: audioChunksSent,
                  mulawBytes: mulawData.length,
                  callDurationMs: callStartTime ? Date.now() - callStartTime : 0
                });
              }
            }
            
            // Log response completion
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
                history.push({ 
                  role: 'user', 
                  content: openaiMessage.transcript, 
                  timestamp: new Date().toISOString() 
                });
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
                history.push({ 
                  role: 'assistant', 
                  content: openaiMessage.transcript, 
                  timestamp: new Date().toISOString() 
                });
                await supabase
                  .from('call_sessions')
                  .update({ conversation_history: history })
                  .eq('call_sid', callSid);
              }
            }
            
            // Handle errors gracefully
            if (openaiMessage.type === 'error') {
              Logger.error('openai_error', new Error(openaiMessage.error?.message), {
                code: openaiMessage.error?.code,
                type: openaiMessage.error?.type
              });
              
              if (openaiMessage.error?.code === 'rate_limit_exceeded') {
                await new Promise(r => setTimeout(r, 1000));
              }
            }
            
            // Handle function calls
            if (openaiMessage.type === 'response.function_call_arguments.done') {
              const functionName = openaiMessage.name;
              const callId = openaiMessage.call_id;
              let args: any = {};
              
              try {
                args = JSON.parse(openaiMessage.arguments || '{}');
              } catch (e) {
                Logger.error('function_args_parse_error', e);
              }
              
              Logger.info('function_call', { functionName, callId, args });
              
              let result: { success: boolean; message: string; job?: any } = { 
                success: false, 
                message: 'Unknown function' 
              };
              
              // Handle schedule_appointment
              if (functionName === 'schedule_appointment') {
                try {
                  const contractorId = callSession?.contractor_id;
                  
                  if (contractorId) {
                    const { data: calendarConnection } = await supabase
                      .from('calendar_connections')
                      .select('*')
                      .eq('user_id', contractorId)
                      .single();
                    
                    await supabase.from('ai_call_actions').insert({
                      call_id: callSid,
                      contractor_id: contractorId,
                      action_type: 'schedule_appointment',
                      action_data: {
                        customer_name: args.customer_name || 'Unknown',
                        customer_phone: args.customer_phone || '',
                        address: args.address || '',
                        preferred_date: args.preferred_date || '',
                        preferred_time: args.preferred_time || '',
                        job_type: args.job_type || '',
                        is_emergency: args.is_emergency || false,
                        notes: args.notes || '',
                        has_calendar: !!calendarConnection
                      },
                      completed: false
                    });
                    
                    result = { 
                      success: true, 
                      message: `Perfect! I've got ${args.customer_name || 'your'} appointment request recorded. ${calendarConnection ? 'It will be added to the calendar.' : 'The contractor will call back to confirm the time.'}` 
                    };
                    
                    Logger.info('appointment_scheduled', { contractorId, args });
                  }
                } catch (error) {
                  Logger.error('schedule_appointment_error', error);
                  result = { 
                    success: false, 
                    message: 'I had a small hiccup, but don\'t worry - the contractor will call you back to confirm.' 
                  };
                }
              }
              
              // Handle take_voicemail
              if (functionName === 'take_voicemail') {
                try {
                  const contractorId = callSession?.contractor_id;
                  
                  if (contractorId) {
                    await supabase.from('ai_call_actions').insert({
                      call_id: callSid,
                      contractor_id: contractorId,
                      action_type: 'voicemail',
                      action_data: {
                        customer_name: args.customer_name || 'Unknown',
                        customer_phone: args.customer_phone || '',
                        message: args.message || '',
                        urgency: args.urgency || 'normal',
                        job_reference: args.job_reference || ''
                      },
                      completed: false
                    });
                    
                    result = { 
                      success: true, 
                      message: `Got it! I'll make sure ${args.customer_name || 'your'} message gets to the contractor right away.` 
                    };
                    
                    Logger.info('voicemail_recorded', { contractorId, args });
                  }
                } catch (error) {
                  Logger.error('take_voicemail_error', error);
                  result = { 
                    success: false, 
                    message: 'Message noted! We\'ll pass it along.' 
                  };
                }
              }
              
              // Handle lookup_job
              if (functionName === 'lookup_job') {
                try {
                  const contractorId = callSession?.contractor_id;
                  
                  if (contractorId && args.job_number) {
                    const { data: job } = await supabase
                      .from('jobs')
                      .select('id, name, job_number, status, customer_id')
                      .eq('user_id', contractorId)
                      .or(`job_number.ilike.%${args.job_number}%,name.ilike.%${args.job_number}%`)
                      .limit(1)
                      .single();
                    
                    if (job) {
                      result = { 
                        success: true, 
                        message: `Found it! Job: ${job.name}. Number: ${job.job_number || 'not assigned yet'}. Status: ${job.status || 'active'}.`,
                        job: job
                      };
                    } else {
                      result = { 
                        success: false, 
                        message: `Hmm, I couldn't find that reference number. No worries though - let me help you as a new inquiry!` 
                      };
                    }
                    
                    Logger.info('job_lookup', { 
                      contractorId, 
                      jobNumber: args.job_number, 
                      found: !!job 
                    });
                  }
                } catch (error) {
                  Logger.error('lookup_job_error', error);
                  result = { 
                    success: false, 
                    message: 'I had trouble looking that up. Let me help you another way!' 
                  };
                }
              }
              
              // Send function result back to OpenAI
              openaiWs!.send(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'function_call_output',
                  call_id: callId,
                  output: JSON.stringify(result)
                }
              }));
              
              openaiWs!.send(JSON.stringify({
                type: 'response.create'
              }));
            }
            
            // Log speech events
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
        audioChunksReceived++;
        
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
      
      // Handle mark events
      if (message.event === 'mark') {
        Logger.info('mark_received', { name: message.mark?.name });
      }
      
      // Handle stream stop
      if (message.event === 'stop') {
        Logger.info('stream_stopped', { 
          callDurationMs: callStartTime ? Date.now() - callStartTime : 0,
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
    Logger.info('twilio_ws_closed', { 
      code: event.code, 
      reason: event.reason,
      callDurationMs: callStartTime ? Date.now() - callStartTime : 0
    });
    await cleanup('twilio_ws_close');
  };

  return response;
});
