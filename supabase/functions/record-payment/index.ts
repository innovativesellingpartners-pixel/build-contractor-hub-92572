import { createClient } from "npm:@supabase/supabase-js@2.58.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.58.0/cors";

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
    if (typeof body.amount !== "number" || body.amount <= 0) {
      return new Response(JSON.stringify({ error: "amount must be a positive number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof body.fee_amount !== "number" || body.fee_amount < 0) {
      return new Response(JSON.stringify({ error: "fee_amount must be a non-negative number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof body.net_amount !== "number" || body.net_amount < 0) {
      return new Response(JSON.stringify({ error: "net_amount must be a non-negative number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validStatuses = ["pending", "succeeded", "failed"];
    const status = body.status || "pending";
    if (!validStatuses.includes(status)) {
      return new Response(JSON.stringify({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify tenant isolation if job_id is provided
    if (body.job_id) {
      const { data: job } = await supabase
        .from("jobs")
        .select("id, user_id")
        .eq("id", body.job_id)
        .single();

      if (!job) {
        return new Response(JSON.stringify({ error: "Job not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: membership } = await supabase
        .from("contractor_users")
        .select("contractor_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      const { data: jobOwnerMembership } = await supabase
        .from("contractor_users")
        .select("contractor_id")
        .eq("user_id", job.user_id)
        .limit(1)
        .single();

      if (!membership || !jobOwnerMembership || membership.contractor_id !== jobOwnerMembership.contractor_id) {
        return new Response(JSON.stringify({ error: "Not authorized for this job" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Create payment
    const { data: payment, error: insertError } = await supabase
      .from("payments")
      .insert({
        contractor_id: user.id,
        customer_id: body.customer_id || null,
        job_id: body.job_id || null,
        estimate_id: body.estimate_id || null,
        stripe_payment_intent_id: body.stripe_payment_intent_id || null,
        amount: body.amount,
        fee_amount: body.fee_amount,
        net_amount: body.net_amount,
        status,
        paid_at: body.paid_at || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Payment creation error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to record payment" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data: payment }), {
      status: 201,
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
