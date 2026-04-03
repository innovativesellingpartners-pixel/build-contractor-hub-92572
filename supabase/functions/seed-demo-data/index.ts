import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!roleData || !["admin", "super_admin"].includes(roleData.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Step 1: Clean existing demo data (order matters for FK constraints) ---
    await supabase.from("payments").delete().eq("user_id", DEMO_USER_ID);
    await supabase.from("expenses").delete().eq("user_id", DEMO_USER_ID);
    await supabase.from("invoices").delete().eq("user_id", DEMO_USER_ID);
    await supabase.from("estimate_assumptions").delete().in(
      "estimate_id",
      (
        await supabase
          .from("estimates")
          .select("id")
          .eq("user_id", DEMO_USER_ID)
      ).data?.map((e: any) => e.id) || []
    );
    await supabase.from("estimates").delete().eq("user_id", DEMO_USER_ID);
    await supabase.from("jobs").delete().eq("user_id", DEMO_USER_ID);
    await supabase.from("customers").delete().eq("user_id", DEMO_USER_ID);
    await supabase.from("leads").delete().eq("user_id", DEMO_USER_ID);

    // Ensure demo profile exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", DEMO_USER_ID)
      .maybeSingle();

    if (!existingProfile) {
      await supabase.from("profiles").insert({
        id: DEMO_USER_ID,
        user_id: DEMO_USER_ID,
        company_name: "Apex Construction Group",
        contact_name: "Marcus Rivera",
        phone: "(555) 234-5678",
        business_address: "1200 Industrial Blvd",
        city: "Austin",
        state: "TX",
        zip_code: "78701",
        trade: "General Contractor",
        business_email: "demo@apexconstruction.demo",
        ct1_contractor_number: "CT1DEMO01",
        subscription_tier: "growth",
        default_sales_tax_rate: 8.25,
        default_deposit_percent: 25,
        default_warranty_years: 2,
      });
    }

    // --- Step 2: Seed Leads ---
    const leadStages = [
      "new",
      "contacted",
      "qualified",
      "proposal_sent",
      "won",
      "lost",
    ];
    const leadNames = [
      "Sarah Johnson",
      "Mike Chen",
      "Lisa Park",
      "James Wilson",
      "Emma Davis",
      "Robert Taylor",
      "Maria Garcia",
      "David Kim",
      "Jennifer Lee",
      "Thomas Brown",
      "Amanda White",
      "Chris Martinez",
      "Rachel Green",
      "Kevin Harris",
      "Nicole Adams",
      "Brian Clark",
      "Stephanie Young",
      "Andrew Moore",
      "Laura Hall",
      "Jason Allen",
    ];
    const leads = leadNames.map((name, i) => ({
      user_id: DEMO_USER_ID,
      name,
      email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
      phone: `(555) ${String(100 + i).padStart(3, "0")}-${String(
        1000 + i * 37
      ).slice(0, 4)}`,
      source: ["website", "referral", "google", "facebook", "yard_sign"][
        i % 5
      ],
      stage: leadStages[i % leadStages.length],
      notes: `Interested in ${
        [
          "kitchen remodel",
          "roof repair",
          "bathroom renovation",
          "deck build",
          "foundation work",
        ][i % 5]
      }`,
      priority: (["low", "medium", "high"] as const)[i % 3],
    }));

    const { data: insertedLeads } = await supabase
      .from("leads")
      .insert(leads)
      .select("id, name");

    // --- Step 3: Seed Customers ---
    const customerNames = leadNames.slice(0, 15);
    const customers = customerNames.map((name, i) => ({
      user_id: DEMO_USER_ID,
      name,
      email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
      phone: `(555) ${String(200 + i).padStart(3, "0")}-${String(
        2000 + i * 41
      ).slice(0, 4)}`,
      address: `${1000 + i * 100} ${
        ["Oak", "Maple", "Pine", "Cedar", "Elm"][i % 5]
      } Street`,
      city: ["Austin", "Dallas", "Houston", "San Antonio", "Fort Worth"][
        i % 5
      ],
      state: "TX",
      zip_code: `7${String(8000 + i * 10).slice(0, 4)}`,
      customer_type: i % 3 === 0 ? "commercial" : "residential",
      notes: `Repeat customer, ${i + 1} past projects`,
    }));

    const { data: insertedCustomers } = await supabase
      .from("customers")
      .insert(customers)
      .select("id, name");

    // --- Step 4: Seed Jobs ---
    const jobStatuses = [
      "pending",
      "in_progress",
      "in_progress",
      "completed",
      "completed",
      "on_hold",
      "cancelled",
      "in_progress",
    ];
    const jobNames = [
      "Kitchen Remodel - Johnson Residence",
      "Commercial Roof Replacement",
      "Master Bath Renovation",
      "Custom Deck Build",
      "Foundation Repair - Wilson Home",
      "Office Tenant Improvement",
      "Exterior Paint & Siding",
      "Garage Conversion ADU",
    ];
    const jobs = jobNames.map((name, i) => ({
      user_id: DEMO_USER_ID,
      project_name: name,
      job_status: jobStatuses[i],
      customer_id: insertedCustomers?.[i % (insertedCustomers?.length || 1)]?.id,
      contract_value: [45000, 85000, 32000, 28000, 15000, 120000, 18000, 95000][
        i
      ],
      start_date: new Date(
        Date.now() - (90 - i * 10) * 86400000
      ).toISOString(),
      end_date: new Date(
        Date.now() + (i * 15 + 30) * 86400000
      ).toISOString(),
      address: `${2000 + i * 200} Demo Street`,
      city: "Austin",
      state: "TX",
      zip_code: "78701",
      notes: `Demo job ${i + 1} — ${name}`,
    }));

    const { data: insertedJobs } = await supabase
      .from("jobs")
      .insert(jobs)
      .select("id, project_name, contract_value");

    // --- Step 5: Seed Estimates ---
    const estimateStatuses = [
      "draft",
      "draft",
      "sent",
      "sent",
      "viewed",
      "signed",
      "signed",
      "signed",
      "declined",
      "expired",
    ];
    const estimates = estimateStatuses.map((status, i) => ({
      user_id: DEMO_USER_ID,
      title: `Estimate for ${
        customerNames[i % customerNames.length]
      } - ${
        ["Remodel", "Repair", "Build", "Renovation", "Install"][i % 5]
      }`,
      status,
      customer_id:
        insertedCustomers?.[i % (insertedCustomers?.length || 1)]?.id,
      job_id:
        status === "signed"
          ? insertedJobs?.[i % (insertedJobs?.length || 1)]?.id
          : null,
      subtotal: [12000, 8500, 45000, 3200, 28000, 67000, 15000, 92000, 5400, 22000][i],
      tax_rate: 8.25,
      total: Math.round(
        [12000, 8500, 45000, 3200, 28000, 67000, 15000, 92000, 5400, 22000][i] * 1.0825
      ),
      notes: `Demo estimate #${i + 1}`,
      valid_until: new Date(Date.now() + 30 * 86400000).toISOString(),
    }));

    await supabase.from("estimates").insert(estimates);

    // --- Step 6: Seed Invoices ---
    const invoiceStatuses = [
      "paid",
      "paid",
      "paid",
      "paid",
      "sent",
      "sent",
      "overdue",
      "overdue",
      "draft",
      "draft",
      "partial",
      "void",
    ];
    const invoices = invoiceStatuses.map((status, i) => {
      const amount = [
        4500, 8500, 15000, 3200, 6700, 12000, 9800, 4300, 22000, 5500, 18000,
        2800,
      ][i];
      return {
        user_id: DEMO_USER_ID,
        customer_id:
          insertedCustomers?.[i % (insertedCustomers?.length || 1)]?.id,
        job_id: insertedJobs?.[i % (insertedJobs?.length || 1)]?.id,
        status,
        subtotal: amount,
        tax_rate: 8.25,
        tax_amount: Math.round(amount * 0.0825 * 100) / 100,
        total: Math.round(amount * 1.0825 * 100) / 100,
        amount_paid: status === "paid"
          ? Math.round(amount * 1.0825 * 100) / 100
          : status === "partial"
          ? Math.round((amount * 1.0825 * 0.5) * 100) / 100
          : 0,
        due_date: new Date(
          Date.now() + (status === "overdue" ? -15 : 30) * 86400000
        )
          .toISOString()
          .split("T")[0],
        issued_date: new Date(Date.now() - 10 * 86400000)
          .toISOString()
          .split("T")[0],
        notes: `Demo invoice ${i + 1}`,
      };
    });

    await supabase.from("invoices").insert(invoices);

    // Log the seed action
    await supabase.from("demo_access_log").insert({
      user_id: user.id,
      action: "seed_demo_data",
      details: {
        leads_count: leads.length,
        customers_count: customers.length,
        jobs_count: jobs.length,
        estimates_count: estimates.length,
        invoices_count: invoices.length,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        seeded: {
          leads: leads.length,
          customers: customers.length,
          jobs: jobs.length,
          estimates: estimates.length,
          invoices: invoices.length,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Seed error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
