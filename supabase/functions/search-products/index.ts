import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Auth required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid auth' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const {
      retailer = 'lowes',
      category = 'furnaces',
      max_price,
      brand,
      fuel_type,
      min_afue,
      zip_code,
      limit = 20,
    } = body;

    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let query = supabase
      .from('retailer_products')
      .select('brand, model, title, price, inventory_status, product_url, image_url, efficiency_afue, btu_input, fuel_type, last_synced_at')
      .eq('retailer', retailer)
      .eq('category', category)
      .order('price', { ascending: true })
      .limit(Math.min(limit, 50));

    if (max_price) {
      query = query.lte('price', max_price);
    }
    if (brand) {
      query = query.ilike('brand', `%${brand}%`);
    }
    if (fuel_type) {
      query = query.ilike('fuel_type', `%${fuel_type}%`);
    }
    if (min_afue) {
      query = query.gte('efficiency_afue', min_afue);
    }

    const { data: products, error: queryError } = await query;

    if (queryError) {
      return new Response(JSON.stringify({ error: queryError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      products: products || [],
      count: products?.length || 0,
      filters_applied: { retailer, category, max_price, brand, fuel_type, min_afue },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Search error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
