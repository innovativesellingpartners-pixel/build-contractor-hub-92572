import { createClient } from "npm:@supabase/supabase-js@2.58.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.58.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate JWT
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

    // Get user from token
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
    if (!body.job_id || typeof body.job_id !== "string") {
      return new Response(JSON.stringify({ error: "job_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!body.issue_date || typeof body.issue_date !== "string") {
      return new Response(JSON.stringify({ error: "issue_date is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof body.amount_due !== "number" || body.amount_due <= 0) {
      return new Response(JSON.stringify({ error: "amount_due must be a positive number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validStatuses = ["draft", "sent", "partial", "paid", "overdue"];
    const status = body.status || "draft";
    if (!validStatuses.includes(status)) {
      return new Response(JSON.stringify({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user owns the job (tenant isolation)
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, user_id")
      .eq("id", body.job_id)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check contractor membership
    const { data: isMember } = await supabase.rpc("is_contractor_member", {
      _record_user_id: job.user_id,
    });

    // For service role we check directly
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
      return new Response(JSON.stringify({ error: "Not authorized to create invoices for this job" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create invoice
    const { data: invoice, error: insertError } = await supabase
      .from("invoices")
      .insert({
        job_id: body.job_id,
        customer_id: body.customer_id || null,
        user_id: user.id,
        issue_date: body.issue_date,
        due_date: body.due_date || null,
        amount_due: body.amount_due,
        amount_paid: body.amount_paid || 0,
        line_items: body.line_items || null,
        status,
        notes: body.notes || null,
        public_token: crypto.randomUUID(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Invoice creation error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create invoice" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data: invoice }), {
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
