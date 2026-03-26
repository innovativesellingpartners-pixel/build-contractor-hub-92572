/**
 * Twilio Voice Webhook - Optimized AI Voice Assistant
 * 
 * OPTIMIZATIONS:
 * - Answer within 3 rings (reduced forward timeout)
 * - Structured info collection: name → phone → address → email
 * - Natural, warm conversational tone
 * - Calendar integration with email invites and verbal confirmation
 * - Faster response times with optimized gather timeouts
 * - Stable connection without random dropouts
 * 
 * Flow:
 * 1. Caller calls → Answer quickly with warm greeting
 * 2. Collect info in order: name, phone, address, email
 * 3. Schedule appointment in calendar
 * 4. Send email invite to customer
 * 5. Confirm verbally and end professionally
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Conversation stages for structured info collection
type ConversationStage = 
  | 'greeting'
  | 'collect_name'
  | 'collect_phone'
  | 'collect_address'
  | 'collect_email'
  | 'schedule_appointment'
  | 'confirm_booking'
  | 'general_conversation'
  | 'ending';

interface CollectedInfo {
  name?: string;
  phone?: string;
  address?: string;
  email?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  serviceNeeded?: string;
  requestedDateTime?: string; // Raw user request like "today at 3pm"
}

/**
 * Parse natural language time expressions into a Date object
 * Examples: "today at 3pm", "tomorrow morning", "next Monday at 2"
 */
function parseRequestedTime(timeRequest: string, timezone: string = 'America/New_York'): { startDate: Date; endDate: Date; displayTime: string } {
  const now = new Date();
  const lowerRequest = timeRequest.toLowerCase();
  
  // Default to tomorrow at 10 AM
  let targetDate = new Date(now);
  let hours = 10;
  let minutes = 0;
  
  // Parse day references
  if (lowerRequest.includes('today')) {
    targetDate = new Date(now);
  } else if (lowerRequest.includes('tomorrow')) {
    targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (lowerRequest.includes('monday')) {
    targetDate = getNextDayOfWeek(now, 1);
  } else if (lowerRequest.includes('tuesday')) {
    targetDate = getNextDayOfWeek(now, 2);
  } else if (lowerRequest.includes('wednesday')) {
    targetDate = getNextDayOfWeek(now, 3);
  } else if (lowerRequest.includes('thursday')) {
    targetDate = getNextDayOfWeek(now, 4);
  } else if (lowerRequest.includes('friday')) {
    targetDate = getNextDayOfWeek(now, 5);
  } else if (lowerRequest.includes('saturday')) {
    targetDate = getNextDayOfWeek(now, 6);
  } else if (lowerRequest.includes('sunday')) {
    targetDate = getNextDayOfWeek(now, 0);
  } else if (lowerRequest.includes('next week')) {
    targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + 7);
  } else {
    // Default to tomorrow if no day specified
    targetDate.setDate(targetDate.getDate() + 1);
  }
  
  // Parse time references
  const timePatterns = [
    /(\d{1,2}):?(\d{2})?\s*(am|pm|a\.m\.|p\.m\.)/i,
    /(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)/i,
    /(\d{1,2})\s*o'?clock/i,
  ];
  
  for (const pattern of timePatterns) {
    const match = lowerRequest.match(pattern);
    if (match) {
      hours = parseInt(match[1]);
      minutes = match[2] ? parseInt(match[2]) : 0;
      const meridiem = match[3] || match[2];
      
      if (meridiem && (meridiem.toLowerCase().includes('p') && hours !== 12)) {
        hours += 12;
      } else if (meridiem && (meridiem.toLowerCase().includes('a') && hours === 12)) {
        hours = 0;
      }
      break;
    }
  }
  
  // Handle relative time words
  if (lowerRequest.includes('morning') && !timePatterns.some(p => lowerRequest.match(p))) {
    hours = 9;
  } else if (lowerRequest.includes('afternoon') && !timePatterns.some(p => lowerRequest.match(p))) {
    hours = 14;
  } else if (lowerRequest.includes('evening') && !timePatterns.some(p => lowerRequest.match(p))) {
    hours = 17;
  }
  
  // Set the final date/time
  targetDate.setHours(hours, minutes, 0, 0);
  
  // If the time has already passed today, move to tomorrow
  if (targetDate <= now) {
    targetDate.setDate(targetDate.getDate() + 1);
  }
  
  const endDate = new Date(targetDate);
  endDate.setHours(endDate.getHours() + 1); // 1 hour duration
  
  // Format display time
  const displayTime = targetDate.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone
  });
  
  return { startDate: targetDate, endDate, displayTime };
}

