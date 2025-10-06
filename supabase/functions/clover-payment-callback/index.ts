import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const paymentId = url.searchParams.get('payment_id');

    console.log('Payment callback received:', { status, paymentId });

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
