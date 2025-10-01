import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || !['admin', 'super_admin'].includes(roleData.role)) {
      throw new Error("Insufficient permissions");
    }

    // Get all users from auth.users
    const { data: { users }, error: usersError } = await supabaseClient.auth.admin.listUsers();
    
    if (usersError) {
      throw usersError;
    }

    // Get profiles
    const { data: profiles } = await supabaseClient
      .from("profiles")
      .select("*");

    // Get roles
    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("*");

    // Combine the data
    const usersWithData = users.map(authUser => {
      const profile = profiles?.find(p => p.user_id === authUser.id);
      const role = roles?.find(r => r.user_id === authUser.id);
      
      return {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        email_confirmed_at: authUser.email_confirmed_at,
        profile: profile || null,
        role: role?.role || 'user'
      };
    });

    return new Response(
      JSON.stringify({ users: usersWithData }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error listing users:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: error instanceof Error && error.message === "Insufficient permissions" ? 403 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
