/**
 * ElevenLabs Stream Handler - Bridges Twilio Media Streams to ElevenLabs Conversational AI
 * 
 * This WebSocket handler receives audio from Twilio and forwards it to ElevenLabs agent,
 * then returns the agent's audio response back to Twilio.
 * 
 * Agent ID: agent_9901kcrxhb4yfr7r2gzq3rfs6add
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const ELEVENLABS_AGENT_ID = "agent_9901kcrxhb4yfr7r2gzq3rfs6add";

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
  
  // Audio buffers for format conversion
  let twilioAudioBuffer: number[] = [];
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('[ElevenLabs Handler] WebSocket connection established');

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
          
          // Connect to ElevenLabs agent
          await connectToElevenLabs();
          break;
          
        case 'media':
          // Forward audio to ElevenLabs
          if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) {
            // Twilio sends mulaw 8kHz, ElevenLabs expects PCM 16kHz
            const audioData = data.media.payload;
            
            // Send audio to ElevenLabs
            elevenLabsWs.send(JSON.stringify({
              user_audio_chunk: audioData // Base64 encoded audio
            }));
          }
          break;
          
        case 'stop':
          console.log('[ElevenLabs Handler] Stream stopped');
          cleanup();
          break;
          
        default:
          console.log('[ElevenLabs Handler] Unknown Twilio event:', data.event);
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
        
        // Send initial configuration
        elevenLabsWs!.send(JSON.stringify({
          type: "conversation_initiation_client_data",
          conversation_initiation_client_data: {
            conversation_config_override: {
              agent: {
                // Override agent settings if needed based on contractor profile
              }
            }
          }
        }));
      };

      elevenLabsWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'conversation_initiation_metadata':
              console.log('[ElevenLabs Handler] Conversation initiated:', data.conversation_initiation_metadata_event?.conversation_id);
              break;
              
            case 'audio':
              // Forward audio back to Twilio
              if (twilioWs.readyState === WebSocket.OPEN && data.audio_event?.audio_base_64) {
                // ElevenLabs sends PCM audio, convert to mulaw for Twilio
                twilioWs.send(JSON.stringify({
                  event: 'media',
                  streamSid: streamSid,
                  media: {
                    payload: data.audio_event.audio_base_64
                  }
                }));
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
      };

      elevenLabsWs.onclose = (event) => {
        console.log('[ElevenLabs Handler] ElevenLabs WebSocket closed:', event.code, event.reason);
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
            job_id: null, // Can be linked later
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
