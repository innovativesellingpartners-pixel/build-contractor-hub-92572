import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { buildCorsHeaders } from '../_shared/cors.ts';

const ELEVENLABS_AGENT_ID = "agent_9901kcrxhb4yfr7r2gzq3rfs6add";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${ELEVENLABS_AGENT_ID}`,
      {
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs token error:", response.status, errorText);
      throw new Error(`Failed to get token: ${response.status}`);
    }

    const { token } = await response.json();

    return new Response(JSON.stringify({ token }), {
      headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Token generation error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate token" }),
      {
        status: 500,
        headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
