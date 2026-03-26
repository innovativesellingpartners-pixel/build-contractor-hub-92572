import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

import { buildCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    // URL format: /estimate-draft/{estimateId}
    const estimateId = pathParts[1] || url.searchParams.get("estimateId");

    if (!estimateId) {
      return new Response(
        JSON.stringify({ error: "estimateId is required" }),
        { status: 400, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Verify user owns this estimate
    const { data: estimate, error: estimateError } = await supabase
      .from("estimates")
      .select("id, user_id")
      .eq("id", estimateId)
      .single();

    if (estimateError || !estimate) {
      return new Response(
        JSON.stringify({ error: "Estimate not found" }),
        { status: 404, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    if (estimate.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Not authorized to access this estimate" }),
        { status: 403, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Handle different HTTP methods
    switch (req.method) {
      case "GET": {
        // Get draft for this estimate
        const { data: draft, error: draftError } = await supabase
          .from("estimate_drafts")
          .select("*")
          .eq("estimate_id", estimateId)
          .eq("user_id", user.id)
          .single();

        if (draftError) {
          if (draftError.code === "PGRST116") {
            // No draft found
            return new Response(
              JSON.stringify({ error: "No draft found" }),
              { status: 404, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
            );
          }
          throw draftError;
        }

        return new Response(
          JSON.stringify({
            draftId: draft.id,
            payload: draft.payload,
            version: draft.version,
            updatedAt: draft.updated_at,
          }),
          { headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      case "PUT": {
        const body = await req.json();
        const { payload, version, updatedAtClient } = body;

        if (!payload) {
          return new Response(
            JSON.stringify({ error: "payload is required" }),
            { status: 400, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
          );
        }

        // Check if draft exists
        const { data: existingDraft } = await supabase
          .from("estimate_drafts")
          .select("id, version")
          .eq("estimate_id", estimateId)
          .eq("user_id", user.id)
          .single();

        if (existingDraft) {
          // Optimistic concurrency check
          if (version && existingDraft.version > version) {
            return new Response(
              JSON.stringify({
                error: "Version conflict",
                serverVersion: existingDraft.version,
                code: "VERSION_CONFLICT",
              }),
              { status: 409, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
            );
          }

          // Update existing draft
          const { data: updatedDraft, error: updateError } = await supabase
            .from("estimate_drafts")
            .update({
              payload,
              version: existingDraft.version + 1,
              updated_at_client: updatedAtClient || new Date().toISOString(),
            })
            .eq("id", existingDraft.id)
            .select()
            .single();

          if (updateError) throw updateError;

          return new Response(
            JSON.stringify({
              draftId: updatedDraft.id,
              version: updatedDraft.version,
              updatedAt: updatedDraft.updated_at,
            }),
            { headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
          );
        } else {
          // Create new draft
          const { data: newDraft, error: insertError } = await supabase
            .from("estimate_drafts")
            .insert({
              estimate_id: estimateId,
              user_id: user.id,
              payload,
              version: 1,
              updated_at_client: updatedAtClient || new Date().toISOString(),
            })
            .select()
            .single();

          if (insertError) throw insertError;

          return new Response(
            JSON.stringify({
              draftId: newDraft.id,
              version: newDraft.version,
              updatedAt: newDraft.updated_at,
            }),
            { status: 201, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
          );
        }
      }

      case "DELETE": {
        const { error: deleteError } = await supabase
          .from("estimate_drafts")
          .delete()
          .eq("estimate_id", estimateId)
          .eq("user_id", user.id);

        if (deleteError) throw deleteError;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("Error in estimate-draft function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
