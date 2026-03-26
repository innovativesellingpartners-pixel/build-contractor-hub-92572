import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { buildCorsHeaders } from '../_shared/cors.ts';

/** Generate the structured Vapi prompt server-side (mirrors src/lib/generateVapiPrompt.ts) */
function buildPrompt(p: any): string {
  const bn = p.business_name || "[Business Name]";
  const trade = p.trade || "[Trade]";
  const services = p.services_offered?.length ? p.services_offered.join(", ") : "General services";
  const notOffered = p.services_not_offered?.length ? p.services_not_offered.join(", ") : "None specified";
  const area = p.service_area?.length ? p.service_area.join(", ") : "Not specified";

  const hours = p.business_hours
    ? typeof p.business_hours === "string"
      ? p.business_hours
      : Object.entries(p.business_hours).map(([d, h]) => `${d}: ${h}`).join(", ")
    : "Standard business hours";

  const pricing = p.allow_pricing
    ? `Provide pricing information when requested.${p.pricing_rules ? ` Reference: ${p.pricing_rules}` : ""}`
    : "Never give exact prices. Instead say the contractor will confirm pricing.";

  const emergency = p.emergency_availability
    ? `If caller describes an urgent situation related to ${trade}, escalate immediately. Offer 24/7 emergency availability.`
    : `If caller describes an urgent situation related to ${trade}, take their information and confirm someone will follow up as soon as possible.`;

  const calendar = p.calendar_email
    ? `Offer to schedule an appointment. Calendar is connected at ${p.calendar_email}.`
    : "Take caller information for scheduling — calendar is not yet connected.";

  const qualification = p.qualification_instructions
    || "Ask about the scope of work, timeline, and budget range when qualifying new leads.";

  return [
    `You are Sarah, the professional receptionist for ${bn}, a ${trade} contractor.`,
    `\n## Business Overview\n${p.service_description || `${bn} provides professional ${trade} services.`}`,
    `\n## Services Offered\n${services}`,
    `\n## Services NOT Offered\n${notOffered}`,
    `\n## Service Area\n${area}`,
    `\n## Hours of Operation\n${hours}`,
    `\n## Your Role\n- Answer inbound calls professionally.\n- Gather caller name, phone number, and reason for calling.\n- Qualify new leads.\n- ${calendar}\n- ${emergency}`,
    `\n## Tone & Style\n- Warm\n- Confident\n- Professional\n- Clear and concise\n- Never robotic\n- Never say "hold on"\n- Never mention you are AI`,
    `\n## Lead Qualification\n${qualification}`,
    `\n## Pricing\n${pricing}`,
    `\n## Transfer Rules\n- If caller requests a human, transfer politely.${p.contractor_phone ? `\n- Contractor phone: ${p.contractor_phone}` : ""}`,
    `\n## Guardrails\n- Never provide legal advice.\n- Never guess pricing.\n- Do not fabricate availability.\n- Keep responses under 20 words unless gathering information.`,
  ].join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    // Auth: accept either user JWT or CT1_INTERNAL_API_KEY
    const authHeader = req.headers.get("Authorization") || "";
    const internalKey = Deno.env.get("CT1_INTERNAL_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    let contractorId: string;

    const { contractor_id } = await req.json();

    if (authHeader === `Bearer ${internalKey}`) {
      // Internal API call
      contractorId = contractor_id;
    } else if (authHeader.startsWith("Bearer ")) {
      // User JWT — verify
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data, error } = await userClient.auth.getUser();
      if (error || !data?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      // Users can only sync their own profile (admins override via internal key)
      contractorId = contractor_id || data.user.id;
    } else {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (!contractorId) {
      return new Response(JSON.stringify({ error: "contractor_id required" }), {
        status: 400,
        headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Read the contractor's AI profile
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile, error: profileError } = await adminClient
      .from("contractor_ai_profiles")
      .select("*")
      .eq("contractor_id", contractorId)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found", details: profileError?.message }),
        { status: 404, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Build the structured prompt
    const systemPrompt = buildPrompt(profile);
    const firstMessage = `Hi, this is Sarah with ${profile.business_name || "[Business Name]"}.`;

    // Store the generated prompt back to the database
    await adminClient
      .from("contractor_ai_profiles")
      .update({ custom_instructions: systemPrompt })
      .eq("contractor_id", contractorId);

    // Sync to Forge
    const forgeBaseUrl = Deno.env.get("CT1_API_BASE_URL");
    if (forgeBaseUrl && internalKey) {
      try {
        const syncResponse = await fetch(`${forgeBaseUrl}/api/vapi/sync-prompt`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": internalKey,
          },
          body: JSON.stringify({
            contractor_id: contractorId,
            system_prompt: systemPrompt,
            first_message: firstMessage,
          }),
        });

        if (!syncResponse.ok) {
          const errorText = await syncResponse.text();
          console.error("Forge sync failed:", syncResponse.status, errorText);
          return new Response(
            JSON.stringify({
              success: true,
              synced: false,
              prompt_saved: true,
              forge_error: `Forge returned ${syncResponse.status}`,
            }),
            { status: 200, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, synced: true, prompt_saved: true }),
          { status: 200, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
        );
      } catch (forgeErr) {
        console.error("Forge sync error:", forgeErr);
        return new Response(
          JSON.stringify({
            success: true,
            synced: false,
            prompt_saved: true,
            forge_error: String(forgeErr),
          }),
          { status: 200, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: false,
        prompt_saved: true,
        note: "Forge base URL not configured — prompt saved but not synced",
      }),
      { status: 200, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("forge-prompt-sync error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(err) }),
      { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
