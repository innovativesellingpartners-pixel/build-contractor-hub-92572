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
    await supabase.from("daily_logs").delete().eq("user_id", DEMO_USER_ID);
    await supabase.from("invoices").delete().eq("user_id", DEMO_USER_ID);
    
    // Clean estimate-related tables
    const existingEstimateIds = (
      await supabase.from("estimates").select("id").eq("user_id", DEMO_USER_ID)
    ).data?.map((e: any) => e.id) || [];
    
    if (existingEstimateIds.length > 0) {
      await supabase.from("estimate_assumptions").delete().in("estimate_id", existingEstimateIds);
      await supabase.from("estimate_exclusions").delete().in("estimate_id", existingEstimateIds);
    }
    await supabase.from("estimates").delete().eq("user_id", DEMO_USER_ID);
    
    // Clean crew data
    const existingCrewIds = (
      await supabase.from("crews").select("id").eq("user_id", DEMO_USER_ID)
    ).data?.map((c: any) => c.id) || [];
    
    if (existingCrewIds.length > 0) {
      await supabase.from("crew_memberships").delete().in("crew_id", existingCrewIds);
    }
    await supabase.from("crew_members").delete().eq("user_id", DEMO_USER_ID);
    await supabase.from("crews").delete().eq("user_id", DEMO_USER_ID);
    
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

    // --- Step 2: Seed Leads (20 leads across all stages) ---
    const leadStages = ["new", "contacted", "qualified", "proposal_sent", "won", "lost"];
    const leadNames = [
      "Sarah Johnson", "Mike Chen", "Lisa Park", "James Wilson", "Emma Davis",
      "Robert Taylor", "Maria Garcia", "David Kim", "Jennifer Lee", "Thomas Brown",
      "Amanda White", "Chris Martinez", "Rachel Green", "Kevin Harris", "Nicole Adams",
      "Brian Clark", "Stephanie Young", "Andrew Moore", "Laura Hall", "Jason Allen",
    ];
    const projectTypes = ["kitchen remodel", "roof repair", "bathroom renovation", "deck build", "foundation work"];
    const sources = ["website", "referral", "google", "facebook", "yard_sign"];
    
    const leads = leadNames.map((name, i) => ({
      user_id: DEMO_USER_ID,
      name,
      email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
      phone: `(555) ${String(100 + i).padStart(3, "0")}-${String(1000 + i * 37).slice(0, 4)}`,
      source: sources[i % 5],
      stage: leadStages[i % leadStages.length],
      notes: `Interested in ${projectTypes[i % 5]}. ${["Budget discussed.", "Needs follow-up call.", "Ready to schedule site visit.", "Referred by existing customer.", "Found us online."][i % 5]}`,
      priority: (["low", "medium", "high"] as const)[i % 3],
      address: `${1000 + i * 50} ${["Oak", "Maple", "Pine", "Cedar", "Elm"][i % 5]} Ave`,
      city: ["Austin", "Round Rock", "Cedar Park", "Georgetown", "Pflugerville"][i % 5],
      state: "TX",
      zip_code: `7${String(8700 + i * 3).slice(0, 4)}`,
    }));

    const { data: insertedLeads } = await supabase
      .from("leads")
      .insert(leads)
      .select("id, name");

    // --- Step 3: Seed Customers (15 customers) ---
    const customerNames = leadNames.slice(0, 15);
    const customers = customerNames.map((name, i) => ({
      user_id: DEMO_USER_ID,
      name,
      email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
      phone: `(555) ${String(200 + i).padStart(3, "0")}-${String(2000 + i * 41).slice(0, 4)}`,
      address: `${1000 + i * 100} ${["Oak", "Maple", "Pine", "Cedar", "Elm"][i % 5]} Street`,
      city: ["Austin", "Dallas", "Houston", "San Antonio", "Fort Worth"][i % 5],
      state: "TX",
      zip_code: `7${String(8000 + i * 10).slice(0, 4)}`,
      customer_type: i % 3 === 0 ? "commercial" : "residential",
      notes: `Valued customer with ${i + 1} past projects. ${["Prefers email.", "Responds quickly to calls.", "Flexible schedule.", "Weekend availability.", "Detailed specs needed."][i % 5]}`,
      company: i % 3 === 0 ? ["Rivera LLC", "TechSpace Inc", "Green Homes Co", "Metro Properties", "Sunset Ventures"][i % 5] : null,
    }));

    const { data: insertedCustomers } = await supabase
      .from("customers")
      .insert(customers)
      .select("id, name");

    // --- Step 4: Seed Jobs (10 jobs across all statuses) ---
    const jobData = [
      { name: "Kitchen Remodel - Johnson Residence", status: "in_progress", value: 45000 },
      { name: "Commercial Roof Replacement", status: "in_progress", value: 85000 },
      { name: "Master Bath Renovation", status: "in_progress", value: 32000 },
      { name: "Custom Deck Build", status: "completed", value: 28000 },
      { name: "Foundation Repair - Wilson Home", status: "completed", value: 15000 },
      { name: "Office Tenant Improvement", status: "completed", value: 120000 },
      { name: "Exterior Paint & Siding", status: "pending", value: 18000 },
      { name: "Garage Conversion ADU", status: "in_progress", value: 95000 },
      { name: "Pool House Addition", status: "on_hold", value: 65000 },
      { name: "Whole Home Remodel - Phase 1", status: "pending", value: 145000 },
    ];

    const jobs = jobData.map((job, i) => ({
      user_id: DEMO_USER_ID,
      project_name: job.name,
      job_status: job.status,
      customer_id: insertedCustomers?.[i % (insertedCustomers?.length || 1)]?.id,
      contract_value: job.value,
      start_date: new Date(Date.now() - (120 - i * 12) * 86400000).toISOString(),
      end_date: new Date(Date.now() + (i * 20 + 30) * 86400000).toISOString(),
      address: `${2000 + i * 200} Demo Street`,
      city: "Austin",
      state: "TX",
      zip_code: "78701",
      notes: `${job.name} — ${["High priority project.", "Standard timeline.", "Client wants weekly updates.", "Permit pending.", "Materials ordered."][i % 5]}`,
    }));

    const { data: insertedJobs } = await supabase
      .from("jobs")
      .insert(jobs)
      .select("id, project_name, contract_value");

    // --- Step 5: Seed Estimates (12 estimates) ---
    const estimateData = [
      { status: "draft", amount: 12000 }, { status: "draft", amount: 8500 },
      { status: "sent", amount: 45000 }, { status: "sent", amount: 3200 },
      { status: "viewed", amount: 28000 }, { status: "viewed", amount: 67000 },
      { status: "signed", amount: 15000 }, { status: "signed", amount: 92000 },
      { status: "signed", amount: 48000 }, { status: "declined", amount: 5400 },
      { status: "expired", amount: 22000 }, { status: "draft", amount: 35000 },
    ];

    const estimates = estimateData.map((est, i) => ({
      user_id: DEMO_USER_ID,
      title: `Estimate for ${customerNames[i % customerNames.length]} - ${["Kitchen Remodel", "Bathroom Reno", "Deck Build", "Roof Repair", "Painting"][i % 5]}`,
      status: est.status,
      customer_id: insertedCustomers?.[i % (insertedCustomers?.length || 1)]?.id,
      job_id: est.status === "signed" ? insertedJobs?.[i % (insertedJobs?.length || 1)]?.id : null,
      subtotal: est.amount,
      tax_rate: 8.25,
      total: Math.round(est.amount * 1.0825),
      notes: `${["Standard scope.", "Includes materials.", "Labor only.", "Full turnkey.", "Premium finishes."][i % 5]}`,
      valid_until: new Date(Date.now() + 30 * 86400000).toISOString(),
      scope_of_work: `Complete ${["kitchen", "bathroom", "deck", "roof", "interior"][i % 5]} work including demo, materials, labor, and final cleanup. ${["Includes appliance installation.", "Waterproofing included.", "Cedar materials specified.", "Tear-off and replacement.", "Two coats premium paint."][i % 5]}`,
    }));

    const { data: insertedEstimates } = await supabase
      .from("estimates")
      .insert(estimates)
      .select("id, title");

    // --- Step 6: Seed Invoices (14 invoices) ---
    const invoiceData = [
      { status: "paid", amount: 4500 }, { status: "paid", amount: 8500 },
      { status: "paid", amount: 15000 }, { status: "paid", amount: 3200 },
      { status: "paid", amount: 12000 },
      { status: "sent", amount: 6700 }, { status: "sent", amount: 12000 },
      { status: "overdue", amount: 9800 }, { status: "overdue", amount: 4300 },
      { status: "draft", amount: 22000 }, { status: "draft", amount: 5500 },
      { status: "partial", amount: 18000 }, { status: "partial", amount: 7500 },
      { status: "void", amount: 2800 },
    ];

    const invoices = invoiceData.map((inv, i) => {
      const taxAmount = Math.round(inv.amount * 0.0825 * 100) / 100;
      const total = Math.round(inv.amount * 1.0825 * 100) / 100;
      return {
        user_id: DEMO_USER_ID,
        customer_id: insertedCustomers?.[i % (insertedCustomers?.length || 1)]?.id,
        job_id: insertedJobs?.[i % (insertedJobs?.length || 1)]?.id,
        status: inv.status,
        subtotal: inv.amount,
        tax_rate: 8.25,
        tax_amount: taxAmount,
        total: total,
        amount_paid: inv.status === "paid" ? total
          : inv.status === "partial" ? Math.round(total * 0.5 * 100) / 100
          : 0,
        due_date: new Date(Date.now() + (inv.status === "overdue" ? -15 : 30) * 86400000).toISOString().split("T")[0],
        issued_date: new Date(Date.now() - (10 + i * 3) * 86400000).toISOString().split("T")[0],
        notes: `Invoice ${i + 1} - ${["Progress billing", "Final payment", "Deposit", "Material costs", "Change order"][i % 5]}`,
      };
    });

    const { data: insertedInvoices } = await supabase
      .from("invoices")
      .insert(invoices)
      .select("id, status, total");

    // --- Step 7: Seed Payments ---
    const paidInvoices = insertedInvoices?.filter((inv: any) => 
      ["paid", "partial"].includes(inv.status)
    ) || [];

    const payments = paidInvoices.map((inv: any, i: number) => ({
      user_id: DEMO_USER_ID,
      invoice_id: inv.id,
      job_id: insertedJobs?.[i % (insertedJobs?.length || 1)]?.id,
      customer_id: insertedCustomers?.[i % (insertedCustomers?.length || 1)]?.id,
      amount: inv.status === "partial" ? Math.round(inv.total * 0.5 * 100) / 100 : inv.total,
      net_amount: inv.status === "partial" ? Math.round(inv.total * 0.5 * 100) / 100 : inv.total,
      payment_method: ["credit_card", "check", "ach", "cash", "zelle"][i % 5],
      status: "succeeded",
      payment_date: new Date(Date.now() - (5 + i * 2) * 86400000).toISOString().split("T")[0],
      notes: `Payment ${i + 1} — ${["Visa ending 4242", "Check #${1000 + i}", "ACH transfer", "Cash received", "Zelle payment"][i % 5]}`,
    }));

    if (payments.length > 0) {
      await supabase.from("payments").insert(payments);
    }

    // --- Step 8: Seed Expenses ---
    const expenseCategories = ["materials", "labor", "equipment", "permits", "subcontractor"];
    const expenses = [];
    for (let i = 0; i < 20; i++) {
      expenses.push({
        user_id: DEMO_USER_ID,
        job_id: insertedJobs?.[i % (insertedJobs?.length || 1)]?.id,
        description: `${["Lumber & framing", "Electrical supplies", "Plumbing fixtures", "Tile & grout", "Paint & primer", "Hardware", "Concrete mix", "Insulation", "Drywall sheets", "Roofing materials"][i % 10]}`,
        amount: [1200, 850, 2300, 560, 1800, 340, 4500, 920, 675, 3100, 1450, 780, 2100, 490, 1650, 310, 3800, 1100, 590, 2400][i],
        category: expenseCategories[i % 5],
        expense_date: new Date(Date.now() - (30 - i) * 86400000).toISOString().split("T")[0],
        vendor: ["Home Depot", "Ferguson Supply", "84 Lumber", "Sherwin-Williams", "ABC Supply", "Lowe's", "US LBM", "Floor & Decor", "Fastenal", "HD Supply"][i % 10],
        notes: `${["Project materials", "Specialty order", "Bulk purchase", "Rush delivery", "Standard order"][i % 5]}`,
      });
    }

    await supabase.from("expenses").insert(expenses);

    // --- Step 9: Seed Crew Members & Crews ---
    const crewMemberData = [
      { name: "Carlos Mendez", role: "foreman", rate: 45, skills: ["framing", "concrete"] },
      { name: "Tony Williams", role: "journeyman", rate: 38, skills: ["electrical", "plumbing"] },
      { name: "Alex Rivera", role: "journeyman", rate: 36, skills: ["tile", "flooring"] },
      { name: "Jake Thompson", role: "apprentice", rate: 22, skills: ["general labor", "cleanup"] },
      { name: "Marcus Johnson", role: "foreman", rate: 48, skills: ["roofing", "siding"] },
      { name: "Ben Garcia", role: "journeyman", rate: 40, skills: ["painting", "drywall"] },
    ];

    const crewMembers = crewMemberData.map((cm) => ({
      user_id: DEMO_USER_ID,
      name: cm.name,
      role: cm.role,
      hourly_rate: cm.rate,
      skills_trades: cm.skills,
      phone: `(555) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      email: `${cm.name.toLowerCase().replace(" ", ".")}@apexcrew.demo`,
      is_active: true,
    }));

    const { data: insertedMembers } = await supabase
      .from("crew_members")
      .insert(crewMembers)
      .select("id, name");

    // Create crews
    const crewsData = [
      { name: "Alpha Team", color: "#3b82f6", description: "Primary residential crew" },
      { name: "Bravo Team", color: "#10b981", description: "Commercial & large projects" },
    ];

    const crews = crewsData.map((crew) => ({
      user_id: DEMO_USER_ID,
      name: crew.name,
      color: crew.color,
      description: crew.description,
      status: "active",
      is_active: true,
      foreman_name: crew.name === "Alpha Team" ? "Carlos Mendez" : "Marcus Johnson",
    }));

    const { data: insertedCrews } = await supabase
      .from("crews")
      .insert(crews)
      .select("id, name");

    // Create crew memberships
    if (insertedCrews && insertedMembers) {
      const memberships = [];
      // Alpha Team: first 3 members
      for (let i = 0; i < 3 && i < insertedMembers.length; i++) {
        memberships.push({
          crew_id: insertedCrews[0].id,
          crew_member_id: insertedMembers[i].id,
        });
      }
      // Bravo Team: last 3 members
      for (let i = 3; i < 6 && i < insertedMembers.length; i++) {
        memberships.push({
          crew_id: insertedCrews[1]?.id || insertedCrews[0].id,
          crew_member_id: insertedMembers[i].id,
        });
      }
      if (memberships.length > 0) {
        await supabase.from("crew_memberships").insert(memberships);
      }
    }

    // --- Step 10: Seed Daily Logs ---
    const dailyLogs = [];
    const inProgressJobs = insertedJobs?.filter((j: any) => 
      ["in_progress"].includes(jobs.find(jd => jd.project_name === j.project_name)?.job_status || "")
    ) || [];

    for (let i = 0; i < Math.min(8, inProgressJobs.length * 2); i++) {
      const jobIndex = i % inProgressJobs.length;
      dailyLogs.push({
        user_id: DEMO_USER_ID,
        job_id: inProgressJobs[jobIndex].id,
        log_date: new Date(Date.now() - (i + 1) * 86400000).toISOString().split("T")[0],
        work_completed: ["Framing complete for east wall", "Electrical rough-in finished", "Tile installation in master bath", "Drywall hung and taped", "Paint prep and primer coat", "Plumbing fixtures installed", "Cabinet installation started", "Final trim and touch-ups"][i % 8],
        hours_worked: [8, 7.5, 9, 8, 6.5, 8, 7, 8.5][i % 8],
        crew_count: [3, 2, 4, 3, 2, 3, 2, 4][i % 8],
        weather: ["sunny", "cloudy", "sunny", "rainy", "sunny", "partly_cloudy", "sunny", "cloudy"][i % 8],
        materials_used: ["2x4 lumber (40 pcs), nails", "14/2 Romex (500ft), boxes", "Porcelain tile (200 sqft)", "Drywall sheets (30), compound", "Primer (5 gal), tape", "Kohler fixtures (3)", "Maple cabinets (8 units)", "Trim molding (120 lf)"][i % 8],
        notes: ["On schedule", "Minor delay — waiting on inspection", "Ahead of schedule", "Weather delay — 2 hours lost", "Completed early", "Client visited site, approved progress", "Subcontractor coordinated", "Punch list items addressed"][i % 8],
        status: "submitted",
        client_visible: i % 3 === 0,
      });
    }

    if (dailyLogs.length > 0) {
      await supabase.from("daily_logs").insert(dailyLogs);
    }

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
        payments_count: payments.length,
        expenses_count: expenses.length,
        crew_members_count: crewMembers.length,
        crews_count: crews.length,
        daily_logs_count: dailyLogs.length,
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
          payments: payments.length,
          expenses: expenses.length,
          crew_members: crewMembers.length,
          crews: crews.length,
          daily_logs: dailyLogs.length,
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
