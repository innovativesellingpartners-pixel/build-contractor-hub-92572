import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    // Input validation
    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid prompt format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (prompt.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Prompt exceeds 5000 character limit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Prompt cannot be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize: remove control characters
    const sanitizedPrompt = trimmedPrompt.replace(/[\x00-\x1F\x7F]/g, '');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Call Lovable AI to extract job details
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a job detail extraction assistant. Extract job information from natural language descriptions.
Return ONLY a JSON object with these fields (all optional):
- name: Job title/name
- description: Brief description of work
- address: Street address
- city: City name
- state: 2-letter state code (uppercase)
- zip_code: Zip code
- total_cost: Estimated budget as a number (extract from phrases like "$25,000", "budget is 25k", etc.)
- notes: Any additional relevant information

Extract as much information as possible. If something is not mentioned, omit that field.
For costs, convert phrases like "25k", "$25,000", "twenty-five thousand" to numeric values.`
          },
          {
            role: 'user',
            content: sanitizedPrompt
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_job_details',
              description: 'Extract job details from natural language',
              parameters: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Job name or title' },
                  description: { type: 'string', description: 'Description of the work' },
                  address: { type: 'string', description: 'Street address' },
                  city: { type: 'string', description: 'City name' },
                  state: { type: 'string', description: 'Two-letter state code' },
                  zip_code: { type: 'string', description: 'Zip code' },
                  total_cost: { type: 'string', description: 'Estimated budget as a number' },
                  notes: { type: 'string', description: 'Additional notes' }
                },
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_job_details' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Response:', JSON.stringify(data, null, 2));

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const jobDetails = JSON.parse(toolCall.function.arguments);
      
      return new Response(
        JSON.stringify({ jobDetails }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    } else {
      throw new Error('No tool call found in AI response');
    }

  } catch (error: any) {
    console.error('Error in extract-job-details:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
