import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

import { buildCorsHeaders } from '../_shared/cors.ts';

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
    if (decoded.startsWith('\\x')) return decodeToken(decoded);
    return decoded;
  }
  return String(token);
}

async function refreshTokenWithRetry(
  connection: any, 
  supabase: any, 
  maxRetries = 3
): Promise<{ token: string | null; needsReauth: boolean }> {
  const provider = connection.provider || 'google';
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const refreshToken = decodeToken(connection.refresh_token_encrypted);
      
      if (!refreshToken || refreshToken === 'pending' || refreshToken.length < 10) {
        return { token: null, needsReauth: true };
      }

      let tokenUrl: string;
      let body: URLSearchParams;

      if (provider === 'outlook') {
        tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
        body = new URLSearchParams({
          client_id: Deno.env.get('OUTLOOK_CLIENT_ID')!,
          client_secret: Deno.env.get('OUTLOOK_CLIENT_SECRET')!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
          scope: 'User.Read Mail.Read Mail.Send offline_access',
        });
      } else {
        tokenUrl = 'https://oauth2.googleapis.com/token';
        body = new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        });
      }

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      const tokens = await response.json();

      if (tokens.error) {
        if (['invalid_grant', 'invalid_client', 'unauthorized_client', 'interaction_required'].includes(tokens.error)) {
          return { token: null, needsReauth: true };
        }
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500));
          continue;
        }
        return { token: null, needsReauth: false };
      }

      const updatePayload: Record<string, any> = {
        access_token_encrypted: tokens.access_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (tokens.refresh_token) {
        updatePayload.refresh_token_encrypted = tokens.refresh_token;
      }

      await supabase.from('email_connections').update(updatePayload).eq('id', connection.id);
      return { token: tokens.access_token, needsReauth: false };
    } catch (error) {
      console.error(`Token refresh attempt ${attempt} failed:`, error);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500));
        continue;
      }
      return { token: null, needsReauth: false };
    }
  }
  return { token: null, needsReauth: false };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await createClient(
      SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!
    ).auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const { emailId, provider } = await req.json();
    if (!emailId) {
      return new Response(JSON.stringify({ error: 'Email ID is required' }), {
        status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const { data: connections } = await supabase
      .from('email_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', provider || 'google');

    if (!connections || connections.length === 0) {
      return new Response(JSON.stringify({ error: 'No email connection found' }), {
        status: 404, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const connection = connections[0];
    const { token: accessToken, needsReauth } = await refreshTokenWithRetry(connection, supabase);
    
    if (needsReauth) {
      return new Response(JSON.stringify({ error: 'Connection expired', needs_reauth: true, connection_id: connection.id }), {
        status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }
    
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Failed to get access token' }), {
        status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    if (provider === 'outlook') {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${emailId}?$select=body`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!response.ok) {
        return new Response(JSON.stringify({ error: 'Failed to fetch email' }), {
          status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
        });
      }
      const data = await response.json();
      return new Response(JSON.stringify({ body: data.body?.content || '' }), {
        status: 200, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    // Google
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}?format=full`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch email' }), {
        status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const emailData = await response.json();
    const body = extractEmailBody(emailData);

    return new Response(JSON.stringify({ body }), {
      status: 200, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in fetch-email-body:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Server error' }), {
      status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});

function extractEmailBody(emailData: any): string {
  const payload = emailData.payload;
  let body = '';
  if (payload.body?.data) {
    body = decodeBase64Url(payload.body.data);
  } else if (payload.parts) {
    const htmlPart = findPart(payload.parts, 'text/html');
    const textPart = findPart(payload.parts, 'text/plain');
    if (htmlPart?.body?.data) {
      body = decodeBase64Url(htmlPart.body.data);
    } else if (textPart?.body?.data) {
      body = decodeBase64Url(textPart.body.data).replace(/\n/g, '<br>');
    }
  }
  return body || emailData.snippet || '';
}

function findPart(parts: any[], mimeType: string): any {
  for (const part of parts) {
    if (part.mimeType === mimeType) return part;
    if (part.parts) {
      const found = findPart(part.parts, mimeType);
      if (found) return found;
    }
  }
  return null;
}

function decodeBase64Url(data: string): string {
  try {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return decodeURIComponent(escape(decoded));
  } catch {
    return data;
  }
}
