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

    // Get request body
    const { email, password, company_name, phone, contact_name, role } = await req.json();

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    // Create user in auth
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { company_name }
    });

    if (createError) {
      throw createError;
    }

    // Create profile
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .insert({
        user_id: newUser.user.id,
        company_name: company_name || null,
        phone: phone || null,
        contact_name: contact_name || null,
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
    }

    // Assign role
    if (role && ['user', 'admin', 'super_admin'].includes(role)) {
      const { error: roleError } = await supabaseClient
        .from("user_roles")
        .insert({
          user_id: newUser.user.id,
          role: role
        });

      if (roleError) {
        console.error("Role assignment error:", roleError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: newUser.user.id,
          email: newUser.user.email
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: error instanceof Error && error.message === "Insufficient permissions" ? 403 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
