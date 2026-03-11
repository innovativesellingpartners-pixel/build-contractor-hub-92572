const ALLOWED_ORIGINS = [
  'https://myct1.com',
  'https://www.myct1.com',
  'https://build-contractor-hub-92572.lovable.app',
];

export function getCorsOrigin(req: Request): string {
  const origin = req.headers.get('origin') || '';
  // Allow exact matches and Lovable preview domains
  if (
    ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith('.lovable.app') ||
    origin.endsWith('.lovableproject.com')
  ) {
    return origin;
  }
  // Fallback: return primary domain (browser will block if mismatch)
  return ALLOWED_ORIGINS[0];
}

export function buildCorsHeaders(req: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

// Legacy export for backward compatibility — edge functions that import { corsHeaders }
// will still work but should migrate to buildCorsHeaders(req) for origin restriction.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};
