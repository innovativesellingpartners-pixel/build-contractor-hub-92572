import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.10.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { billing_cycle } = await req.json();
    if (!billing_cycle || !["monthly", "annual"].includes(billing_cycle)) {
      return new Response(JSON.stringify({ error: "billing_cycle must be 'monthly' or 'annual'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, full_name, business_name")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name || profile?.business_name || user.email,
        metadata: { contractor_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const appUrl = Deno.env.get("APP_URL") || "https://myct1.com";

    // Create a subscription checkout
    // Monthly: $40/month, Annual: $30/month ($360/year billed annually)
    const priceData = billing_cycle === "annual"
      ? {
          currency: "usd",
          unit_amount: 36000, // $360.00
          recurring: { interval: "year" as const },
          product_data: {
            name: "Voice AI — Annual Plan",
            description: "AI-powered receptionist with call answering, appointment booking, and lead capture. Billed annually at $30/month.",
          },
        }
      : {
          currency: "usd",
          unit_amount: 4000, // $40.00
          recurring: { interval: "month" as const },
          product_data: {
            name: "Voice AI — Monthly Plan",
            description: "AI-powered receptionist with call answering, appointment booking, and lead capture.",
          },
        };

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: priceData,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${appUrl}/dashboard?voice_ai_activated=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard?voice_ai_canceled=true`,
      metadata: {
        contractor_id: user.id,
        type: "voice_ai",
        billing_cycle,
      },
      subscription_data: {
        metadata: {
          contractor_id: user.id,
          type: "voice_ai",
          billing_cycle,
        },
      },
    });

    console.log(`Created Voice AI checkout session ${session.id} for contractor ${user.id}, cycle: ${billing_cycle}`);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error in voice-ai-checkout:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
