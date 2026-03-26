import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { buildCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authentication required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    // Rate limit: 10 per day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from('ai_estimate_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('generated_at', todayStart.toISOString());

    if (countError) {
      console.error('Rate limit check error:', countError);
    }

    if ((count ?? 0) >= 10) {
      return new Response(JSON.stringify({
        error: 'Daily limit reached. You can generate up to 10 AI estimates per day.',
      }), {
        status: 429,
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const { job_type, square_footage, scope_description, zip_code, trade } = await req.json();

    if (!scope_description) {
      throw new Error('Scope description is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert construction estimator with 25+ years of experience across all trades. You provide accurate material takeoffs and cost estimates based on current US market pricing.

IMPORTANT RULES:
- Use realistic 2024-2025 US pricing adjusted for the region (zip code: ${zip_code || 'national average'})
- Include ALL materials needed, don't skip fasteners, connectors, adhesives, etc.
- Account for waste factor (typically 10-15% for materials)
- Labor hours should reflect realistic crew productivity
- Separate materials from labor clearly
- Include overhead (typically 10-15%) and profit margin (typically 10-20%)
- Add relevant assumptions and warnings

You MUST respond with ONLY a valid JSON object (no markdown, no explanation) matching this exact structure:
{
  "line_items": [
    {
      "category": "string (Materials, Labor, Equipment, Subcontractor, Other)",
      "description": "string",
      "quantity": number,
      "unit": "string (EA, SF, LF, SY, CY, HR, LS, etc.)",
      "unit_cost": number,
      "total": number,
      "notes": "string or null"
    }
  ],
  "labor_hours": number,
  "labor_rate_suggestion": number,
  "subtotal_materials": number,
  "subtotal_labor": number,
  "overhead_percent": number,
  "profit_margin_percent": number,
  "total_estimate": number,
  "assumptions": ["string"],
  "warnings": ["string"]
}`;

    const userPrompt = `Generate a detailed material and cost estimate for:

Job Type: ${job_type || 'General Construction'}
Trade: ${trade || 'General'}
Square Footage: ${square_footage || 'Not specified'}
Zip Code: ${zip_code || 'National average pricing'}

Scope of Work:
${scope_description}

Provide a complete, itemized estimate with all materials, labor, and costs.`;

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
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'AI rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please contact support.' }), {
          status: 402,
          headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
        });
      }
      throw new Error('Failed to generate estimate');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const tokenCount = data.usage?.total_tokens || 0;

    // Parse JSON from response
    let estimateData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      estimateData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      if (!estimateData || !estimateData.line_items) {
        throw new Error('Invalid response structure');
      }
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI estimate. Please try again.');
    }

    // Track usage
    await supabase.from('ai_estimate_usage').insert({
      user_id: user.id,
      job_type: job_type || 'general',
      input_summary: `${job_type || 'General'} - ${square_footage || '?'}SF - ${(scope_description || '').substring(0, 200)}`,
      token_count: tokenCount,
    });

    return new Response(JSON.stringify(estimateData), {
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const status = errorMessage.includes('Authentication') ? 401 : 500;
    return new Response(JSON.stringify({ error: errorMessage }), {
      status,
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
