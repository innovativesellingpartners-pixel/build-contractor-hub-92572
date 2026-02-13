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

Available report types: jobs, estimates, invoices, customers, leads, payments, expenses

Available filters:
- amount: { operator: "lt" | "gt" | "eq" | "gte" | "lte", value: number, field?: string }
- dateRange: { preset: "today" | "this_week" | "this_month" | "last_month" | "this_year" | "last_year" | "next_week" | "next_month" } OR { start: "YYYY-MM-DD", end: "YYYY-MM-DD" }
- status: string (e.g. "unpaid", "paid", "open", "closed", "sent", "signed", "scheduled", "in_progress", "completed", "pending", "active")
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
  "summary": "Brief human-readable description of what was requested"
}

Examples:
- "Pull a report of all jobs that have materials" → {"reportType":"jobs","filters":{"hasMaterials":true},"summary":"All jobs with materials"}
- "Show all estimates under 10000 from this year" → {"reportType":"estimates","filters":{"amount":{"operator":"lt","value":10000,"field":"total_amount"},"dateRange":{"preset":"this_year"}},"summary":"Estimates under $10,000 from this year"}
- "List unpaid invoices for Acme" → {"reportType":"invoices","filters":{"status":"unpaid","customerName":"Acme"},"summary":"Unpaid invoices for Acme"}
- "Show jobs scheduled next week" → {"reportType":"jobs","filters":{"dateRange":{"preset":"next_week"}},"summary":"Jobs scheduled next week"}`;

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
    const limit = Math.min(filters.limit || 50, 200);

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
          .select("id, name, job_number, job_status, address, city, state, contract_value, total_contract_value, payments_collected, expenses_total, start_date, end_date, created_at, customers(name)", { count: "exact" })
          .eq("user_id", userId);

        if (dateStart && dateEnd) {
          q = q.gte("created_at", dateStart).lte("created_at", dateEnd + "T23:59:59");
        }
        if (filters.status) {
          q = q.eq("job_status", filters.status);
        }
        if (filters.customerName) {
          // Join via customer relationship
          q = q.ilike("customers.name", `%${filters.customerName}%`);
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
          // Get job IDs that have materials
          const { data: materialJobs } = await supabase
            .from("materials")
            .select("job_id")
            .not("job_id", "is", null);
          
          if (materialJobs && materialJobs.length > 0) {
            const jobIds = [...new Set(materialJobs.map((m: any) => m.job_id))];
            q = q.in("id", jobIds);
          } else {
            // No jobs have materials
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

      default:
        return new Response(JSON.stringify({ error: `Unknown report type: ${reportType}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({
      reportType,
      summary: intent.summary || `${reportType} report`,
      filters: intent.filters,
      results,
      totalCount,
      limit,
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
