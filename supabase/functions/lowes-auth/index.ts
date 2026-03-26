import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

import { buildCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    // Verify caller is admin
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

    // Check admin role
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);
    
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle();

    // Also allow @myct1.com emails
    const isAdmin = roleData || user.email?.endsWith('@myct1.com');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    const clientId = Deno.env.get('LOWES_CLIENT_ID');
    const clientSecret = Deno.env.get('LOWES_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ 
        error: 'Lowe\'s API credentials not configured',
        details: 'LOWES_CLIENT_ID and LOWES_CLIENT_SECRET must be set'
      }), {
        status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    // Request OAuth token from Lowe's
    const tokenResponse = await fetch('https://apim.lowes.com/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Lowes auth error:', tokenResponse.status, errorText);
      return new Response(JSON.stringify({ 
        success: false,
        error: `Lowe's auth failed: ${tokenResponse.status}`,
        details: errorText
      }), {
        status: 200, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    const tokenData = await tokenResponse.json();
    
    return new Response(JSON.stringify({ 
      success: true,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      // Never return the actual token to the frontend
      message: 'Lowe\'s authentication successful',
      tested_at: new Date().toISOString()
    }), {
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
    });
  }
});
