import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

import { buildCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: buildCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Starting OAuth state cleanup...');
    
    // Call the database function to clean up expired states
    const { data, error } = await supabase.rpc('cleanup_expired_oauth_states');
    
    if (error) {
      console.error('Error cleaning up OAuth states:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { 
          status: 500,
          headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('OAuth state cleanup completed successfully');
    
    return new Response(
      JSON.stringify({ success: true, message: 'OAuth states cleaned up successfully' }),
      { 
        status: 200,
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    );
  }
});
