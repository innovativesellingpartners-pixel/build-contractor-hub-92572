import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching public invoice with token: ${token}`);

    // Fetch invoice with related data
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        jobs (
          id,
          name,
          job_number,
          address,
          city,
          state,
          zip_code
        ),
        customers (
          id,
          name,
          email,
          phone,
          address
        )
      `)
      .eq("public_token", token)
      .single();

    if (invoiceError || !invoice) {
      console.error("Invoice not found:", invoiceError);
      return new Response(
        JSON.stringify({ error: "Invoice not found or link expired" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch contractor profile for branding
    const { data: contractor } = await supabase
      .from("profiles")
      .select("company_name, logo_url, phone, business_email, business_address, city, state, zip_code, website_url, license_number, contact_name, brand_primary_color, brand_secondary_color, brand_accent_color")
      .eq("id", invoice.user_id)
      .single();

    // Calculate remaining balance
    const amountDue = invoice.amount_due || 0;
    const amountPaid = invoice.amount_paid || 0;
    const remainingBalance = Math.max(0, amountDue - amountPaid);

    console.log(`Invoice ${invoice.invoice_number}: Due=${amountDue}, Paid=${amountPaid}, Remaining=${remainingBalance}`);

    return new Response(
      JSON.stringify({
        invoice: {
          ...invoice,
          remaining_balance: remainingBalance,
        },
        contractor,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in get-public-invoice:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
