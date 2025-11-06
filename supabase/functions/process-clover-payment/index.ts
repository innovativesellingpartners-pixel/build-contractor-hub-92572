import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Official pricing configuration - SERVER-SIDE SOURCE OF TRUTH
const TIER_PRICING = {
  launch: { monthly: 99.99, quarterly: 299.97, yearly: 1079.89 },
  growth: { monthly: 250, quarterly: 750, yearly: 2700 },
  accel: { monthly: 199, quarterly: 597, yearly: 2149 }
} as const;

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    const { amount, tier_id, billing_cycle, customer_email } = await req.json();

    // CRITICAL SECURITY: Validate pricing server-side
    const validTier = TIER_PRICING[tier_id as keyof typeof TIER_PRICING];
    if (!validTier) {
      throw new Error('Invalid tier selected');
    }

    const expectedAmount = billing_cycle === 'quarterly' 
      ? validTier.quarterly * 100 
      : validTier.yearly * 100;

    if (amount !== expectedAmount) {
      console.error(`Price manipulation detected! Expected: ${expectedAmount}, Received: ${amount}`);
      throw new Error('Price validation failed. Please refresh and try again.');
    }

    console.log('Creating Clover checkout session:', { amount, tier_id, billing_cycle });
    console.log('Clover environment:', Deno.env.get('CLOVER_ENV'));

    // Get Clover credentials from environment
    const cloverApiToken = Deno.env.get('CLOVER_API_TOKEN');
    const cloverMerchantId = Deno.env.get('CLOVER_MERCHANT_ID');

    if (!cloverApiToken || !cloverMerchantId) {
      throw new Error('Clover credentials not configured');
    }

    // Determine tier name for display
    const tierNames: Record<string, string> = {
      'launch': 'Launch Growth Starter',
      'growth': 'Growth Business Builder',
      'accel': 'Accel! Market Dominator'
    };

    // Decide environment (sandbox or production) with auto-fallback
    const envRaw = (Deno.env.get('CLOVER_ENV') || 'auto').toLowerCase();
    const envMode = ['sandbox', 'production'].includes(envRaw) ? envRaw : 'auto';
    const candidates = envMode === 'sandbox'
      ? ['https://apisandbox.dev.clover.com']
      : envMode === 'production'
        ? ['https://api.clover.com']
        : ['https://api.clover.com', 'https://apisandbox.dev.clover.com'];

    let lastErrorText = '';
    let successfulEnv = '';
    
    for (const baseUrl of candidates) {
      console.log('Trying Clover Hosted Checkout endpoint:', baseUrl);
      const cloverResponse = await fetch(
        `${baseUrl}/invoicingcheckoutservice/v1/checkouts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cloverApiToken}`,
            'Content-Type': 'application/json',
            'X-Clover-Merchant-Id': cloverMerchantId,
          },
          body: JSON.stringify({
            customer: {
              email: customer_email || 'customer@example.com',
            },
            shoppingCart: {
              lineItems: [
                {
                  name: `${tierNames[tier_id] || tier_id} Subscription`,
                  unitQty: 1,
                  price: amount,
                  note: `${billing_cycle} billing cycle`,
                },
              ],
            },
          }),
        }
      );
      
      successfulEnv = baseUrl.includes('sandbox') ? 'SANDBOX' : 'PRODUCTION';

      const responseText = await cloverResponse.text();
      console.log('Clover API response status:', cloverResponse.status);
      console.log('Clover API response:', responseText);

      if (cloverResponse.ok) {
        const cloverData = JSON.parse(responseText);
        console.log(`✅ SUCCESS using ${successfulEnv} environment`);
        console.log('Checkout session created:', cloverData.checkoutSessionId);
        console.log('Checkout URL:', cloverData.href);
        console.log('Merchant ID used:', cloverMerchantId);
        
        const response = {
          success: true,
          checkout_url: cloverData.href,
          session_id: cloverData.checkoutSessionId,
          environment: successfulEnv,
        };
        
        console.log('Returning response:', JSON.stringify(response));
        
        return new Response(
          JSON.stringify(response),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      lastErrorText = responseText || `HTTP ${cloverResponse.status}`;
      // If 404, try next base URL (likely wrong env)
      if (cloverResponse.status === 404) {
        console.warn('Clover 404, trying next environment if available');
        continue;
      }
      // Non-404 failure, break early
      break;
    }

    throw new Error(`Clover checkout creation failed. Details: ${lastErrorText}. Check your CLOVER_ENV (sandbox vs production), merchant ID, and API token.`);
  } catch (error) {
    console.error('Checkout session creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});
