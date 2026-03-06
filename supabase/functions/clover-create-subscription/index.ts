import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const cloverApiToken = Deno.env.get("CLOVER_API_TOKEN");
    const cloverMerchantId = Deno.env.get("CLOVER_MERCHANT_ID");
    const cloverEnv = Deno.env.get("CLOVER_ENV") || "sandbox";

    if (!cloverApiToken || !cloverMerchantId) {
      throw new Error("Clover credentials not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await supabase.auth.getUser(token);
    if (!caller) throw new Error("Unauthorized");

    const { data: callerRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .maybeSingle();

    const isAdmin = callerRole?.role === "admin" || callerRole?.role === "super_admin" || caller.email?.endsWith("@myct1.com");
    if (!isAdmin) throw new Error("Only admins can manage subscriptions");

    const { userId, tierId, addonType, priceCents, billingCycle } = await req.json();

    if (!userId || !tierId || priceCents === undefined) {
      throw new Error("Missing required fields: userId, tierId, priceCents");
    }

    const cloverBaseUrl = cloverEnv === "production"
      ? "https://api.clover.com"
      : "https://apisandbox.dev.clover.com";

    // Get user profile for customer info
    const { data: profile } = await supabase
      .from("profiles")
      .select("contact_name, company_name, business_email, phone")
      .eq("user_id", userId)
      .single();

    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const customerEmail = authUser?.user?.email || profile?.business_email || "";
    const customerName = profile?.contact_name || profile?.company_name || "Contractor";

    // Plan name mapping
    const planNames: Record<string, string> = {
      launch: "CT1 Launch Platform - $250/mo",
      chat_agent: "CT1 Pocket Agent (Chat AI) - $10/mo",
      forge_ai: "CT1 Forge AI (Voice AI) - $20/mo",
    };

    // Step 1: Create or find a Clover plan
    const planName = planNames[tierId] || `CT1 ${tierId} Plan`;

    // Check if plan already exists
    const plansRes = await fetch(
      `${cloverBaseUrl}/recurring/v1/plans?filter=name=${encodeURIComponent(planName)}`,
      {
        headers: {
          Authorization: `Bearer ${cloverApiToken}`,
          "X-Clover-Merchant-Id": cloverMerchantId,
          "Content-Type": "application/json",
        },
      }
    );

    let planId: string;
    const plansData = await plansRes.json();

    if (plansData.elements && plansData.elements.length > 0) {
      planId = plansData.elements[0].id;
    } else {
      // Create the plan
      const createPlanRes = await fetch(`${cloverBaseUrl}/recurring/v1/plans`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cloverApiToken}`,
          "X-Clover-Merchant-Id": cloverMerchantId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: planName,
          amount: priceCents,
          interval: billingCycle === "annual" ? "YEAR" : "MONTH",
          intervalCount: 1,
          active: true,
        }),
      });

      if (!createPlanRes.ok) {
        const errText = await createPlanRes.text();
        throw new Error(`Failed to create Clover plan: ${errText}`);
      }

      const planData = await createPlanRes.json();
      planId = planData.id;
    }

    // Step 2: Check if Clover customer exists, or create one
    let cloverCustomerId: string | null = null;

    // Check existing subscription for clover_customer_id
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("clover_customer_id")
      .eq("user_id", userId)
      .not("clover_customer_id", "is", null)
      .limit(1)
      .maybeSingle();

    if (existingSub?.clover_customer_id) {
      cloverCustomerId = existingSub.clover_customer_id;
    } else {
      // Create customer in Clover
      const createCustomerRes = await fetch(
        `${cloverBaseUrl}/v3/merchants/${cloverMerchantId}/customers`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cloverApiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: customerName.split(" ")[0] || customerName,
            lastName: customerName.split(" ").slice(1).join(" ") || "",
            emailAddresses: customerEmail ? [{ emailAddress: customerEmail }] : [],
          }),
        }
      );

      if (!createCustomerRes.ok) {
        const errText = await createCustomerRes.text();
        throw new Error(`Failed to create Clover customer: ${errText}`);
      }

      const customerData = await createCustomerRes.json();
      cloverCustomerId = customerData.id;
    }

    // Step 3: Create subscription under the plan
    const createSubRes = await fetch(
      `${cloverBaseUrl}/recurring/v1/plans/${planId}/subscriptions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cloverApiToken}`,
          "X-Clover-Merchant-Id": cloverMerchantId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: { id: cloverCustomerId },
          collectionMethod: "CHARGE_AUTOMATICALLY",
          active: true,
        }),
      }
    );

    if (!createSubRes.ok) {
      const errText = await createSubRes.text();
      console.error("Clover subscription creation failed:", errText);
      // Still proceed to create local record — Clover card-on-file may need to be set up separately
    }

    const cloverSubData = createSubRes.ok ? await createSubRes.json() : null;

    // Step 4: Cancel existing active subscription of same type
    if (addonType) {
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("addon_type", addonType)
        .eq("status", "active");
    } else {
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("addon_type", null)
        .eq("status", "active");
    }

    // Step 5: Create subscription record in our database
    const { error: insertError } = await supabase.from("subscriptions").insert({
      user_id: userId,
      tier_id: tierId,
      billing_cycle: billingCycle || "monthly",
      status: "active",
      is_free: false,
      price_cents: priceCents,
      addon_type: addonType || null,
      clover_plan_id: planId,
      clover_subscription_id: cloverSubData?.id || null,
      clover_customer_id: cloverCustomerId,
      started_at: new Date().toISOString(),
    });

    if (insertError) throw insertError;

    // Update profile subscription_tier if this is a platform subscription
    if (!addonType) {
      await supabase
        .from("profiles")
        .update({ subscription_tier: tierId })
        .eq("user_id", userId);
    }

    // If chat_agent addon, update pocketbot access
    if (addonType === "chat_agent") {
      await supabase
        .from("profiles")
        .update({
          pocketbot_access_type: "paid",
          pocketbot_full_access: true,
        })
        .eq("user_id", userId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId: cloverSubData?.id,
        planId,
        cloverCustomerId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Clover subscription error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