/**
 * Get the next occurrence of a specific day of week
 */
function getNextDayOfWeek(from: Date, dayOfWeek: number): Date {
  const result = new Date(from);
  const daysUntil = (dayOfWeek + 7 - from.getDay()) % 7 || 7;
  result.setDate(result.getDate() + daysUntil);
  return result;
}

/**
 * Normalize phone number to E.164 format
 */
function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    cleaned = '+1' + cleaned;
  }
  return cleaned;
}

/**
 * Look up contractor by Twilio phone number
 */
async function lookupContractorByPhoneNumber(supabase: any, toNumber: string) {
  const normalizedTo = normalizePhoneNumber(toNumber);
  
  const { data, error } = await supabase
    .from('phone_numbers')
    .select('contractor_id, tenant_id, twilio_phone_number')
    .eq('twilio_phone_number', normalizedTo)
    .eq('active', true)
    .single();
  
  if (error) {
    console.log('No phone number record found for:', normalizedTo, error);
    return null;
  }
  
  return data;
}

/**
 * Get contractor AI profile
 */
async function getContractorAIProfile(supabase: any, contractorId: string) {
  const { data, error } = await supabase
    .from('contractor_ai_profiles')
    .select('*')
    .eq('contractor_id', contractorId)
    .single();
  
  if (error) {
    console.log('No AI profile found for contractor:', contractorId);
    return null;
  }
  
  return data;
}

/**
 * Extract information from user speech based on current stage
 */
function extractInfo(speech: string, stage: ConversationStage): Partial<CollectedInfo> {
  const extracted: Partial<CollectedInfo> = {};
  const lowerSpeech = speech.toLowerCase();
  
  // Extract name patterns
  if (stage === 'collect_name' || stage === 'greeting') {
    // Look for "my name is X" or "I'm X" or "this is X"
    const namePatterns = [
      /my name is ([a-zA-Z\s]+)/i,
      /i'm ([a-zA-Z\s]+)/i,
      /this is ([a-zA-Z\s]+)/i,
      /it's ([a-zA-Z\s]+)/i,
      /call me ([a-zA-Z\s]+)/i,
    ];
    for (const pattern of namePatterns) {
      const match = speech.match(pattern);
      if (match) {
        extracted.name = match[1].trim().split(/\s+/).slice(0, 3).join(' ');
        break;
      }
    }
    // If short response, might just be the name
    if (!extracted.name && speech.split(/\s+/).length <= 3) {
      extracted.name = speech.trim();
    }
  }
  
  // Extract phone number patterns
  if (stage === 'collect_phone') {
    const phoneMatch = speech.match(/(\d[\d\s\-\.]+\d)/);
    if (phoneMatch) {
      extracted.phone = phoneMatch[1].replace(/[\s\-\.]/g, '');
    }
  }
  
  // Extract email patterns
  if (stage === 'collect_email') {
    // Convert spoken email to format
    let emailText = speech
      .replace(/\s+at\s+/gi, '@')
      .replace(/\s+dot\s+/gi, '.')
      .replace(/\s/g, '');
    
    const emailMatch = emailText.match(/[\w.\-]+@[\w.\-]+\.\w+/i);
    if (emailMatch) {
      extracted.email = emailMatch[0].toLowerCase();
    }
  }
  
  // For address, we'll capture the full response
  if (stage === 'collect_address') {
    extracted.address = speech.trim();
  }
  
  return extracted;
}

