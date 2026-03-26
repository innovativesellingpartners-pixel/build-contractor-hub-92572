import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import { buildCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the requesting user is authenticated
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { 
          status: 200, // Return 200 to ensure response body is accessible
          headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify the user has admin or super_admin role
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError || !userRole || !['admin', 'super_admin'].includes(userRole.role)) {
      console.error('Authorization error:', roleError);
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden - Admin access required' }),
        { 
          status: 200, // Return 200 to ensure response body is accessible
          headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
        }
      );
    }

    const { userId, newRole } = await req.json();

    // Validate input
    if (!userId || !newRole) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: userId and newRole' }),
        { 
          status: 200, // Return 200 to ensure response body is accessible
          headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate role value
    const validRoles = ['user', 'admin', 'super_admin'];
    if (!validRoles.includes(newRole)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid role. Must be one of: user, admin, super_admin' }),
        { 
          status: 200, // Return 200 to ensure response body is accessible
          headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if role assignment exists
    const { data: existingRole } = await supabaseClient
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    let result;
    if (existingRole) {
      // Update existing role (trigger will automatically log this)
      const { data, error } = await supabaseClient
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log('Role updated:', { userId, newRole, adminId: user.id });
    } else {
      // Insert new role (trigger will automatically log this)
      const { data, error } = await supabaseClient
        .from('user_roles')
        .insert({ user_id: userId, role: newRole })
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log('Role assigned:', { userId, newRole, adminId: user.id });
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        status: 200,
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error updating user role:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 200, // Return 200 to ensure response body is accessible
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    );
  }
});