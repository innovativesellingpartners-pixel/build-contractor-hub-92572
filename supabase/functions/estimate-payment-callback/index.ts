import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

import { buildCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const sessionId = url.searchParams.get('session_id');

    console.log('Estimate payment callback received:', { status, sessionId, url: req.url });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use the Lovable published URL as fallback to avoid SSL issues with custom domains
    const frontendUrl = Deno.env.get('APP_URL') || 'https://build-contractor-hub-92572.lovable.app';

    if (status === 'success' && sessionId) {
      // Find the payment session
      const { data: session, error: sessionError } = await supabase
        .from('estimate_payment_sessions')
        .select('*')
        .eq('clover_session_id', sessionId)
        .single();

      if (sessionError || !session) {
        console.error('Session not found:', sessionError);
        return Response.redirect(`${frontendUrl}?payment=error`, 302);
      }

      // Get the current estimate
      const { data: estimate, error: estimateError } = await supabase
        .from('estimates')
        .select('*')
        .eq('id', session.estimate_id)
        .single();

      if (estimateError || !estimate) {
        console.error('Estimate not found:', estimateError);
        return Response.redirect(`${frontendUrl}?payment=error`, 302);
      }

      // Calculate new payment totals
      const previouslyPaid = estimate.payment_amount || 0;
      const paymentAmount = session.amount || 0;
      const newTotalPaid = previouslyPaid + paymentAmount;
      const totalAmount = estimate.grand_total || estimate.total_amount || 0;
      const newBalanceDue = Math.max(0, totalAmount - newTotalPaid);

      // Determine payment status
      let paymentStatus: string;
      if (newBalanceDue <= 0) {
        paymentStatus = 'paid';
      } else if (newTotalPaid > 0) {
        paymentStatus = 'partial';
      } else {
        paymentStatus = 'unpaid';
      }

      console.log('Updating estimate payment:', {
        estimate_id: session.estimate_id,
        previouslyPaid,
        paymentAmount,
        newTotalPaid,
        newBalanceDue,
        paymentStatus,
      });

      // Update estimate with payment info
      const { error: updateError } = await supabase
        .from('estimates')
        .update({
          status: 'accepted',
          signed_at: estimate.signed_at || new Date().toISOString(),
          payment_status: paymentStatus,
          payment_amount: newTotalPaid,
          balance_due: newBalanceDue,
          paid_at: paymentStatus === 'paid' ? new Date().toISOString() : estimate.paid_at,
          payment_method: 'clover',
        })
        .eq('id', session.estimate_id);

      if (updateError) {
        console.error('Error updating estimate:', updateError);
      }

      // Update the payment session status
      await supabase
        .from('estimate_payment_sessions')
        .update({
          status: 'succeeded',
          paid_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      // Redirect back to the estimate page with success
      if (estimate.public_token) {
        return Response.redirect(
          `${frontendUrl}/estimate/${estimate.public_token}?payment=success&amount=${paymentAmount}`,
          302
        );
      }

      // Fallback redirect
      return Response.redirect(`${frontendUrl}?payment=success`, 302);
    } else {
      // Payment cancelled or failed
      if (sessionId) {
        // Update the payment session status
        await supabase
          .from('estimate_payment_sessions')
          .update({ status: status === 'cancelled' ? 'cancelled' : 'failed' })
          .eq('clover_session_id', sessionId);

        // Get estimate token for redirect
        const { data: session } = await supabase
          .from('estimate_payment_sessions')
          .select('estimate_id')
          .eq('clover_session_id', sessionId)
          .single();

        if (session) {
          const { data: estimate } = await supabase
            .from('estimates')
            .select('public_token')
            .eq('id', session.estimate_id)
            .single();

          if (estimate?.public_token) {
            return Response.redirect(
              `${frontendUrl}/estimate/${estimate.public_token}?payment=cancelled`,
              302
            );
          }
        }
      }

      return Response.redirect(`${frontendUrl}?payment=cancelled`, 302);
    }
  } catch (error) {
    console.error('Callback error:', error);
    const frontendUrl = Deno.env.get('APP_URL') || 'https://build-contractor-hub-92572.lovable.app';
    return Response.redirect(`${frontendUrl}?payment=error`, 302);
  }
});