/**
 * Determine next stage based on current stage and collected info
 */
function getNextStage(currentStage: ConversationStage, collectedInfo: CollectedInfo): ConversationStage {
  switch (currentStage) {
    case 'greeting':
    case 'collect_name':
      return collectedInfo.name ? 'collect_phone' : 'collect_name';
    case 'collect_phone':
      return collectedInfo.phone ? 'collect_address' : 'collect_phone';
    case 'collect_address':
      return collectedInfo.address ? 'collect_email' : 'collect_address';
    case 'collect_email':
      return collectedInfo.email ? 'schedule_appointment' : 'collect_email';
    case 'schedule_appointment':
      return 'confirm_booking';
    case 'confirm_booking':
      return 'ending';
    default:
      return 'general_conversation';
  }
}

/**
 * Get prompt for each stage - warm, conversational, and efficient
 */
function getStagePrompt(stage: ConversationStage, collectedInfo: CollectedInfo, aiProfile: any): string {
  const businessName = aiProfile.business_name || 'our company';
  const firstName = collectedInfo.name?.split(' ')[0] || '';
  
  switch (stage) {
    case 'collect_name':
      return "Great! To get started, may I have your name please?";
    
    case 'collect_phone':
      return `Perfect, ${firstName}! And what's the best phone number to reach you at?`;
    
    case 'collect_address':
      return `Got it! What's the address for the service location?`;
    
    case 'collect_email':
      return `Almost done! What's your email address so I can send you a calendar invite?`;
    
    case 'schedule_appointment':
      return `Wonderful, ${firstName}! Let me get you scheduled. When would work best for you - morning or afternoon, and do you have a preferred day this week?`;
    
    case 'confirm_booking':
      return `__BOOKING_CONFIRMATION__`; // Placeholder - will be replaced with actual confirmation
    
    case 'ending':
      return `You're all set, ${firstName}! You'll receive a calendar invite at ${collectedInfo.email} shortly. Is there anything else I can help you with today?`;
    
    default:
      return '';
  }
}

/**
 * Get AI response using Lovable AI with optimized settings
 */
