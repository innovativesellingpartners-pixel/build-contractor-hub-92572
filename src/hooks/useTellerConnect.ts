import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseTellerConnectProps {
  onSuccess?: () => void;
}

export function useTellerConnect({ onSuccess }: UseTellerConnectProps = {}) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (document.querySelector('script[src*="teller.io/connect"]')) {
      setReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.teller.io/connect/connect.js';
    script.async = true;
    script.onload = () => setReady(true);
    script.onerror = () => {
      console.error('Failed to load Teller Connect script');
      toast.error('Failed to load bank connection module');
    };
    document.body.appendChild(script);
  }, []);

  const open = useCallback(async () => {
    if (!ready) {
      toast.error('Bank connection is still loading, please try again');
      return;
    }

    setLoading(true);

    try {
      // Fetch the application ID from the backend
      const { data: configData, error: configError } = await supabase.functions.invoke('teller-get-config');
      
      const applicationId = configData?.applicationId || import.meta.env.VITE_TELLER_APPLICATION_ID;

      if (!applicationId) {
        toast.error('Teller is not configured. Please contact support.');
        setLoading(false);
        return;
      }

      // @ts-ignore - TellerConnect loaded via script tag
      const tellerConnect = window.TellerConnect.setup({
        applicationId,
        products: ['transactions', 'balance'],
        environment: 'development',
        onInit: () => {
          console.log('Teller Connect initialized');
          setLoading(false);
        },
        onSuccess: async (enrollment: any) => {
          console.log('Teller enrollment success:', enrollment);
          setLoading(true);
          try {
            const { error } = await supabase.functions.invoke('teller-save-enrollment', {
              body: {
                accessToken: enrollment.accessToken,
                enrollment: enrollment.enrollment,
                user: enrollment.user,
              },
            });

            if (error) throw error;

            toast.success('Bank account connected successfully!');
            onSuccess?.();
          } catch (err: any) {
            console.error('Failed to save enrollment:', err);
            toast.error(err.message || 'Failed to save bank connection');
          } finally {
            setLoading(false);
          }
        },
        onExit: () => {
          console.log('Teller Connect closed');
          setLoading(false);
        },
      });

      tellerConnect.open();
    } catch (error: any) {
      console.error('Teller Connect error:', error);
      toast.error(error.message || 'Failed to open bank connection');
      setLoading(false);
    }
  }, [ready, onSuccess]);

  return { open, ready, loading };
}
