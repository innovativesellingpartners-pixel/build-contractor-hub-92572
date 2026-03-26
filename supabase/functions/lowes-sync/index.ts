import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

import { buildCorsHeaders } from '../_shared/cors.ts';

async function getLowesToken(): Promise<string> {
  const clientId = Deno.env.get('LOWES_CLIENT_ID');
  const clientSecret = Deno.env.get('LOWES_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Lowe\'s API credentials not configured');
  }

  const response = await fetch('https://apim.lowes.com/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Lowe's auth failed: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.access_token;
}

function normalizeProduct(raw: any): any {
  return {
    retailer: 'lowes',
    source_product_id: String(raw.productId || raw.id || raw.itemNumber || ''),
    sku: raw.itemNumber || raw.sku || null,
    brand: raw.brand || raw.brandName || null,
    model: raw.modelNumber || raw.model || null,
    title: raw.description || raw.productTitle || raw.title || 'Unknown Product',
    category: 'furnaces',
    subcategory: raw.subCategory || raw.subcategory || null,
    price: raw.price?.selling || raw.pricing?.price || raw.price || null,
    currency: 'USD',
    efficiency_afue: raw.afue || raw.efficiency || null,
    btu_input: raw.btuInput || raw.btu || null,
    fuel_type: raw.fuelType || raw.fuel || null,
    inventory_status: raw.availability?.availabilityStatus || raw.inventoryStatus || 'unknown',
    product_url: raw.pdURL ? `https://www.lowes.com${raw.pdURL}` : raw.productUrl || null,
    image_url: raw.imageUrl || raw.image || null,
    raw_json: raw,
    last_synced_at: new Date().toISOString(),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    // Verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Auth required' }), {
        status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
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
        status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle();

    const isAdmin = roleData || user.email?.endsWith('@myct1.com');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'sync';

    if (action === 'insert_sample') {
      // Insert sample furnace data for testing
      const sampleProducts = [
        {
          retailer: 'lowes',
          source_product_id: 'SAMPLE-001',
          sku: '1234567',
          brand: 'Goodman',
          model: 'GMVC960803BN',
          title: 'Goodman 80,000 BTU 96% AFUE Two-Stage Variable-Speed Upflow/Horizontal Gas Furnace',
          category: 'furnaces',
          subcategory: 'gas-furnaces',
          price: 1849.00,
          currency: 'USD',
          efficiency_afue: 96.0,
          btu_input: 80000,
          fuel_type: 'natural_gas',
          inventory_status: 'in_stock',
          product_url: 'https://www.lowes.com/pd/Goodman-GMVC960803BN',
          image_url: 'https://mobileimages.lowes.com/productimages/placeholder-furnace-1.jpg',
          last_synced_at: new Date().toISOString(),
        },
        {
          retailer: 'lowes',
          source_product_id: 'SAMPLE-002',
          sku: '2345678',
          brand: 'Winchester',
          model: 'W9M060B14',
          title: 'Winchester 60,000 BTU 92% AFUE Multi-Position Gas Furnace',
          category: 'furnaces',
          subcategory: 'gas-furnaces',
          price: 1299.00,
          currency: 'USD',
          efficiency_afue: 92.0,
          btu_input: 60000,
          fuel_type: 'natural_gas',
          inventory_status: 'in_stock',
          product_url: 'https://www.lowes.com/pd/Winchester-W9M060B14',
          image_url: 'https://mobileimages.lowes.com/productimages/placeholder-furnace-2.jpg',
          last_synced_at: new Date().toISOString(),
        },
        {
          retailer: 'lowes',
          source_product_id: 'SAMPLE-003',
          sku: '3456789',
          brand: 'MrCool',
          model: 'MGM80SE090B4A',
          title: 'MrCool 90,000 BTU 80% AFUE Single-Stage Upflow/Horizontal Gas Furnace',
          category: 'furnaces',
          subcategory: 'gas-furnaces',
          price: 949.00,
          currency: 'USD',
          efficiency_afue: 80.0,
          btu_input: 90000,
          fuel_type: 'natural_gas',
          inventory_status: 'in_stock',
          product_url: 'https://www.lowes.com/pd/MrCool-MGM80SE090B4A',
          image_url: 'https://mobileimages.lowes.com/productimages/placeholder-furnace-3.jpg',
          last_synced_at: new Date().toISOString(),
        },
        {
          retailer: 'lowes',
          source_product_id: 'SAMPLE-004',
          sku: '4567890',
          brand: 'Goodman',
          model: 'GMEC960603BN',
          title: 'Goodman 60,000 BTU 96% AFUE Single-Stage Upflow/Horizontal Gas Furnace',
          category: 'furnaces',
          subcategory: 'gas-furnaces',
          price: 1549.00,
          currency: 'USD',
          efficiency_afue: 96.0,
          btu_input: 60000,
          fuel_type: 'natural_gas',
          inventory_status: 'limited_stock',
          product_url: 'https://www.lowes.com/pd/Goodman-GMEC960603BN',
          image_url: 'https://mobileimages.lowes.com/productimages/placeholder-furnace-4.jpg',
          last_synced_at: new Date().toISOString(),
        },
        {
          retailer: 'lowes',
          source_product_id: 'SAMPLE-005',
          sku: '5678901',
          brand: 'Winchester',
          model: 'W9M100B20',
          title: 'Winchester 100,000 BTU 92% AFUE Multi-Position Gas Furnace',
          category: 'furnaces',
          subcategory: 'gas-furnaces',
          price: 1699.00,
          currency: 'USD',
          efficiency_afue: 92.0,
          btu_input: 100000,
          fuel_type: 'natural_gas',
          inventory_status: 'in_stock',
          product_url: 'https://www.lowes.com/pd/Winchester-W9M100B20',
          image_url: 'https://mobileimages.lowes.com/productimages/placeholder-furnace-5.jpg',
          last_synced_at: new Date().toISOString(),
        },
      ];

      const { data, error } = await supabase
        .from('retailer_products')
        .upsert(sampleProducts, { onConflict: 'retailer,source_product_id' })
        .select();

      if (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        action: 'insert_sample',
        count: data?.length || 0,
        message: `Inserted ${data?.length || 0} sample furnace products`
      }), {
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    // Full sync from Lowe's API
    const endpoint = Deno.env.get('LOWES_PRODUCT_ENDPOINT');
    
    if (!endpoint) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'LOWES_PRODUCT_ENDPOINT not configured. Use "insert_sample" action to add test data.'
      }), {
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    const token = await getLowesToken();

    const productResponse = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!productResponse.ok) {
      const errText = await productResponse.text();
      return new Response(JSON.stringify({ 
        success: false,
        error: `Lowe's API error: ${productResponse.status}`,
        details: errText
      }), {
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    const productData = await productResponse.json();
    const products = Array.isArray(productData) ? productData : (productData.products || productData.data || []);
    
    const normalized = products.map(normalizeProduct);

    if (normalized.length > 0) {
      const { error: upsertError } = await supabase
        .from('retailer_products')
        .upsert(normalized, { onConflict: 'retailer,source_product_id' });

      if (upsertError) {
        return new Response(JSON.stringify({ 
          success: false,
          error: `Database upsert failed: ${upsertError.message}`
        }), {
          headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      action: 'sync',
      count: normalized.length,
      synced_at: new Date().toISOString(),
      message: `Synced ${normalized.length} products from Lowe's`
    }), {
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
    });
  }
});
