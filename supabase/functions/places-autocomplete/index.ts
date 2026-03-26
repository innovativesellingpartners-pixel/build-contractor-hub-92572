import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { buildCorsHeaders } from '../_shared/cors.ts';

// Simple in-memory cache with 5-minute TTL
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(query: string, lat: string | null, lng: string | null, radius: string | null): string {
  return `${query.toLowerCase()}_${lat || ''}_${lng || ''}_${radius || ''}`;
}

function getFromCache(key: string): any | null {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  // Limit cache size
  if (cache.size > 1000) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
}

// Calculate distance between two points in meters (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q');
    const sessionToken = url.searchParams.get('sessionToken');
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    const radius = url.searchParams.get('radius') || '48280'; // Default 30 miles in meters
    const types = url.searchParams.get('types') || 'address'; // address, establishment, geocode
    const expandSearch = url.searchParams.get('expand') === 'true';

    // Start searching at 2 characters
    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ predictions: [], expanded: false }),
        { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Places API not configured' }),
        { status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Check cache first
    const cacheKey = getCacheKey(query, lat, lng, radius);
    const cachedResult = getFromCache(cacheKey);
    if (cachedResult) {
      console.log(`Cache hit for query: ${query}, latency: ${Date.now() - startTime}ms`);
      return new Response(
        JSON.stringify(cachedResult),
        { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Build Google Places Autocomplete URL
    const googleUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    googleUrl.searchParams.set('input', query);
    googleUrl.searchParams.set('key', apiKey);
    googleUrl.searchParams.set('types', types);
    googleUrl.searchParams.set('components', 'country:us');
    
    // Add strict location biasing if coordinates are provided
    if (lat && lng) {
      googleUrl.searchParams.set('location', `${lat},${lng}`);
      // Use strictbounds with radius for tighter results
      googleUrl.searchParams.set('radius', radius);
      // Don't use strictbounds initially - let Google return some results
      if (!expandSearch) {
        googleUrl.searchParams.set('strictbounds', 'false');
      }
    }
    
    if (sessionToken) {
      googleUrl.searchParams.set('sessiontoken', sessionToken);
    }

    console.log(`Fetching predictions for: "${query}" near ${lat},${lng} radius ${radius}m`);
    const response = await fetch(googleUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      return new Response(
        JSON.stringify({ predictions: [], error: data.error_message, expanded: false }),
        { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    let predictions = (data.predictions || []).map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text || '',
      secondaryText: p.structured_formatting?.secondary_text || '',
      distanceMeters: p.distance_meters || null,
    }));

    let expanded = false;

    // If no results and not already expanded, try with larger radius
    if (predictions.length === 0 && lat && lng && !expandSearch) {
      console.log('No nearby results, expanding search to 100km');
      const expandedUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
      expandedUrl.searchParams.set('input', query);
      expandedUrl.searchParams.set('key', apiKey);
      expandedUrl.searchParams.set('types', types);
      expandedUrl.searchParams.set('components', 'country:us');
      expandedUrl.searchParams.set('location', `${lat},${lng}`);
      expandedUrl.searchParams.set('radius', '100000'); // 100km
      if (sessionToken) {
        expandedUrl.searchParams.set('sessiontoken', sessionToken);
      }

      const expandedResponse = await fetch(expandedUrl.toString());
      const expandedData = await expandedResponse.json();

      if (expandedData.status === 'OK' && expandedData.predictions?.length > 0) {
        predictions = expandedData.predictions.map((p: any) => ({
          placeId: p.place_id,
          description: p.description,
          mainText: p.structured_formatting?.main_text || '',
          secondaryText: p.structured_formatting?.secondary_text || '',
          distanceMeters: p.distance_meters || null,
        }));
        expanded = true;
      }
    }

    // Limit to top 10 results
    predictions = predictions.slice(0, 10);

    const result = { 
      predictions, 
      expanded,
      searchLocation: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
    };

    // Cache the result
    setCache(cacheKey, result);

    const latency = Date.now() - startTime;
    console.log(`Places autocomplete completed: ${predictions.length} results, latency: ${latency}ms, expanded: ${expanded}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Places autocomplete error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch predictions', predictions: [] }),
      { status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
