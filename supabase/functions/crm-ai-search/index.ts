import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Missing query" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const today = new Date().toISOString().split("T")[0];

    // Step 1: Use AI to parse the natural language query into a structured intent
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a CRM query parser. Parse the user's natural language request into a structured JSON intent for querying a contractor CRM database.

Available report types: jobs, estimates, invoices, customers, leads, payments, all_expenses, expenses, materials, change_orders, job_costs, plaid_transactions, budget_items, daily_logs, crew

Report type descriptions:
- jobs: Active/completed construction jobs
- estimates: Price quotes sent to clients
- invoices: Bills sent to clients for payment
- customers: Client contact records
- leads: Potential clients/prospects
- payments: Payments received from clients
- all_expenses: UNIFIED view of ALL expenses from every source — manual expenses, bank transactions, job costs, materials, AND QuickBooks purchases. USE THIS when the user says "expenses", "all expenses", "my expenses", "spending", "money spent", "accounting expenses", or any general expense/accounting query. This is the DEFAULT for any expense-related request. This includes QuickBooks data automatically.
- expenses: Only manual expense entries (rarely used alone — prefer all_expenses)
- materials: Construction materials ordered/used for jobs
- change_orders: Scope/cost changes on jobs
- job_costs: Cost tracking entries per job (labor, materials, etc.)
- plaid_transactions: Bank transactions imported from linked bank accounts
- budget_items: Budget line items for jobs (budgeted vs actual amounts)
- daily_logs: Daily field reports/logs for jobs
- crew: Crew members and their roles

IMPORTANT ROUTING RULES:
- When the user asks about "expenses", "all expenses", "spending", "money spent", "costs", or any general financial/accounting expense query, ALWAYS use reportType "all_expenses" (NOT "expenses").
- Only use "expenses" if the user specifically says "manual expenses" or "manually entered expenses".
- When the user mentions "accounting data" or "accounting", consider all financial report types: all_expenses, payments, invoices, budget_items, job_costs.

Available filters:
- amount: { operator: "lt" | "gt" | "eq" | "gte" | "lte", value: number, field?: string }
- dateRange: { preset: "today" | "this_week" | "this_month" | "last_month" | "this_year" | "last_year" | "next_week" | "next_month" } OR { start: "YYYY-MM-DD", end: "YYYY-MM-DD" }
- status: string (e.g. "unpaid", "paid", "open", "closed", "sent", "signed", "scheduled", "in_progress", "completed", "pending", "active", "draft")
- customerName: string (partial match)
- search: string (general text search across name/description fields)
- hasMaterials: boolean (for jobs with materials)
- sortBy: string (field name)
- sortDir: "asc" | "desc"
- limit: number (default 50, max 200)

Today's date is ${today}.

IMPORTANT: Return ONLY valid JSON. No markdown, no explanation. Use this exact schema:
{
  "reportType": "jobs",
  "filters": { ... },
  "summary": "Brief human-readable description of what was requested",
  "needsAnalysis": true/false,
  "openAsReport": true/false
}

Set "needsAnalysis" to true when the user is asking a question that requires reasoning, judgment, or insight beyond simple filtering. Examples:
- "What estimate needs the most attention?" → needsAnalysis: true
- "Which jobs are at risk of going over budget?" → needsAnalysis: true
- "Show all estimates under 10000" → needsAnalysis: false

Set "openAsReport" to true when the user explicitly asks to "run a report", "generate a report", "show a report", "show in a new page", "pull a report", "create a report", or similar phrasing that implies they want a full-page formatted report view. When openAsReport is true, set limit to 200.

