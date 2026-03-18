import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch the report
    const { data: report, error: reportError } = await supabase
      .from('photo_reports')
      .select('*, jobs(title, site_address, user_id)')
      .eq('public_token', token)
      .single();

    if (reportError || !report) {
      return new Response(
        JSON.stringify({ error: 'Photo report not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch contractor profile for branding
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name, logo_url, phone, business_email, contact_name')
      .eq('id', report.user_id)
      .single();

    // Fetch photos by IDs
    const photoIds = report.photo_ids || [];
    let photos: any[] = [];

    if (photoIds.length > 0) {
      const { data: photoData } = await supabase
        .from('job_photos')
        .select('id, photo_url, caption, created_at')
        .in('id', photoIds);

      if (photoData) {
        // Generate signed URLs for each photo (valid for 24 hours)
        photos = await Promise.all(
          photoData.map(async (photo: any) => {
            const filePath = photo.photo_url.includes('/job-photos/')
              ? photo.photo_url.split('/job-photos/')[1]
              : photo.photo_url;

            const { data: signedData } = await supabase.storage
              .from('job-photos')
              .createSignedUrl(filePath, 86400); // 24 hours

            return {
              id: photo.id,
              caption: photo.caption,
              created_at: photo.created_at,
              signed_url: signedData?.signedUrl || null,
              file_path: filePath,
            };
          })
        );
      }
    }

    return new Response(
      JSON.stringify({
        report: {
          id: report.id,
          job_name: report.jobs?.title || 'Job',
          site_address: report.jobs?.site_address || '',
          notes: report.notes,
          created_at: report.created_at,
        },
        contractor: {
          company_name: profile?.company_name || 'Contractor',
          logo_url: profile?.logo_url || null,
          phone: profile?.phone || '',
          email: profile?.business_email || '',
          contact_name: profile?.contact_name || '',
        },
        photos,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('get-public-photo-gallery error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
