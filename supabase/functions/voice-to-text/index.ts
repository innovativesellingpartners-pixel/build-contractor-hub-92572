import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { buildCorsHeaders } from '../_shared/cors.ts';

// Process base64 in chunks to prevent memory issues
function base64ToUint8Array(base64String: string): Uint8Array {
  try {
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.error('Error decoding base64:', error);
    throw new Error('Invalid audio data format');
  }
}

// Determine file extension from mime type
function getFileExtension(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/x-m4a': 'm4a',
    'audio/aac': 'aac',
  };
  return mimeMap[mimeType] || 'webm';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: buildCorsHeaders(req) });
  }

  try {
    const body = await req.json();
    const { audio, mimeType = 'audio/webm' } = body;
    
    if (!audio) {
      console.error('No audio data provided');
      throw new Error('No audio data provided');
    }

    console.log('Received audio data, mimeType:', mimeType, 'length:', audio.length);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Convert base64 to binary
    const binaryAudio = base64ToUint8Array(audio);
    console.log('Decoded audio bytes:', binaryAudio.length);

    if (binaryAudio.length < 100) {
      throw new Error('Audio recording too short. Please record for longer.');
    }

    // Get file extension based on mime type
    const extension = getFileExtension(mimeType);
    const filename = `recording.${extension}`;
    
    console.log('Creating file with name:', filename);

    // Prepare form data
    const formData = new FormData();
    const blob = new Blob([binaryAudio.buffer as ArrayBuffer], { type: mimeType });
    formData.append('file', blob, filename);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    console.log('Sending to OpenAI Whisper API...');

    // Send to OpenAI
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      // Parse error for better user messaging
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          if (errorJson.error.message.includes('Invalid file format')) {
            throw new Error('Audio format not supported. Please try recording again.');
          }
          throw new Error(errorJson.error.message);
        }
      } catch (parseError) {
        // If we can't parse the error, use the raw text
      }
      
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('Transcription successful, text length:', result.text?.length || 0);

    if (!result.text || result.text.trim().length === 0) {
      throw new Error('No speech detected. Please speak clearly and try again.');
    }

    return new Response(
      JSON.stringify({ text: result.text }),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in voice-to-text:', error);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      }
    );
  }
});
