import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for',
};

const RATE_LIMIT_WINDOW = 3600000; // 1 hour in milliseconds
const MAX_VIEWS_PER_HOUR = 10;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Support both query param (GET) and JSON body (POST via supabase.functions.invoke)
    const url = new URL(req.url);
    let token = url.searchParams.get('token');

    if (!token && req.method === 'POST') {
      try {
        const body = await req.json();
        token = body?.token || null;
        console.log('get-public-estimate: token from body', token);
      } catch (e) {
        console.error('get-public-estimate: failed to parse body', e);
      }
    } else {
      console.log('get-public-estimate: token from query', token);
    }
    
    if (!token) {
      console.warn('get-public-estimate: missing token');
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client IP
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limit for this IP
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW).toISOString();
    
    const { data: recentViews, error: viewsError } = await supabase
      .from('estimate_views')
      .select('id')
      .eq('ip_address', clientIp)
      .gte('viewed_at', oneHourAgo);

    if (viewsError) {
      console.error('Error checking rate limit:', viewsError);
    }

    if (recentViews && recentViews.length >= MAX_VIEWS_PER_HOUR) {
      console.log(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ 
          error: 'Too many requests. Please try again later.',
          rate_limited: true 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch estimate
    const { data: estimate, error } = await supabase
      .from('estimates')
      .select('*')
      .eq('public_token', token)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Estimate not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    // Fetch contractor profile for branding (including brand colors)
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name, contact_name, logo_url, phone, business_address, city, state, zip_code, business_email, website_url, license_number, brand_primary_color, brand_secondary_color, brand_accent_color')
      .eq('id', estimate.user_id)
      .single();

    // Log view with IP address
    await supabase.from('estimate_views').insert({
      estimate_id: estimate.id,
      ip_address: clientIp,
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    // Update viewed_at if not already viewed
    if (!estimate.viewed_at) {
      await supabase
        .from('estimates')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', estimate.id);
    }

    return new Response(
      JSON.stringify({ 
        estimate,
        contractor: profile || null
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error fetching estimate:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