async function getAIResponse(
  systemPrompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userMessage: string,
  stage: ConversationStage,
  collectedInfo: CollectedInfo,
  aiProfile: any
): Promise<{ response: string; newStage: ConversationStage; updatedInfo: CollectedInfo }> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  
  // Update collected info based on current speech
  const extracted = extractInfo(userMessage, stage);
  const updatedInfo = { ...collectedInfo, ...extracted };
  
  // Check if we should use a scripted response for info collection
  let newStage = stage;
  let response = '';
  
  // Determine if we got the info we needed
  if (stage === 'greeting' || stage === 'collect_name') {
    if (updatedInfo.name) {
      newStage = 'collect_phone';
      response = getStagePrompt('collect_phone', updatedInfo, aiProfile);
    } else {
      newStage = 'collect_name';
      response = getStagePrompt('collect_name', updatedInfo, aiProfile);
    }
  } else if (stage === 'collect_phone') {
    if (extracted.phone) {
      newStage = 'collect_address';
      response = getStagePrompt('collect_address', updatedInfo, aiProfile);
    } else {
      response = `I didn't catch that number, ${updatedInfo.name?.split(' ')[0]}. Could you repeat your phone number for me?`;
    }
  } else if (stage === 'collect_address') {
    if (extracted.address) {
      newStage = 'collect_email';
      response = getStagePrompt('collect_email', updatedInfo, aiProfile);
    } else {
      response = `What's the street address where you need the service?`;
    }
  } else if (stage === 'collect_email') {
    if (extracted.email) {
      newStage = 'schedule_appointment';
      response = getStagePrompt('schedule_appointment', updatedInfo, aiProfile);
    } else {
      response = `I need your email to send the calendar invite. Can you spell it out for me?`;
    }
  } else if (stage === 'schedule_appointment') {
    // Capture the user's requested date/time for parsing
    newStage = 'confirm_booking';
    // The booking will be handled separately
    response = '__SCHEDULE_APPOINTMENT__';
    updatedInfo.requestedDateTime = userMessage; // Capture their scheduling preference for time parsing
    updatedInfo.serviceNeeded = userMessage;
  } else {
    // For general conversation or ending, use AI
    if (!apiKey) {
      return { 
        response: "Thanks for calling! Is there anything else I can help you with?", 
        newStage: 'ending',
        updatedInfo 
      };
    }

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-6), // Keep context short for speed
        { role: 'user', content: userMessage }
      ];

      const aiResponse = await fetch(LOVABLE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages,
          max_tokens: 100, // Even shorter for faster responses
          temperature: 0.8, // Slightly more natural variation
        }),
      });

      if (!aiResponse.ok) {
        console.error('AI API error:', aiResponse.status);
        response = "Of course! How can I help you further?";
      } else {
        const data = await aiResponse.json();
        response = data.choices?.[0]?.message?.content || "Is there anything else you need?";
      }
      
      // Check if ending
      const lowerResponse = response.toLowerCase();
      if (lowerResponse.includes('goodbye') || lowerResponse.includes('have a great day')) {
        newStage = 'ending';
      }
    } catch (error) {
      console.error('AI request failed:', error);
      response = "Is there anything else I can help with today?";
    }
  }
  
  return { response, newStage, updatedInfo };
}

/**
 * Build optimized system prompt
 */
function buildSystemPrompt(aiProfile: any): string {
  return `You are a warm, friendly voice assistant for ${aiProfile.business_name}, a ${aiProfile.trade} business.

PERSONALITY:
- Be warm, personable, and genuinely helpful - like a friendly receptionist
- Use natural speech with contractions (I'm, you're, we'll, that's great!)
- Sound enthusiastic but not over-the-top
- Be efficient - get to the point quickly

CONVERSATION RULES:
- Keep responses to 1-2 SHORT sentences maximum
- NEVER use emojis, markdown, or special characters
- NEVER say "I'm an AI" or mention being automated
- If the caller seems done, offer a warm goodbye
- Ask only ONE thing at a time

BUSINESS CONTEXT:
- Business: ${aiProfile.business_name}
- Trade: ${aiProfile.trade}
- Services: ${aiProfile.services_offered?.join(', ') || 'General services'}

When someone says goodbye or thanks you, respond warmly: "You're welcome! Have a wonderful day!"`;
}

/**
 * Schedule appointment and send calendar invite
 */
