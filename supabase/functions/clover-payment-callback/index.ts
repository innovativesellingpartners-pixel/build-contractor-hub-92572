import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Verify Clover webhook signature using Web Crypto API
 * Clover signs webhooks with HMAC-SHA256 using the API token
 */
async function verifyCloverSignature(
  apiToken: string,
  signature: string | null,
  body: string
): Promise<boolean> {
  if (!signature) {
    console.error('No signature provided');
    return false;
  }

  try {
    // Clover uses HMAC-SHA256 with the API token
    const encoder = new TextEncoder();
    const keyData = encoder.encode(apiToken);
    const messageData = encoder.encode(body);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageData
    );
    
    // Convert to hex
    const signatureArray = new Uint8Array(signatureBuffer);
    const expectedSignature = Array.from(signatureArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    console.log('Clover signature verification:', {
      expected: expectedSignature,
      received: signature,
      match: expectedSignature === signature
    });
    
    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying Clover signature:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Clover API token for signature verification
    const cloverApiToken = Deno.env.get('CLOVER_API_TOKEN');
    
    if (!cloverApiToken) {
      console.error('CLOVER_API_TOKEN not configured');
      return new Response('Server configuration error', { status: 500 });
    }

    // Get signature from header (Clover typically uses X-Clover-Signature or similar)
    const cloverSignature = req.headers.get('X-Clover-Signature') || 
                           req.headers.get('X-Clover-Hmac-Sha256');
    
    // Read body for signature verification
    const body = await req.text();
    
    // Verify signature
    if (!(await verifyCloverSignature(cloverApiToken, cloverSignature, body))) {
      console.error('Invalid Clover webhook signature');
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse the verified request
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const paymentId = url.searchParams.get('payment_id');

    console.log('Verified Clover payment callback:', { status, paymentId });

    // Get the frontend URL
    const frontendUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 
                        'https://lovable.app';

    if (status === 'success' && paymentId) {
      // Redirect to success page with payment info
      return Response.redirect(
        `${frontendUrl}/payment-success?payment_id=${paymentId}`,
        302
      );
    } else {
      // Redirect to cancelled/failed page
      return Response.redirect(
        `${frontendUrl}/pricing?status=cancelled`,
        302
      );
    }
  } catch (error) {
    console.error('Callback error:', error);
    const frontendUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 
                        'https://lovable.app';
    return Response.redirect(
      `${frontendUrl}/pricing?status=error`,
      302
    );
  }
});
