import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
      
      // Check for invalid refresh tokens
      if (!refreshToken || refreshToken === 'pending' || refreshToken.length < 10) {
        console.error(`Invalid refresh token for connection ${connection.id} (${provider})`);
        return { token: null, needsReauth: true };
      }

      let tokenUrl: string;
      let body: URLSearchParams;

      if (provider === 'outlook') {
        const OUTLOOK_CLIENT_ID = Deno.env.get('OUTLOOK_CLIENT_ID');
        const OUTLOOK_CLIENT_SECRET = Deno.env.get('OUTLOOK_CLIENT_SECRET');
        tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
        body = new URLSearchParams({
          client_id: OUTLOOK_CLIENT_ID!,
          client_secret: OUTLOOK_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
          scope: 'User.Read Mail.Read Mail.Send offline_access',
        });
      } else {
        const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
        const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
        tokenUrl = 'https://oauth2.googleapis.com/token';
        body = new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
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
        console.error(`Token refresh error (attempt ${attempt}/${maxRetries}):`, tokens.error, tokens.error_description);
        
        // These errors mean the refresh token is permanently invalid
        if (['invalid_grant', 'invalid_client', 'unauthorized_client', 'interaction_required'].includes(tokens.error)) {
          console.error(`Permanent token error for ${provider} connection ${connection.id} - needs reauth`);
          return { token: null, needsReauth: true };
        }
        
        // Transient error - retry after delay
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 500; // 1s, 2s, 4s
          console.log(`Retrying token refresh in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        
        return { token: null, needsReauth: false };
      }

      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      // Update stored tokens - also update refresh token if a new one was provided
      const updatePayload: Record<string, any> = {
        access_token_encrypted: tokens.access_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      };
      
      // Some providers (especially Outlook) return a new refresh token
      if (tokens.refresh_token) {
        updatePayload.refresh_token_encrypted = tokens.refresh_token;
      }

      await supabase
        .from('email_connections')
        .update(updatePayload)
        .eq('id', connection.id);

      return { token: tokens.access_token, needsReauth: false };
    } catch (error) {
      console.error(`Token refresh attempt ${attempt} failed:`, error);
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 500;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      return { token: null, needsReauth: false };
    }
  }
  
  return { token: null, needsReauth: false };
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

    console.log('Fetching emails for user:', user.id);

    const { data: connections, error: connError } = await supabase
      .from('email_connections')
      .select('*')
      .eq('user_id', user.id);

    if (connError) {
      console.error('Error fetching connections:', connError);
      return new Response(JSON.stringify({ error: 'Failed to fetch connections' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!connections || connections.length === 0) {
      return new Response(JSON.stringify({ emails: [], message: 'No email accounts connected' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const allEmails: any[] = [];
    const reauthNeeded: string[] = [];

    for (const connection of connections) {
      console.log('Processing email connection:', connection.id, 'provider:', connection.provider, 'email:', connection.email_address);
      
      const { token: accessToken, needsReauth } = await refreshTokenWithRetry(connection, supabase);
      
      if (needsReauth) {
        console.warn(`Connection ${connection.id} (${connection.provider}) needs re-authentication`);
        reauthNeeded.push(connection.id);
        continue;
      }
      
      if (!accessToken) {
        console.error(`Failed to refresh token for connection ${connection.id} after retries`);
        continue;
      }

      if (connection.provider === 'google') {
        const emails = await fetchGmailMessages(accessToken);
        console.log('Fetched', emails.length, 'Gmail emails');
        allEmails.push(...emails.map((e: any) => ({
          ...e,
          provider: 'google',
          email_account: connection.email_address
        })));
      } else if (connection.provider === 'outlook') {
        const emails = await fetchOutlookMessages(accessToken);
        console.log('Fetched', emails.length, 'Outlook emails');
        allEmails.push(...emails.map((e: any) => ({
          ...e,
          provider: 'outlook',
          email_account: connection.email_address
        })));
      }
    }

    console.log('Total emails fetched:', allEmails.length, 'Reauth needed:', reauthNeeded.length);
    return new Response(JSON.stringify({ 
      emails: allEmails,
      needs_reauth: reauthNeeded.length > 0 ? reauthNeeded : undefined,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in fetch-emails:', error);
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchGmailMessages(accessToken: string): Promise<any[]> {
  try {
    const listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=25&labelIds=INBOX`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error('Gmail API error:', listResponse.status, errorText);
      return [];
    }

    const listData = await listResponse.json();
    const messageIds = listData.messages || [];

    const emails: any[] = [];
    for (const msg of messageIds.slice(0, 25)) {
      const msgResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (msgResponse.ok) {
        const msgData = await msgResponse.json();
        const headers = msgData.payload?.headers || [];
        const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;
        
        emails.push({
          id: msgData.id,
          threadId: msgData.threadId,
          snippet: msgData.snippet,
          from: getHeader('From'),
          subject: getHeader('Subject'),
          date: getHeader('Date'),
          labelIds: msgData.labelIds,
          isUnread: msgData.labelIds?.includes('UNREAD'),
        });
      }
    }

    return emails;
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    return [];
  }
}

async function fetchOutlookMessages(accessToken: string): Promise<any[]> {
  try {
    const response = await fetch(
      'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=25&$select=id,conversationId,subject,bodyPreview,from,receivedDateTime,isRead&$orderby=receivedDateTime desc',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Outlook API error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    return (data.value || []).map((msg: any) => ({
      id: msg.id,
      threadId: msg.conversationId,
      snippet: msg.bodyPreview,
      from: msg.from?.emailAddress ? `${msg.from.emailAddress.name} <${msg.from.emailAddress.address}>` : 'Unknown',
      subject: msg.subject,
      date: msg.receivedDateTime,
      isUnread: !msg.isRead,
    }));
  } catch (error) {
    console.error('Error fetching Outlook messages:', error);
    return [];
  }
}
