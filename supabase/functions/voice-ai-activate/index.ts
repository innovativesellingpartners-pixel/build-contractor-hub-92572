import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Activates Voice AI for a contractor:
 * 1. Sets ai_enabled = true on contractor_ai_profiles
 * 2. Sets voice_ai_enabled = true on contractors table
 * 3. Triggers Forge prompt sync
 * 4. Notifies Forge/CT1 API for full deployment
 *
 * Called by:
 * - Admin enabling Voice AI for free
 * - Post-payment webhook/redirect after Stripe checkout
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { contractor_id, activated_by, billing_cycle } = await req.json();

    if (!contractor_id) {
      return new Response(JSON.stringify({ error: "contractor_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine caller authorization
    const authHeader = req.headers.get("Authorization");
    let isAuthorized = false;

    // Check if called with internal API key (from webhook)
    const internalKey = Deno.env.get("CT1_INTERNAL_API_KEY");
    if (authHeader === `Bearer ${internalKey}`) {
      isAuthorized = true;
    }

    // Check if called by authenticated admin or the contractor themselves
    if (!isAuthorized && authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await supabaseUser.auth.getUser();
      if (user) {
        // Check if user is admin or the contractor
        if (user.id === contractor_id) {
          isAuthorized = true;
        } else {
          // Check admin role
          const { data: role } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .in("role", ["admin", "super_admin"])
            .maybeSingle();
          if (role) isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Activating Voice AI for contractor ${contractor_id}, by: ${activated_by || "system"}`);

    // 1. Enable on contractors table
    await supabaseAdmin
      .from("contractors")
      .update({ voice_ai_enabled: true })
      .eq("id", contractor_id);

    // 2. Enable on contractor_ai_profiles
    const { data: aiProfile } = await supabaseAdmin
      .from("contractor_ai_profiles")
      .select("id, business_name, trade")
      .eq("contractor_id", contractor_id)
      .maybeSingle();

    if (aiProfile) {
      await supabaseAdmin
        .from("contractor_ai_profiles")
        .update({ ai_enabled: true })
        .eq("contractor_id", contractor_id);
    } else {
      // Get contractor info to create a basic profile
      const { data: contractor } = await supabaseAdmin
        .from("contractors")
        .select("business_name")
        .eq("id", contractor_id)
        .single();

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, trade")
        .eq("id", contractor_id)
        .single();

      await supabaseAdmin
        .from("contractor_ai_profiles")
        .insert({
          contractor_id,
          business_name: contractor?.business_name || "My Business",
          contractor_name: profile?.full_name || "",
          trade: profile?.trade || "General",
          ai_enabled: true,
        });
    }

    // 3. Trigger Forge prompt sync
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      await fetch(`${supabaseUrl}/functions/v1/forge-prompt-sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ contractor_id }),
      });
    } catch (syncErr) {
      console.error("Forge prompt sync failed (non-fatal):", syncErr);
    }

    // 4. Notify CT1/Forge API for full deployment (Twilio number, Vapi assistant, etc.)
    try {
      const ct1ApiBase = Deno.env.get("CT1_API_BASE_URL");
      const ct1ApiKey = Deno.env.get("CT1_INTERNAL_API_KEY");

      if (ct1ApiBase && ct1ApiKey) {
        const deployResponse = await fetch(`${ct1ApiBase}/api/forge/deploy`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ct1ApiKey,
          },
          body: JSON.stringify({
            contractor_id,
            billing_cycle: billing_cycle || "monthly",
            activated_by: activated_by || "system",
          }),
        });

        const deployResult = await deployResponse.json();
        console.log("Forge deploy result:", deployResult);

        if (!deployResponse.ok) {
          console.error("Forge deploy failed:", deployResult);
        }
      } else {
        console.warn("CT1_API_BASE_URL or CT1_INTERNAL_API_KEY not set, skipping Forge deploy");
      }
    } catch (deployErr) {
      console.error("Forge deploy call failed (non-fatal):", deployErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        contractor_id,
        voice_ai_enabled: true,
        message: "Voice AI activated. Forge deployment initiated.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in voice-ai-activate:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
