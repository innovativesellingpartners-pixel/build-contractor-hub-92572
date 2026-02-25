import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FinixPaymentParams {
  entityType: 'estimate' | 'invoice';
  entityId: string;
  publicToken: string;
  paymentIntent: 'deposit' | 'full' | 'remaining';
  customerEmail: string;
  finixToken: string;
}

export function useFinixPayment() {
  const [processing, setProcessing] = useState(false);

  const processPayment = useCallback(async (params: FinixPaymentParams) => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('finix-create-payment', {
        body: {
          entity_type: params.entityType,
          entity_id: params.entityId,
          public_token: params.publicToken,
          payment_intent: params.paymentIntent,
          customer_email: params.customerEmail,
          finix_token: params.finixToken,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Payment of $${data.amount?.toFixed(2)} processed successfully!`);
        return data;
      } else {
        throw new Error(data?.message || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Finix payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
      return null;
    } finally {
      setProcessing(false);
    }
  }, []);

  return { processPayment, processing };
}
