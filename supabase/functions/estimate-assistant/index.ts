import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authentication required');
    }

    const { message, currentFormData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an AI assistant helping contractors create estimates. Extract structured data from natural language input and return it in JSON format.

Current form data: ${JSON.stringify(currentFormData)}

Extract and return ONLY a JSON object with any of these fields you can identify:
{
  "project_title": "string",
  "client_name": "string", 
  "client_email": "string",
  "client_phone": "string",
  "client_address": "string",
  "project_description": "string",
  "trade_type": "string (general, electrical, plumbing, hvac, roofing, concrete, landscaping, painting, carpentry)",
  "start_date": "YYYY-MM-DD",
  "completion_date": "YYYY-MM-DD",
  "line_items": [
    {
      "description": "string",
      "quantity": number,
      "unit": "string",
      "material_cost": number,
      "labor_hours": number,
      "labor_rate": number
    }
  ],
  "notes": "string"
}

Only include fields that were mentioned. Return valid JSON only, no explanations.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error('Failed to process with AI');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON from response
    let extractedData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      extractedData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      extractedData = {};
    }

    return new Response(JSON.stringify({ 
      extractedData,
      message: 'Fields extracted successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
