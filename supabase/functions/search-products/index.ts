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
      retailer,
      category,
      subcategory,
      trade,
      brand,
      material_type,
      max_price,
      min_price,
      search_term,
      limit = 10,
    } = body;

    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let query = supabase
      .from('retailer_catalog')
      .select('retailer, brand, model, title, description, category, subcategory, trade, price, unit_of_measure, size_text, material, inventory_status, product_url, image_url, last_synced_at, spec_attributes')
      .order('price', { ascending: true })
      .limit(Math.min(limit, 50));

    if (retailer) query = query.eq('retailer', retailer);
    if (category) query = query.ilike('category', `%${category}%`);
    if (subcategory) query = query.ilike('subcategory', `%${subcategory}%`);
    if (trade) query = query.ilike('trade', `%${trade}%`);
    if (brand) query = query.ilike('brand', `%${brand}%`);
    if (material_type) query = query.ilike('material_type', `%${material_type}%`);
    if (max_price) query = query.lte('price', max_price);
    if (min_price) query = query.gte('price', min_price);
    if (search_term) query = query.ilike('title', `%${search_term}%`);

    const { data: products, error: queryError } = await query;

    if (queryError) {
      return new Response(JSON.stringify({ error: queryError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      products: products || [],
      count: products?.length || 0,
      filters_applied: { retailer, category, subcategory, trade, brand, material_type, max_price, min_price, search_term },
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
