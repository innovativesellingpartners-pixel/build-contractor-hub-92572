import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

import { buildCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid auth' }), {
        status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const {
      retailer,
      category,
      subcategory,
      trade,
      material_type,
      max_price,
      min_price,
      brand,
      size_text,
      thickness,
      dimensions,
      material,
      color,
      zip_code,
      query_text,
      search_term, // legacy alias for query_text
      limit = 10,
    } = body;

    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const selectCols = 'retailer, brand, model, title, category, subcategory, size_text, dimensions, material, price, inventory_status, product_url, image_url, last_synced_at';

    let query = supabase
      .from('retailer_catalog')
      .select(selectCols)
      .order('price', { ascending: true })
      .limit(Math.min(Math.max(Number(limit) || 10, 1), 50));

    // Exact filters
    if (retailer) query = query.eq('retailer', retailer);
    if (zip_code) query = query.eq('zip_code', zip_code);

    // ILIKE filters
    if (category) query = query.ilike('category', `%${category}%`);
    if (subcategory) query = query.ilike('subcategory', `%${subcategory}%`);
    if (trade) query = query.ilike('trade', `%${trade}%`);
    if (brand) query = query.ilike('brand', `%${brand}%`);
    if (material_type) query = query.ilike('material_type', `%${material_type}%`);
    if (material) query = query.ilike('material', `%${material}%`);
    if (size_text) query = query.ilike('size_text', `%${size_text}%`);
    if (thickness) query = query.ilike('thickness', `%${thickness}%`);
    if (dimensions) query = query.ilike('dimensions', `%${dimensions}%`);
    if (color) query = query.ilike('color', `%${color}%`);

    // Price range
    if (max_price != null) query = query.lte('price', Number(max_price));
    if (min_price != null) query = query.gte('price', Number(min_price));

    // Full text search across multiple columns
    const freeText = query_text || search_term;
    if (freeText) {
      query = query.or(
        `title.ilike.%${freeText}%,description.ilike.%${freeText}%,category.ilike.%${freeText}%,subcategory.ilike.%${freeText}%,material_type.ilike.%${freeText}%,trade.ilike.%${freeText}%,size_text.ilike.%${freeText}%,brand.ilike.%${freeText}%`
      );
    }

    const { data: products, error: queryError } = await query;

    if (queryError) {
      console.error('Product search error:', queryError);
      return new Response(JSON.stringify({ error: 'Product search failed. Please try again.' }), {
        status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      products: products || [],
      count: products?.length || 0,
      filters_applied: { retailer, category, subcategory, trade, brand, material_type, material, size_text, thickness, dimensions, color, zip_code, max_price, min_price, query_text: freeText, limit },
    }), {
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Search error:', error);
    return new Response(JSON.stringify({
      error: 'An internal error occurred while searching products.'
    }), {
      status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
    });
  }
});