Examples:
- "Pull a report of all jobs that have materials" → {"reportType":"jobs","filters":{"hasMaterials":true,"limit":200},"summary":"All jobs with materials","needsAnalysis":false,"openAsReport":true}
- "Show all estimates under 10000 from this year" → {"reportType":"estimates","filters":{"amount":{"operator":"lt","value":10000,"field":"total_amount"},"dateRange":{"preset":"this_year"}},"summary":"Estimates under $10,000 from this year","needsAnalysis":false,"openAsReport":false}
- "Run a report showing all my expenses" → {"reportType":"all_expenses","filters":{"limit":200},"summary":"All expenses report","needsAnalysis":false,"openAsReport":true}
- "Show all my materials" → {"reportType":"materials","filters":{},"summary":"All materials","needsAnalysis":false,"openAsReport":false}
- "Run a report of bank transactions this month" → {"reportType":"plaid_transactions","filters":{"dateRange":{"preset":"this_month"},"limit":200},"summary":"Bank transactions this month","needsAnalysis":false,"openAsReport":true}
- "Show my crew members" → {"reportType":"crew","filters":{},"summary":"All crew members","needsAnalysis":false,"openAsReport":false}
- "Daily logs for this week" → {"reportType":"daily_logs","filters":{"dateRange":{"preset":"this_week"}},"summary":"Daily logs this week","needsAnalysis":false,"openAsReport":false}
- "Change orders that are pending" → {"reportType":"change_orders","filters":{"status":"pending"},"summary":"Pending change orders","needsAnalysis":false,"openAsReport":false}
- "Budget items over budget" → {"reportType":"budget_items","filters":{},"summary":"Budget items over budget","needsAnalysis":true,"openAsReport":false}
- "Show my expenses" → {"reportType":"all_expenses","filters":{},"summary":"All expenses (unified)","needsAnalysis":false,"openAsReport":false}
- "What have I spent this month" → {"reportType":"all_expenses","filters":{"dateRange":{"preset":"this_month"}},"summary":"All spending this month","needsAnalysis":false,"openAsReport":false}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "Failed to parse query" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";
    
    // Clean markdown code fences if present
    let jsonStr = rawContent.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    }

    let intent: any;
    try {
      intent = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      return new Response(JSON.stringify({ error: "Could not understand query. Try rephrasing." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Execute the query against the database
    const reportType = intent.reportType || "jobs";
    const filters = intent.filters || {};
    const openAsReport = intent.openAsReport || false;
    const limit = Math.min(filters.limit || (openAsReport ? 200 : 50), 200);

    // Resolve date ranges
    let dateStart: string | null = null;
    let dateEnd: string | null = null;
    if (filters.dateRange) {
      const now = new Date();
      if (filters.dateRange.preset) {
        switch (filters.dateRange.preset) {
          case "today":
            dateStart = today;
            dateEnd = today;
            break;
          case "this_week": {
            const dow = now.getDay();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - dow);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            dateStart = startOfWeek.toISOString().split("T")[0];
            dateEnd = endOfWeek.toISOString().split("T")[0];
            break;
          }
          case "next_week": {
            const dow2 = now.getDay();
            const startNext = new Date(now);
            startNext.setDate(now.getDate() + (7 - dow2));
            const endNext = new Date(startNext);
            endNext.setDate(startNext.getDate() + 6);
            dateStart = startNext.toISOString().split("T")[0];
            dateEnd = endNext.toISOString().split("T")[0];
            break;
          }
          case "this_month":
            dateStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
            dateEnd = today;
            break;
          case "last_month": {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            dateStart = lastMonth.toISOString().split("T")[0];
            dateEnd = lastMonthEnd.toISOString().split("T")[0];
            break;
          }
          case "next_month": {
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
            dateStart = nextMonth.toISOString().split("T")[0];
            dateEnd = nextMonthEnd.toISOString().split("T")[0];
            break;
          }
          case "this_year":
            dateStart = `${now.getFullYear()}-01-01`;
            dateEnd = today;
            break;
          case "last_year":
            dateStart = `${now.getFullYear() - 1}-01-01`;
            dateEnd = `${now.getFullYear() - 1}-12-31`;
            break;
        }
      } else if (filters.dateRange.start && filters.dateRange.end) {
        dateStart = filters.dateRange.start;
        dateEnd = filters.dateRange.end;
      }
    }

    let results: any[] = [];
    let totalCount = 0;

    // Build and execute query based on report type
    switch (reportType) {
      case "jobs": {
        let q = supabase
          .from("jobs")
          .select("id, name, job_number, job_status, address, city, state, contract_value, total_contract_value, payments_collected, expenses_total, start_date, end_date, created_at, customers!jobs_customer_id_fkey(name)", { count: "exact" })
          .eq("user_id", userId);

        if (dateStart && dateEnd) {
          q = q.gte("created_at", dateStart).lte("created_at", dateEnd + "T23:59:59");
        }
        if (filters.status) {
          q = q.eq("job_status", filters.status);
        }
        if (filters.customerName) {
          q = q.ilike("customers!jobs_customer_id_fkey.name", `%${filters.customerName}%`);
        }
        if (filters.search) {
          q = q.or(`name.ilike.%${filters.search}%,job_number.ilike.%${filters.search}%`);
        }
        if (filters.amount) {
          const amtField = filters.amount.field || "contract_value";
          const op = filters.amount.operator;
          const val = filters.amount.value;
          if (op === "lt") q = q.lt(amtField, val);
          else if (op === "gt") q = q.gt(amtField, val);
          else if (op === "eq") q = q.eq(amtField, val);
          else if (op === "gte") q = q.gte(amtField, val);
          else if (op === "lte") q = q.lte(amtField, val);
        }

        if (filters.hasMaterials) {
          const { data: materialJobs } = await supabase
            .from("materials")
            .select("job_id")
            .not("job_id", "is", null);
          
          if (materialJobs && materialJobs.length > 0) {
            const jobIds = [...new Set(materialJobs.map((m: any) => m.job_id))];
            q = q.in("id", jobIds);
          } else {
            results = [];
            break;
          }
        }

        q = q.order(filters.sortBy || "created_at", { ascending: filters.sortDir === "asc" })
          .limit(limit);

        const { data, count, error } = await q;
        if (error) {
          console.error("Jobs query error:", error);
          throw error;
        }
        results = data || [];
        totalCount = count || 0;
        break;
      }

      case "estimates": {
        let q = supabase
          .from("estimates")
          .select("id, title, estimate_number, status, total_amount, client_name, client_email, created_at, sent_at, signed_at, valid_until", { count: "exact" })
          .eq("user_id", userId);

        if (dateStart && dateEnd) {
          q = q.gte("created_at", dateStart).lte("created_at", dateEnd + "T23:59:59");
        }
        if (filters.status) {
          q = q.eq("status", filters.status);
        }
        if (filters.customerName) {
          q = q.ilike("client_name", `%${filters.customerName}%`);
        }
        if (filters.search) {
          q = q.or(`title.ilike.%${filters.search}%,estimate_number.ilike.%${filters.search}%,client_name.ilike.%${filters.search}%`);
        }
        if (filters.amount) {
          const amtField = filters.amount.field || "total_amount";
          const op = filters.amount.operator;
          const val = filters.amount.value;
          if (op === "lt") q = q.lt(amtField, val);
          else if (op === "gt") q = q.gt(amtField, val);
          else if (op === "eq") q = q.eq(amtField, val);
          else if (op === "gte") q = q.gte(amtField, val);
          else if (op === "lte") q = q.lte(amtField, val);
        }

        q = q.order(filters.sortBy || "created_at", { ascending: filters.sortDir === "asc" })
          .limit(limit);

        const { data, count, error } = await q;
        if (error) throw error;
        results = data || [];
        totalCount = count || 0;
        break;
      }

      case "invoices": {
        let q = supabase
          .from("invoices")
          .select("id, invoice_number, status, amount_due, amount_paid, due_date, created_at, customers(name, email), jobs(name, job_number)", { count: "exact" })
          .eq("user_id", userId);

        if (dateStart && dateEnd) {
          q = q.gte("created_at", dateStart).lte("created_at", dateEnd + "T23:59:59");
        }
        if (filters.status) {
          const statusMap: Record<string, string> = { unpaid: "sent", paid: "paid" };
          q = q.eq("status", statusMap[filters.status] || filters.status);
        }
        if (filters.customerName) {
          q = q.ilike("customers.name", `%${filters.customerName}%`);
        }
        if (filters.search) {
          q = q.or(`invoice_number.ilike.%${filters.search}%`);
        }
        if (filters.amount) {
          const amtField = filters.amount.field || "amount_due";
          const op = filters.amount.operator;
          const val = filters.amount.value;
          if (op === "lt") q = q.lt(amtField, val);
          else if (op === "gt") q = q.gt(amtField, val);
          else if (op === "eq") q = q.eq(amtField, val);
          else if (op === "gte") q = q.gte(amtField, val);
          else if (op === "lte") q = q.lte(amtField, val);
        }

        q = q.order(filters.sortBy || "created_at", { ascending: filters.sortDir === "asc" })
          .limit(limit);

        const { data, count, error } = await q;
        if (error) throw error;
        results = data || [];
        totalCount = count || 0;
        break;
      }

      case "customers": {
        let q = supabase
          .from("customers")
          .select("id, name, email, phone, address, city, state, company, customer_number, lifetime_value, created_at", { count: "exact" })
          .eq("user_id", userId)
          .is("archived_at", null);

        if (dateStart && dateEnd) {
          q = q.gte("created_at", dateStart).lte("created_at", dateEnd + "T23:59:59");
        }
        if (filters.customerName || filters.search) {
          const term = filters.customerName || filters.search;
          q = q.or(`name.ilike.%${term}%,email.ilike.%${term}%,company.ilike.%${term}%`);
        }
        if (filters.amount) {
          const amtField = filters.amount.field || "lifetime_value";
          const op = filters.amount.operator;
          const val = filters.amount.value;
          if (op === "lt") q = q.lt(amtField, val);
          else if (op === "gt") q = q.gt(amtField, val);
          else if (op === "gte") q = q.gte(amtField, val);
          else if (op === "lte") q = q.lte(amtField, val);
        }

        q = q.order(filters.sortBy || "created_at", { ascending: filters.sortDir === "asc" })
          .limit(limit);

        const { data, count, error } = await q;
        if (error) throw error;
        results = data || [];
        totalCount = count || 0;
        break;
      }

      case "leads": {
        let q = supabase
          .from("leads")
          .select("id, name, email, phone, status, source, lead_number, estimated_value, created_at", { count: "exact" })
          .eq("user_id", userId);

        if (dateStart && dateEnd) {
          q = q.gte("created_at", dateStart).lte("created_at", dateEnd + "T23:59:59");
        }
        if (filters.status) {
          q = q.eq("status", filters.status);
        }
        if (filters.customerName || filters.search) {
          const term = filters.customerName || filters.search;
          q = q.or(`name.ilike.%${term}%,email.ilike.%${term}%`);
        }
        if (filters.amount) {
          const amtField = filters.amount.field || "estimated_value";
          const op = filters.amount.operator;
          const val = filters.amount.value;
          if (op === "lt") q = q.lt(amtField, val);
          else if (op === "gt") q = q.gt(amtField, val);
        }

        q = q.order(filters.sortBy || "created_at", { ascending: filters.sortDir === "asc" })
          .limit(limit);

        const { data, count, error } = await q;
        if (error) throw error;
        results = data || [];
        totalCount = count || 0;
        break;
      }

      case "payments": {
        let q = supabase
          .from("payments")
          .select("id, amount, net_amount, status, payment_method, created_at, jobs(name, job_number), customers(name)", { count: "exact" })
          .eq("contractor_id", userId);

        if (dateStart && dateEnd) {
          q = q.gte("created_at", dateStart).lte("created_at", dateEnd + "T23:59:59");
        }
        if (filters.status) {
          q = q.eq("status", filters.status);
        }
        if (filters.amount) {
          const op = filters.amount.operator;
          const val = filters.amount.value;
          if (op === "lt") q = q.lt("amount", val);
          else if (op === "gt") q = q.gt("amount", val);
        }

        q = q.order(filters.sortBy || "created_at", { ascending: filters.sortDir === "asc" })
          .limit(limit);

        const { data, count, error } = await q;
        if (error) throw error;
        results = data || [];
        totalCount = count || 0;
        break;
      }

      case "expenses": {
        let q = supabase
          .from("expenses")
          .select("id, amount, category, description, date, notes, jobs(name, job_number), created_at", { count: "exact" })
          .eq("contractor_id", userId);

        if (dateStart && dateEnd) {
          q = q.gte("date", dateStart).lte("date", dateEnd);
        }
        if (filters.search) {
          q = q.or(`description.ilike.%${filters.search}%,category.ilike.%${filters.search}%`);
        }
        if (filters.amount) {
          const op = filters.amount.operator;
          const val = filters.amount.value;
          if (op === "lt") q = q.lt("amount", val);
          else if (op === "gt") q = q.gt("amount", val);
        }

        q = q.order(filters.sortBy || "date", { ascending: filters.sortDir === "asc" })
          .limit(limit);

        const { data, count, error } = await q;
        if (error) throw error;
        results = data || [];
        totalCount = count || 0;
        break;
      }

      case "all_expenses": {
        // Unified expenses: pull from expenses, plaid_transactions, job_costs, and materials
        const allItems: any[] = [];

        // 1. Manual expenses
        const { data: expData } = await supabase
          .from("expenses")
          .select("id, amount, category, description, date, notes, job_id, jobs(name, job_number), created_at")
          .eq("contractor_id", userId)
          .order("date", { ascending: false })
          .limit(limit);
        if (expData) {
          for (const e of expData) {
            if (dateStart && e.date < dateStart) continue;
            if (dateEnd && e.date > dateEnd) continue;
            if (filters.search && !`${e.description} ${e.category} ${e.notes}`.toLowerCase().includes(filters.search.toLowerCase())) continue;
            allItems.push({ ...e, source: "manual_expense" });
          }
        }

        // 2. Bank transactions (Plaid)
        const { data: plaidData } = await supabase
          .from("plaid_transactions")
          .select("id, amount, transaction_date, category, vendor, description, notes, is_expense, jobs(name, job_number), created_at")
          .eq("contractor_id", userId)
          .order("transaction_date", { ascending: false })
          .limit(limit);
        if (plaidData) {
          for (const t of plaidData) {
            if (dateStart && t.transaction_date < dateStart) continue;
            if (dateEnd && t.transaction_date > dateEnd) continue;
            if (filters.search && !`${t.description} ${t.category} ${t.vendor} ${t.notes}`.toLowerCase().includes(filters.search.toLowerCase())) continue;
            allItems.push({
              id: t.id,
              amount: t.amount,
              category: t.category || "Bank Transaction",
              description: t.vendor ? `${t.vendor} - ${t.description || ""}` : t.description,
              date: t.transaction_date,
              notes: t.notes,
              jobs: t.jobs,
              created_at: t.created_at,
              source: "bank_transaction",
            });
          }
        }

        // 3. Job costs
        const { data: costData } = await supabase
          .from("job_costs")
          .select("id, amount, category, description, cost_date, jobs(name, job_number), created_at")
          .eq("user_id", userId)
          .order("cost_date", { ascending: false })
          .limit(limit);
        if (costData) {
          for (const c of costData) {
            if (dateStart && c.cost_date < dateStart) continue;
            if (dateEnd && c.cost_date > dateEnd) continue;
            if (filters.search && !`${c.description} ${c.category}`.toLowerCase().includes(filters.search.toLowerCase())) continue;
            allItems.push({
              id: c.id,
              amount: c.amount,
              category: c.category || "Job Cost",
              description: c.description,
              date: c.cost_date,
              notes: null,
              jobs: c.jobs,
              created_at: c.created_at,
              source: "job_cost",
            });
          }
        }

        // 4. Materials
        const { data: matData } = await supabase
          .from("materials")
          .select("id, description, total_cost, supplier_name, date_ordered, jobs(name, job_number), created_at")
          .eq("user_id", userId)
          .order("date_ordered", { ascending: false })
          .limit(limit);
        if (matData) {
          for (const m of matData) {
            if (dateStart && m.date_ordered && m.date_ordered < dateStart) continue;
            if (dateEnd && m.date_ordered && m.date_ordered > dateEnd) continue;
            if (filters.search && !`${m.description} ${m.supplier_name}`.toLowerCase().includes(filters.search.toLowerCase())) continue;
            allItems.push({
              id: m.id,
              amount: m.total_cost,
              category: "Materials",
              description: m.supplier_name ? `${m.supplier_name} - ${m.description}` : m.description,
              date: m.date_ordered,
              notes: null,
              jobs: m.jobs,
              created_at: m.created_at,
              source: "material",
            });
          }
        }

        // 5. QuickBooks expenses (Purchase records from QB API)
        try {
          const encryptionKey = Deno.env.get("QUICKBOOKS_ENCRYPTION_KEY");
          if (encryptionKey) {
            const { data: qbConn } = await supabase.rpc("get_quickbooks_tokens", {
              p_user_id: userId,
              p_encryption_key: encryptionKey,
            });
            if (qbConn && qbConn.length > 0) {
              const conn = qbConn[0];
              let qbAccessToken = conn.access_token;
              const expiresAt = new Date(conn.expires_at);
              if (expiresAt <= new Date()) {
                // Refresh token
                const clientId = Deno.env.get("QUICKBOOKS_CLIENT_ID");
                const clientSecret = Deno.env.get("QUICKBOOKS_CLIENT_SECRET");
                if (clientId && clientSecret) {
                  const refreshResp = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/x-www-form-urlencoded",
                      "Authorization": "Basic " + btoa(`${clientId}:${clientSecret}`),
                    },
                    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: conn.refresh_token }).toString(),
                  });
                  if (refreshResp.ok) {
                    const tokenData = await refreshResp.json();
                    qbAccessToken = tokenData.access_token;
                    const newExpiry = new Date(Date.now() + tokenData.expires_in * 1000);
                    await supabase.rpc("store_quickbooks_tokens", {
                      p_user_id: userId,
                      p_realm_id: conn.realm_id,
                      p_access_token: tokenData.access_token,
                      p_refresh_token: tokenData.refresh_token,
                      p_expires_at: newExpiry.toISOString(),
                      p_encryption_key: encryptionKey,
                    });
                  }
                }
              }
              // Fetch QB Purchase records
              const qbEndpoint = `query?query=${encodeURIComponent("SELECT * FROM Purchase ORDERBY TxnDate DESC MAXRESULTS 200")}&minorversion=73`;
              const qbResp = await fetch(
                `https://quickbooks.api.intuit.com/v3/company/${conn.realm_id}/${qbEndpoint}`,
                { headers: { "Authorization": `Bearer ${qbAccessToken}`, "Accept": "application/json" } }
              );
              if (qbResp.ok) {
                const qbData = await qbResp.json();
                const purchases = qbData?.QueryResponse?.Purchase || [];
                for (const p of purchases) {
                  const txnDate = p.TxnDate || null;
                  if (dateStart && txnDate && txnDate < dateStart) continue;
                  if (dateEnd && txnDate && txnDate > dateEnd) continue;
                  const vendor = p.EntityRef?.name || "Unknown";
                  const account = p.Line?.[0]?.AccountBasedExpenseLineDetail?.AccountRef?.name || "Uncategorized";
                  const memo = p.PrivateNote || "";
                  const amt = parseFloat(p.TotalAmt || "0");
                  if (filters.search && !`${vendor} ${account} ${memo}`.toLowerCase().includes(filters.search.toLowerCase())) continue;
                  allItems.push({
                    id: `qb-${p.Id}`,
                    amount: amt,
                    category: account,
                    description: `${vendor} - ${memo || account}`,
                    date: txnDate,
                    notes: memo,
                    jobs: null,
                    created_at: txnDate,
                    source: "quickbooks",
                  });
                }
              }
            }
          }
        } catch (qbErr) {
          console.error("QuickBooks fetch failed (non-fatal):", qbErr);
          // Continue without QB data — other sources still returned
        }

        // Sort by date descending
        allItems.sort((a, b) => {
          const da = a.date || a.created_at || "";
          const db = b.date || b.created_at || "";
          return filters.sortDir === "asc" ? da.localeCompare(db) : db.localeCompare(da);
        });

        // Apply amount filter
        let filtered = allItems;
        if (filters.amount) {
          const op = filters.amount.operator;
          const val = filters.amount.value;
          filtered = filtered.filter((item: any) => {
            const amt = item.amount || 0;
            if (op === "lt") return amt < val;
            if (op === "gt") return amt > val;
            if (op === "gte") return amt >= val;
            if (op === "lte") return amt <= val;
            if (op === "eq") return amt === val;
            return true;
          });
        }

        results = filtered.slice(0, limit);
        totalCount = filtered.length;
        break;
      }

      case "materials": {
        let q = supabase
          .from("materials")
          .select("id, description, quantity_ordered, quantity_used, unit_type, cost_per_unit, total_cost, supplier_name, date_ordered, date_used, notes, jobs(name, job_number), created_at", { count: "exact" })
          .eq("user_id", userId);

        if (dateStart && dateEnd) {
          q = q.gte("date_ordered", dateStart).lte("date_ordered", dateEnd);
        }
        if (filters.search) {
          q = q.or(`description.ilike.%${filters.search}%,supplier_name.ilike.%${filters.search}%`);
        }
        if (filters.amount) {
          const op = filters.amount.operator;
          const val = filters.amount.value;
          if (op === "lt") q = q.lt("total_cost", val);
          else if (op === "gt") q = q.gt("total_cost", val);
          else if (op === "gte") q = q.gte("total_cost", val);
          else if (op === "lte") q = q.lte("total_cost", val);
        }

        q = q.order(filters.sortBy || "created_at", { ascending: filters.sortDir === "asc" })
          .limit(limit);

        const { data, count, error } = await q;
        if (error) throw error;
        results = data || [];
        totalCount = count || 0;
        break;
      }

      case "change_orders": {
        let q = supabase
          .from("change_orders")
          .select("id, change_order_number, description, status, additional_cost, total_amount, reason, date_requested, date_approved, client_name, jobs(name, job_number), created_at", { count: "exact" })
          .eq("user_id", userId);

        if (dateStart && dateEnd) {
          q = q.gte("created_at", dateStart).lte("created_at", dateEnd + "T23:59:59");
        }
        if (filters.status) {
          q = q.eq("status", filters.status);
        }
        if (filters.search) {
          q = q.or(`description.ilike.%${filters.search}%,change_order_number.ilike.%${filters.search}%`);
        }
        if (filters.amount) {
          const op = filters.amount.operator;
          const val = filters.amount.value;
          if (op === "lt") q = q.lt("additional_cost", val);
          else if (op === "gt") q = q.gt("additional_cost", val);
        }

        q = q.order(filters.sortBy || "created_at", { ascending: filters.sortDir === "asc" })
          .limit(limit);

        const { data, count, error } = await q;
        if (error) throw error;
        results = data || [];
        totalCount = count || 0;
        break;
      }

      case "job_costs": {
        let q = supabase
          .from("job_costs")
          .select("id, category, description, amount, cost_date, jobs(name, job_number), created_at", { count: "exact" })
          .eq("user_id", userId);

        if (dateStart && dateEnd) {
          q = q.gte("cost_date", dateStart).lte("cost_date", dateEnd);
        }
        if (filters.search) {
          q = q.or(`description.ilike.%${filters.search}%,category.ilike.%${filters.search}%`);
        }
        if (filters.amount) {
          const op = filters.amount.operator;
          const val = filters.amount.value;
          if (op === "lt") q = q.lt("amount", val);
          else if (op === "gt") q = q.gt("amount", val);
        }

        q = q.order(filters.sortBy || "cost_date", { ascending: filters.sortDir === "asc" })
          .limit(limit);

        const { data, count, error } = await q;
        if (error) throw error;
        results = data || [];
        totalCount = count || 0;
        break;
      }

      case "plaid_transactions": {
        let q = supabase
          .from("plaid_transactions")
          .select("id, amount, transaction_date, category, vendor, description, notes, is_expense, is_reimbursable, jobs(name, job_number), created_at", { count: "exact" })
          .eq("contractor_id", userId);

        if (dateStart && dateEnd) {
          q = q.gte("transaction_date", dateStart).lte("transaction_date", dateEnd);
        }
        if (filters.search) {
          q = q.or(`vendor.ilike.%${filters.search}%,description.ilike.%${filters.search}%,category.ilike.%${filters.search}%`);
        }
        if (filters.amount) {
          const op = filters.amount.operator;
          const val = filters.amount.value;
          if (op === "lt") q = q.lt("amount", val);
          else if (op === "gt") q = q.gt("amount", val);
        }

        q = q.order(filters.sortBy || "transaction_date", { ascending: filters.sortDir === "asc" })
          .limit(limit);

        const { data, count, error } = await q;
        if (error) throw error;
        results = data || [];
        totalCount = count || 0;
        break;
      }

      case "budget_items": {
        let q = supabase
          .from("job_budget_line_items")
          .select("id, description, item_code, category, budgeted_quantity, budgeted_unit_price, budgeted_amount, actual_amount, variance_amount, variance_percent, notes, jobs(name, job_number), created_at", { count: "exact" })
          .eq("user_id", userId);

        if (filters.search) {
          q = q.or(`description.ilike.%${filters.search}%,category.ilike.%${filters.search}%,item_code.ilike.%${filters.search}%`);
        }
        if (filters.amount) {
          const op = filters.amount.operator;
          const val = filters.amount.value;
          if (op === "lt") q = q.lt("budgeted_amount", val);
          else if (op === "gt") q = q.gt("budgeted_amount", val);
        }

        q = q.order(filters.sortBy || "created_at", { ascending: filters.sortDir === "asc" })
          .limit(limit);

        const { data, count, error } = await q;
        if (error) throw error;
        results = data || [];
        totalCount = count || 0;
        break;
      }

      case "daily_logs": {
        let q = supabase
          .from("daily_logs")
          .select("id, log_date, work_completed, notes, weather, crew_count, hours_worked, materials_used, equipment_used, jobs(name, job_number), created_at", { count: "exact" })
          .eq("user_id", userId);

        if (dateStart && dateEnd) {
          q = q.gte("log_date", dateStart).lte("log_date", dateEnd);
        }
        if (filters.search) {
          q = q.or(`work_completed.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
        }

        q = q.order(filters.sortBy || "log_date", { ascending: filters.sortDir === "asc" })
          .limit(limit);

        const { data, count, error } = await q;
        if (error) throw error;
        results = data || [];
        totalCount = count || 0;
        break;
      }

      case "crew": {
        let q = supabase
          .from("crew_members")
          .select("id, name, role, skills_trades, contact_info, created_at", { count: "exact" })
          .eq("user_id", userId);

        if (filters.search) {
          q = q.or(`name.ilike.%${filters.search}%,role.ilike.%${filters.search}%`);
        }

        q = q.order(filters.sortBy || "name", { ascending: filters.sortDir !== "desc" })
          .limit(limit);

        const { data, count, error } = await q;
        if (error) throw error;
        results = data || [];
        totalCount = count || 0;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown report type: ${reportType}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Step 3: If the query needs analysis, send results back to AI for reasoning
    let aiInsight: string | null = null;
    if (intent.needsAnalysis && results.length > 0) {
      const analysisPrompt = `You are a business advisor for a contractor. The user asked: "${query}"

Here is the relevant data from their CRM (${reportType}, ${results.length} records):

${JSON.stringify(results.slice(0, 50), null, 2)}

Today's date is ${today}.

Analyze this data and provide a clear, actionable answer to their question. Be specific — reference record names, numbers, amounts, and dates. Keep your answer concise (2-4 paragraphs max). Use bullet points for clarity when listing multiple items. Focus on what matters most and why.`;

      try {
        const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "user", content: analysisPrompt },
            ],
            temperature: 0.3,
          }),
        });

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          aiInsight = analysisData.choices?.[0]?.message?.content || null;
        } else {
          console.error("Analysis AI error:", analysisResponse.status);
        }
      } catch (analysisErr) {
        console.error("Analysis error:", analysisErr);
      }
    }

    return new Response(JSON.stringify({
      reportType,
      summary: intent.summary || `${reportType} report`,
      filters: intent.filters,
      results,
      totalCount,
      limit,
      aiInsight,
      openAsReport,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in crm-ai-search:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