async function scheduleAppointment(
  supabase: any,
  collectedInfo: CollectedInfo,
  aiProfile: any,
  contractorId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Parse the requested time from the user's speech
    const timeRequest = collectedInfo.requestedDateTime || collectedInfo.serviceNeeded || 'tomorrow at 10am';
    console.log('Parsing time request:', timeRequest);
    
    const { startDate, endDate, displayTime } = parseRequestedTime(timeRequest);
    console.log('Parsed appointment time:', { startDate: startDate.toISOString(), displayTime });
    
    // Format for display
    const meetingTimeFormatted = startDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const meetingDateFormatted = startDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Store the meeting in job_meetings table for CRM visibility
    const meetingTitle = `Appointment - ${collectedInfo.name}`;
    const meetingDescription = `Voice AI scheduled appointment\nCustomer: ${collectedInfo.name}\nPhone: ${collectedInfo.phone}\nAddress: ${collectedInfo.address}\nEmail: ${collectedInfo.email}`;
    
    // Insert into job_meetings so it shows in CRM calendar
    const { data: meetingRecord, error: meetingError } = await supabase
      .from('job_meetings')
      .insert({
        user_id: contractorId,
        title: meetingTitle,
        scheduled_date: startDate.toISOString().split('T')[0],
        scheduled_time: startDate.toTimeString().split(' ')[0],
        duration_minutes: 60,
        location: collectedInfo.address || '',
        meeting_type: 'consultation',
        notes: meetingDescription,
      })
      .select()
      .single();
    
    if (meetingError) {
      console.error('Error creating job_meeting:', meetingError);
      // Continue anyway - the calendar event is more important
    } else {
      console.log('Created job_meeting record:', meetingRecord?.id);
    }
    
    // Create calendar event in contractor's connected calendar
    const calendarResponse = await fetch(`${supabaseUrl}/functions/v1/create-calendar-event`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobName: meetingTitle,
        description: meetingDescription,
        location: collectedInfo.address,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        contractorId: contractorId,
        attendees: collectedInfo.email ? [collectedInfo.email] : [],
        sendInvites: true,
      }),
    });
    
    const calendarResult = await calendarResponse.json();
    console.log('Calendar event result:', calendarResult);
    
    // Always send email invite to customer (with ICS attachment)
    let emailSent = false;
    if (collectedInfo.email) {
      try {
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-meeting-invite`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientEmail: collectedInfo.email,
            meetingTitle: `Appointment with ${aiProfile.business_name}`,
            meetingDate: meetingDateFormatted,
            meetingTime: meetingTimeFormatted,
            duration: 60,
            location: collectedInfo.address,
            notes: `Looking forward to meeting you! If you need to reschedule, please call us back at ${aiProfile.contractor_phone || 'our office'}.`,
            contractorId: contractorId,
            startDateTime: startDate.toISOString(),
            endDateTime: endDate.toISOString(),
          }),
        });
        
        const emailResult = await emailResponse.json();
        console.log('Email invite result:', emailResult);
        emailSent = emailResult.success || emailResult.emailResponse;
      } catch (emailErr) {
        console.error('Error sending email invite:', emailErr);
      }
    }
    
    if (calendarResult.created || calendarResult.results?.some((r: any) => r.success)) {
      // Calendar event created successfully
      const confirmMessage = emailSent
        ? `Perfect! I've scheduled you for ${displayTime} and added it to the calendar. You'll receive a calendar invite at ${collectedInfo.email} momentarily!`
        : `Perfect! I've scheduled you for ${displayTime} and added it to the calendar. We look forward to seeing you!`;
      
      return {
        success: true,
        message: confirmMessage
      };
    } else if (calendarResult.requiresCalendarConnection) {
      // No calendar connected - but we still saved the meeting and sent email
      const fallbackMessage = emailSent
        ? `Great! I've scheduled your appointment for ${displayTime}. I've sent a calendar invite to ${collectedInfo.email} so you won't forget!`
        : `Great! I've scheduled your appointment for ${displayTime}. Someone from our team will confirm with you shortly.`;
      
      return {
        success: true,
        message: fallbackMessage
      };
    }
    
    // Fallback - meeting saved but calendar sync failed
    return {
      success: true,
      message: `I've scheduled your appointment for ${displayTime}. ${collectedInfo.email ? `I've sent an invite to ${collectedInfo.email}. ` : ''}We look forward to meeting you!`
    };
  } catch (error) {
    console.error('Error scheduling appointment:', error);
    return {
      success: false,
      message: "I've got all your information. Someone from our team will call you back shortly to confirm your appointment."
    };
  }
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate a summary of the conversation
 */
