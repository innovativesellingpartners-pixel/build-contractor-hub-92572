import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Decode token from various formats (hex-encoded, Buffer, or plain string)
function decodeToken(token: any): string {
  if (!token) return '';
  
  if (typeof token === 'string') {
    if (token.startsWith('\\x')) {
      const hex = token.slice(2);
      let str = '';
      for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      }
      return str;
    }
    return token;
  }
  
  if (token?.data) {
    const decoded = new TextDecoder().decode(new Uint8Array(token.data));
    if (decoded.startsWith('\\x')) {
      return decodeToken(decoded);
    }
    return decoded;
  }
  
  return String(token);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Get user from auth token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_ANON_KEY')!
    ).auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { emailId, provider } = await req.json();
    
    if (!emailId) {
      return new Response(JSON.stringify({ error: 'Email ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching email body for:', emailId, 'provider:', provider);

    // Get email connection
    const { data: connections, error: connError } = await supabase
      .from('email_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', provider || 'google');

    if (connError || !connections || connections.length === 0) {
      return new Response(JSON.stringify({ error: 'No email connection found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const connection = connections[0];
    
    // Get fresh access token
    const accessToken = await refreshGoogleToken(connection, supabase);
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Failed to get access token' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the full email
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}?format=full`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!response.ok) {
      console.error('Gmail API error:', response.status, await response.text());
      return new Response(JSON.stringify({ error: 'Failed to fetch email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailData = await response.json();
    const body = extractEmailBody(emailData);

    return new Response(JSON.stringify({ body }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in fetch-email-body:', error);
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function refreshGoogleToken(connection: any, supabase: any): Promise<string | null> {
  try {
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');

    const refreshToken = decodeToken(connection.refresh_token_encrypted);

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const tokens = await response.json();
    
    if (tokens.error) {
      console.error('Token refresh error:', tokens);
      return null;
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await supabase
      .from('email_connections')
      .update({
        access_token_encrypted: tokens.access_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', connection.id);

    return tokens.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

function extractEmailBody(emailData: any): string {
  const payload = emailData.payload;
  
  // Try to find HTML body first, then plain text
  let body = '';
  
  if (payload.body?.data) {
    body = decodeBase64Url(payload.body.data);
  } else if (payload.parts) {
    // Multi-part email
    const htmlPart = findPart(payload.parts, 'text/html');
    const textPart = findPart(payload.parts, 'text/plain');
    
    if (htmlPart?.body?.data) {
      body = decodeBase64Url(htmlPart.body.data);
    } else if (textPart?.body?.data) {
      body = decodeBase64Url(textPart.body.data);
      // Convert plain text to HTML with line breaks
      body = body.replace(/\n/g, '<br>');
    }
  }
  
  return body || emailData.snippet || '';
}

function findPart(parts: any[], mimeType: string): any {
  for (const part of parts) {
    if (part.mimeType === mimeType) {
      return part;
    }
    if (part.parts) {
      const found = findPart(part.parts, mimeType);
      if (found) return found;
    }
  }
  return null;
}

function decodeBase64Url(data: string): string {
  try {
    // Convert base64url to base64
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    // Decode base64
    const decoded = atob(base64);
    // Handle UTF-8
    return decodeURIComponent(escape(decoded));
  } catch (e) {
    console.error('Error decoding base64:', e);
    return data;
  }
}
