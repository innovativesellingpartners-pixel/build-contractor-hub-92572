import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UsePlaidLinkProps {
  onSuccess: (publicToken: string, metadata: any) => void;
}

export function usePlaidLink({ onSuccess }: UsePlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Load Plaid Link script
    const script = document.createElement('script');
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.async = true;
    script.onload = () => {
      console.log('Plaid Link script loaded');
      setReady(true);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const open = async () => {
    try {
      // Get link token from backend
      const { data, error } = await supabase.functions.invoke('plaid-create-link-token');
      
      if (error) throw error;

      if (!data?.link_token) {
        throw new Error('No link token returned');
      }

      // @ts-ignore - Plaid is loaded via script tag
      const handler = window.Plaid.create({
        token: data.link_token,
        onSuccess: (public_token: string, metadata: any) => {
          console.log('Plaid Link success:', metadata);
          onSuccess(public_token, metadata);
        },
        onExit: (err: any, metadata: any) => {
          if (err) {
            console.error('Plaid Link exit with error:', err);
            toast.error('Failed to connect bank account');
          }
        },
        onEvent: (eventName: string, metadata: any) => {
          console.log('Plaid Link event:', eventName, metadata);
        },
      });

      handler.open();
    } catch (error: any) {
      console.error('Plaid Link error:', error);
      toast.error(error.message || 'Failed to open Plaid Link');
    }
  };

  return { open, ready };
}