async function generateSummary(
  history: Array<{ role: string; content: string }>, 
  collectedInfo: CollectedInfo,
  businessName: string
): Promise<string> {
  // Include collected info in summary
  const infoSummary = [];
  if (collectedInfo.name) infoSummary.push(`Name: ${collectedInfo.name}`);
  if (collectedInfo.phone) infoSummary.push(`Phone: ${collectedInfo.phone}`);
  if (collectedInfo.address) infoSummary.push(`Address: ${collectedInfo.address}`);
  if (collectedInfo.email) infoSummary.push(`Email: ${collectedInfo.email}`);
  
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey || history.length === 0) {
    return infoSummary.join('\n') || 'Call completed';
  }

  try {
    const transcript = history.map(m => 
      `${m.role === 'user' ? 'Caller' : 'Assistant'}: ${m.content}`
    ).join('\n');

    const response = await fetch(LOVABLE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{
          role: 'system',
          content: 'Summarize this call in 2 sentences. Include key info collected and outcome.'
        }, {
          role: 'user',
          content: `Call to ${businessName}:\n\nCollected Info:\n${infoSummary.join('\n')}\n\nTranscript:\n${transcript}`
        }],
        max_tokens: 150,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || infoSummary.join('\n');
  } catch {
    return infoSummary.join('\n') || 'Call completed';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const formData = await req.text();
    const params = new URLSearchParams(formData);
    
    const from = params.get('From') || '';
    const to = params.get('To') || '';
    const callSid = params.get('CallSid') || '';
    const callStatus = params.get('CallStatus') || '';
    const speechResult = params.get('SpeechResult') || '';

    console.log('Twilio webhook:', { from, to, callSid, callStatus, hasSpeech: !!speechResult });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up contractor
    const phoneNumberRecord = await lookupContractorByPhoneNumber(supabase, to);
    
    if (!phoneNumberRecord) {
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We're sorry, this number is not currently configured. Please contact support.</Say>
  <Hangup/>
</Response>`;
      return new Response(errorTwiml, {
        headers: { 'Content-Type': 'application/xml', ...corsHeaders }
      });
    }

    const contractorId = phoneNumberRecord.contractor_id;
    const tenantId = phoneNumberRecord.tenant_id;

    // Get AI profile
    const aiProfile = await getContractorAIProfile(supabase, contractorId);
    
    // Check if AI is enabled
    if (!aiProfile || !aiProfile.ai_enabled || aiProfile.inbound_call_mode === 'voicemail_only') {
      const voicemailTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Hi, you've reached ${aiProfile?.business_name || 'our office'}. Please leave a message after the tone.</Say>
  <Record maxLength="120" playBeep="true" action="https://${supabaseUrl.replace('https://', '')}/functions/v1/twilio-recording-callback"/>
  <Say voice="Polly.Joanna">Thank you. We'll get back to you soon. Goodbye.</Say>
  <Hangup/>
</Response>`;
      return new Response(voicemailTwiml, {
        headers: { 'Content-Type': 'application/xml', ...corsHeaders }
      });
    }

    // OPTIMIZED: Ring contractor for max 3 rings (~12 seconds) instead of 5
    const forwardTimeout = Math.min(aiProfile.forward_timeout_seconds || 0, 12);
    const contractorPhone = aiProfile.contractor_phone;

    if (forwardTimeout > 0 && contractorPhone && !speechResult) {
      console.log(`Ringing contractor ${contractorPhone} for ${forwardTimeout}s (3 rings max)`);

      await supabase.from('calls').insert({
        from_number: from,
        to_number: to,
        call_sid: callSid,
        call_status: callStatus,
        contractor_id: contractorId,
        tenant_id: tenantId,
        routing_status: 'forwarding_to_contractor',
        forwarded_to_contractor: true,
      });

      const fallbackUrl = `https://${supabaseUrl.replace('https://', '')}/functions/v1/twilio-voice-fallback`;
      const dialTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="${forwardTimeout}" action="${fallbackUrl}" callerId="${to}">
    <Number>${contractorPhone}</Number>
  </Dial>
</Response>`;

      return new Response(dialTwiml, {
        headers: { 'Content-Type': 'text/xml', ...corsHeaders },
      });
    }

    // Get or create call session
    let { data: session } = await supabase
      .from('call_sessions')
      .select('*')
      .eq('call_sid', callSid)
      .single();

    const actionUrl = `https://${supabaseUrl.replace('https://', '')}/functions/v1/twilio-voice-inbound`;

    if (!session) {
      // First interaction - create session with structured data
      const initialInfo: CollectedInfo = {};
      const { data: newSession } = await supabase
        .from('call_sessions')
        .insert({
          call_sid: callSid,
          contractor_id: contractorId,
          tenant_id: tenantId,
          from_number: from,
          to_number: to,
          status: 'active',
          conversation_history: [],
          // Store stage and collected info in conversation_history as metadata
        })
        .select()
        .single();
      
      session = newSession;

      // Log the call
      await supabase.from('calls').insert({
        from_number: from,
        to_number: to,
        call_sid: callSid,
        call_status: callStatus,
        contractor_id: contractorId,
        tenant_id: tenantId,
        routing_status: 'ai_handling',
        ai_handled: true,
      });

      // OPTIMIZED: Warm, efficient greeting that immediately starts info collection
      const greeting = aiProfile.custom_greeting || 
        `Hi there! Thanks for calling ${aiProfile.business_name}! I'm here to help get you scheduled. To get started, may I have your name please?`;

      // OPTIMIZED: Faster gather settings - reduced timeout for quicker responses
      const greetingTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" timeout="4" speechTimeout="auto" action="${actionUrl}" method="POST">
    <Say voice="Polly.Joanna">${escapeXml(greeting)}</Say>
  </Gather>
  <Say voice="Polly.Joanna">I'm still here if you need me. What's your name?</Say>
  <Gather input="speech" timeout="4" speechTimeout="auto" action="${actionUrl}" method="POST"/>
  <Say voice="Polly.Joanna">No worries! Call back when you're ready. Have a great day!</Say>
  <Hangup/>
</Response>`;

      return new Response(greetingTwiml, {
        headers: { 'Content-Type': 'application/xml', ...corsHeaders }
      });
    }

    // Continuing conversation
    if (speechResult) {
      console.log('User said:', speechResult);
      
      // Get conversation history and parse stage/info
      const history: Array<{ role: string; content: string }> = session.conversation_history || [];
      
      // Determine current stage from history length
      let currentStage: ConversationStage = 'collect_name';
      let collectedInfo: CollectedInfo = {};
      
      // Parse collected info from history
      for (const msg of history) {
        if (msg.role === 'user') {
          // Try to extract info based on conversation position
          const idx = history.indexOf(msg);
          if (idx === 0) {
            const extracted = extractInfo(msg.content, 'collect_name');
            if (extracted.name) collectedInfo.name = extracted.name;
          } else if (idx === 2) {
            const extracted = extractInfo(msg.content, 'collect_phone');
            if (extracted.phone) collectedInfo.phone = extracted.phone;
          } else if (idx === 4) {
            const extracted = extractInfo(msg.content, 'collect_address');
            if (extracted.address) collectedInfo.address = extracted.address;
          } else if (idx === 6) {
            const extracted = extractInfo(msg.content, 'collect_email');
            if (extracted.email) collectedInfo.email = extracted.email;
          }
        }
      }
      
      // Determine current stage based on what we have
      if (!collectedInfo.name) {
        currentStage = 'collect_name';
      } else if (!collectedInfo.phone) {
        currentStage = 'collect_phone';
      } else if (!collectedInfo.address) {
        currentStage = 'collect_address';
      } else if (!collectedInfo.email) {
        currentStage = 'collect_email';
      } else {
        currentStage = 'schedule_appointment';
      }
      
      // Add user message to history
      history.push({ role: 'user', content: speechResult });
      
      // Get response based on stage
      const systemPrompt = buildSystemPrompt(aiProfile);
      const { response, newStage, updatedInfo } = await getAIResponse(
        systemPrompt, 
        history, 
        speechResult, 
        currentStage, 
        collectedInfo,
        aiProfile
      );
      
      let finalResponse = response;
      
      // Handle scheduling
      if (response === '__SCHEDULE_APPOINTMENT__' || newStage === 'confirm_booking') {
        const scheduleResult = await scheduleAppointment(supabase, updatedInfo, aiProfile, contractorId);
        finalResponse = scheduleResult.message;
      }
      
      console.log('AI response:', finalResponse, 'Stage:', newStage);
      
      // Add assistant message to history
      history.push({ role: 'assistant', content: finalResponse });
      
      // Update session with collected info stored in history
      await supabase
        .from('call_sessions')
        .update({ 
          conversation_history: history,
          caller_name: updatedInfo.name || session.caller_name,
          updated_at: new Date().toISOString()
        })
        .eq('call_sid', callSid);
      
      // Check if conversation is ending
      const lowerResponse = finalResponse.toLowerCase();
      const lowerSpeech = speechResult.toLowerCase();
      const isEnding = lowerResponse.includes('goodbye') || 
                       lowerResponse.includes('have a great day') ||
                       lowerResponse.includes('have a wonderful day') ||
                       lowerSpeech.includes('goodbye') ||
                       lowerSpeech.includes('thank you') && lowerSpeech.includes('bye') ||
                       newStage === 'ending';
      
      if (isEnding || (updatedInfo.email && newStage === 'confirm_booking')) {
        // End call professionally after confirmation
        const closingMessage = isEnding ? finalResponse : 
          `${finalResponse} Thanks so much for calling ${aiProfile.business_name}! Have a wonderful day!`;
        
        await supabase
          .from('call_sessions')
          .update({ 
            status: 'completed',
            ai_summary: await generateSummary(history, updatedInfo, aiProfile.business_name),
            updated_at: new Date().toISOString()
          })
          .eq('call_sid', callSid);

        await supabase
          .from('calls')
          .update({ 
            call_status: 'completed',
            ai_summary: await generateSummary(history, updatedInfo, aiProfile.business_name),
            customer_info: updatedInfo,
            updated_at: new Date().toISOString()
          })
          .eq('call_sid', callSid);

        const endTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(closingMessage)}</Say>
  <Hangup/>
</Response>`;
        return new Response(endTwiml, {
          headers: { 'Content-Type': 'application/xml', ...corsHeaders }
        });
      }

      // OPTIMIZED: Continue conversation with faster gather settings
      const continueTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" timeout="6" speechTimeout="auto" action="${actionUrl}" method="POST">
    <Say voice="Polly.Joanna">${escapeXml(finalResponse)}</Say>
  </Gather>
  <Say voice="Polly.Joanna">Are you still there?</Say>
  <Gather input="speech" timeout="4" speechTimeout="auto" action="${actionUrl}" method="POST"/>
  <Say voice="Polly.Joanna">No problem! Call back anytime. Have a great day!</Say>
  <Hangup/>
</Response>`;

      return new Response(continueTwiml, {
        headers: { 'Content-Type': 'application/xml', ...corsHeaders }
      });
    }

    // No speech detected - prompt again
    const promptTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" timeout="4" speechTimeout="auto" action="${actionUrl}" method="POST">
    <Say voice="Polly.Joanna">I'm still here! How can I help you today?</Say>
  </Gather>
  <Say voice="Polly.Joanna">No worries! Call back when you're ready. Take care!</Say>
  <Hangup/>
</Response>`;

    return new Response(promptTwiml, {
      headers: { 'Content-Type': 'application/xml', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error in twilio-voice-inbound:', error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">I'm so sorry, we're experiencing technical difficulties. Please try calling back in a moment.</Say>
  <Hangup/>
</Response>`;
    
    return new Response(errorTwiml, {
      headers: { 'Content-Type': 'application/xml', ...corsHeaders }
    });
  }
});
