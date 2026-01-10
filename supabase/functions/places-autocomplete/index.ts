import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q');
    const sessionToken = url.searchParams.get('sessionToken');

    if (!query || query.length < 3) {
      return new Response(
        JSON.stringify({ predictions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Places API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get optional location parameters for biasing
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');

    // Use Google Places Autocomplete API (New)
    const googleUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    googleUrl.searchParams.set('input', query);
    googleUrl.searchParams.set('key', apiKey);
    googleUrl.searchParams.set('types', 'address');
    googleUrl.searchParams.set('components', 'country:us');
    
    // Add location biasing if coordinates are provided
    if (lat && lng) {
      // Set location bias to prioritize nearby results (50km radius)
      googleUrl.searchParams.set('location', `${lat},${lng}`);
      googleUrl.searchParams.set('radius', '80467'); // 50 miles in meters
    }
    
    if (sessionToken) {
      googleUrl.searchParams.set('sessiontoken', sessionToken);
    }

    const response = await fetch(googleUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      return new Response(
        JSON.stringify({ predictions: [], error: data.error_message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return predictions without exposing API key
    const predictions = (data.predictions || []).map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text || '',
      secondaryText: p.structured_formatting?.secondary_text || '',
    }));

    return new Response(
      JSON.stringify({ predictions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Places autocomplete error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch predictions' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
