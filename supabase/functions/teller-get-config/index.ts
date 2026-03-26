import { buildCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  const applicationId = Deno.env.get('TELLER_APPLICATION_ID');

  return new Response(JSON.stringify({ applicationId: applicationId || null }), {
    headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
  });
});
