import { createClient } from "npm:@supabase/supabase-js@2.58.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.58.0/cors";

// Valid status transitions for estimates
const validTransitions: Record<string, string[]> = {
  draft: ["sent", "rejected"],
  sent: ["viewed", "signed", "rejected", "draft"],
  viewed: ["signed", "rejected", "sent"],
  signed: ["approved", "rejected"],
  approved: ["completed"],
  rejected: ["draft", "sent"],
  completed: [],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    // Input validation
    if (!body.estimate_id || typeof body.estimate_id !== "string") {
      return new Response(JSON.stringify({ error: "estimate_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!body.new_status || typeof body.new_status !== "string") {
      return new Response(JSON.stringify({ error: "new_status is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get current estimate
    const { data: estimate, error: fetchError } = await supabase
      .from("estimates")
      .select("id, status, user_id")
      .eq("id", body.estimate_id)
      .single();

    if (fetchError || !estimate) {
      return new Response(JSON.stringify({ error: "Estimate not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify tenant isolation
    const { data: membership } = await supabase
      .from("contractor_users")
      .select("contractor_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    const { data: ownerMembership } = await supabase
      .from("contractor_users")
      .select("contractor_id")
      .eq("user_id", estimate.user_id)
      .limit(1)
      .single();

    if (!membership || !ownerMembership || membership.contractor_id !== ownerMembership.contractor_id) {
      return new Response(JSON.stringify({ error: "Not authorized for this estimate" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate status transition
    const currentStatus = estimate.status || "draft";
    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(body.new_status)) {
      return new Response(
        JSON.stringify({
          error: `Invalid status transition from '${currentStatus}' to '${body.new_status}'. Allowed: ${allowed.join(", ") || "none"}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update status
    const { data: updated, error: updateError } = await supabase
      .from("estimates")
      .update({ status: body.new_status })
      .eq("id", body.estimate_id)
      .select()
      .single();

    if (updateError) {
      console.error("Estimate status update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update estimate status" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data: updated }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
