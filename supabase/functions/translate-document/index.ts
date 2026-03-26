import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { buildCorsHeaders } from '../_shared/cors.ts';

const REFINEMENT_SYSTEM_PROMPT = `You are a bilingual English-Spanish construction industry expert. You are reviewing a translation of a contractor's estimate that will be sent to an English-speaking customer. Your job is to: 1) Fix any mistranslations, especially construction-specific terminology. 2) Ensure all construction terms use standard American English trade terminology (e.g., 'drywall' not 'plasterboard', 'grout' not 'filler', 'baseboard' not 'skirting board', 'dumpster' not 'skip'). 3) Make the English read naturally and professionally, as if a native English-speaking contractor wrote it. 4) Preserve all numbers, measurements, dollar amounts, dates, names, and addresses exactly as they are — do not translate or alter these. 5) Keep the same structure and line-by-line format as the original. Return ONLY valid JSON with the same keys and corrected English values — no explanations or commentary.

Construction terminology reference:
lechada = grout, tablero de yeso = drywall, zócalo = baseboard, moldura de corona = crown molding, piso laminado = laminate flooring, baldosa = tile, cemento = concrete, varilla de refuerzo = rebar, tubería = piping/plumbing, cableado = wiring, impermeabilización = waterproofing, demolición = demolition, enmarcado = framing, aislamiento = insulation, calafateo = caulking, masilla = spackle/putty, lijado = sanding, imprimación = primer, pintura = paint, techo = roof/ceiling, canaleta = gutter, bajante = downspout, ventana = window, puerta = door, cerradura = lock, grifo = faucet, inodoro = toilet, lavabo = sink, bañera = bathtub, ducha = shower, calentador de agua = water heater, aire acondicionado = air conditioning/HVAC, interruptor = switch, tomacorriente = outlet, panel eléctrico = breaker panel, presupuesto = estimate, factura = invoice, mano de obra = labor, materiales = materials, garantía = warranty, plazo de pago = payment terms, anticipo = deposit, saldo = balance due.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { texts, sourceLang, targetLang, glossary } = await req.json();

    if (!texts || !sourceLang || !targetLang) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: texts, sourceLang, targetLang" }),
        { status: 400, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
        status: 500,
        headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Build glossary context
    const glossaryEntries = glossary
      ? Object.entries(glossary as Record<string, string>)
          .map(([from, to]) => `"${from}" -> "${to}"`)
          .join("\n")
      : "";

    const glossaryInstruction = glossaryEntries
      ? `\n\nIMPORTANT: Use this construction industry glossary for accurate terminology. Always prefer glossary terms over general translations:\n${glossaryEntries}`
      : "";

    const sourceLangName = sourceLang === "es" ? "Spanish" : "English";
    const targetLangName = targetLang === "en" ? "English" : "Spanish";

    // ── Step 1: Base translation (fast model) ──
    const baseSystemPrompt = `You are a professional translator specializing in the construction and contracting industry. Translate the following texts from ${sourceLangName} to ${targetLangName}.

Rules:
- Maintain the exact same structure and formatting as the input
- Preserve numbers, measurements, dates, currency amounts, and proper nouns exactly as-is
- Use industry-standard construction terminology
- Keep technical abbreviations (GFCI, AFCI, PEX, CPVC, OSB, HVAC, LVP, ADA) unchanged
- Translate naturally - do not translate word-by-word${glossaryInstruction}

You will receive a JSON object where each key maps to a text value. Return a JSON object with the same keys and the translated text values. Return ONLY valid JSON, no explanation.`;

    console.log("Step 1: Base translation with gemini-3-flash-preview");
    const baseResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: baseSystemPrompt },
          { role: "user", content: JSON.stringify(texts) },
        ],
      }),
    });

    if (!baseResponse.ok) {
      if (baseResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      if (baseResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Translation service requires additional credits." }),
          { status: 402, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      const errText = await baseResponse.text();
      console.error("Base translation error:", baseResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "Translation service unavailable" }),
        { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const baseData = await baseResponse.json();
    const baseContent = baseData.choices?.[0]?.message?.content || "";

    let baseTranslated: Record<string, string>;
    try {
      const cleaned = baseContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      baseTranslated = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse base translation:", baseContent);
      return new Response(
        JSON.stringify({ error: "Failed to parse base translation result" }),
        { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // ── Step 2: AI refinement (powerful model) ──
    console.log("Step 2: AI refinement with gemini-2.5-pro");
    let refined: Record<string, string> = baseTranslated;
    let aiEnhanced = false;
    let refinedFields: string[] = [];

    try {
      const refinementUserMessage = `Original ${sourceLangName}:\n${JSON.stringify(texts, null, 2)}\n\n---\n\nBase ${targetLangName} Translation:\n${JSON.stringify(baseTranslated, null, 2)}\n\n---\n\nPlease review and refine the ${targetLangName} translation. Return ONLY a valid JSON object with the same keys and the corrected values.`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const refineResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: REFINEMENT_SYSTEM_PROMPT },
            { role: "user", content: refinementUserMessage },
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (refineResponse.ok) {
        const refineData = await refineResponse.json();
        const refineContent = refineData.choices?.[0]?.message?.content || "";

        try {
          const cleanedRefine = refineContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const parsedRefined = JSON.parse(cleanedRefine);

          // Determine which fields were changed
          for (const key of Object.keys(baseTranslated)) {
            if (parsedRefined[key] && parsedRefined[key] !== baseTranslated[key]) {
              refinedFields.push(key);
            }
          }

          refined = parsedRefined;
          aiEnhanced = true;
          console.log(`AI refinement improved ${refinedFields.length} field(s)`);
        } catch {
          console.error("Failed to parse refinement response, using base translation:", refineContent);
          // Fall back to base translation — already set
        }
      } else {
        const errText = await refineResponse.text();
        console.error("AI refinement request failed, using base translation:", refineResponse.status, errText);
        // Fall back to base translation
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        console.warn("AI refinement timed out after 15s, using base translation");
      } else {
        console.error("AI refinement error, using base translation:", err);
      }
      // Fall back to base translation
    }

    return new Response(JSON.stringify({
      translated: refined,
      baseTranslated,
      aiEnhanced,
      refinedFields,
    }), {
      status: 200,
      headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
