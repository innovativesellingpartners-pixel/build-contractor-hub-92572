import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const placeId = url.searchParams.get('placeId');
    const sessionToken = url.searchParams.get('sessionToken');

    if (!placeId) {
      return new Response(
        JSON.stringify({ error: 'placeId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Use Google Places Details API
    const googleUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    googleUrl.searchParams.set('place_id', placeId);
    googleUrl.searchParams.set('key', apiKey);
    googleUrl.searchParams.set('fields', 'address_components,formatted_address,geometry,name,place_id');
    if (sessionToken) {
      googleUrl.searchParams.set('sessiontoken', sessionToken);
    }

    const response = await fetch(googleUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Places Details error:', data.status, data.error_message);
      return new Response(
        JSON.stringify({ error: data.error_message || 'Failed to fetch place details' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = data.result;
    const components = result.address_components || [];

    // Parse address components
    const getComponent = (types: string[]): string => {
      const comp = components.find((c: any) => types.some(t => c.types.includes(t)));
      return comp?.long_name || '';
    };

    const getShortComponent = (types: string[]): string => {
      const comp = components.find((c: any) => types.some(t => c.types.includes(t)));
      return comp?.short_name || '';
    };

    const streetNumber = getComponent(['street_number']);
    const route = getComponent(['route']);
    const subpremise = getComponent(['subpremise']);
    
    const address1 = [streetNumber, route].filter(Boolean).join(' ');
    const address2 = subpremise || '';
    const city = getComponent(['locality', 'sublocality', 'sublocality_level_1', 'administrative_area_level_3']);
    const state = getShortComponent(['administrative_area_level_1']);
    const postalCode = getComponent(['postal_code']);
    const country = getShortComponent(['country']);

    const lat = result.geometry?.location?.lat;
    const lng = result.geometry?.location?.lng;

    const latency = Date.now() - startTime;
    console.log(`Places details fetched for ${placeId}, latency: ${latency}ms`);

    return new Response(
      JSON.stringify({
        address1,
        address2,
        city,
        state,
        postalCode,
        country: country || 'US',
        lat,
        lng,
        formattedAddress: result.formatted_address || '',
        placeId: result.place_id,
        source: 'geo_autocomplete',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Places details error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch place details' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
