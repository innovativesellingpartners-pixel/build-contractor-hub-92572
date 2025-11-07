import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeneratePDFRequest {
  estimateId: string;
  includePaymentLink?: boolean;
}

function formatCurrency(v: number | null | undefined) {
  const n = Number(v || 0);
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { estimateId, includePaymentLink = true }: GeneratePDFRequest = await req.json();

    // Fetch estimate
    const { data: estimate, error: estimateError } = await supabase
      .from("estimates")
      .select("*")
      .eq("id", estimateId)
      .single();

    if (estimateError || !estimate) throw new Error("Estimate not found");

    // Fetch contractor profile for branding
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name, logo_url, phone, business_address, city, state, zip_code")
      .eq("user_id", estimate.user_id)
      .single();

    const companyName = profile?.company_name || "CT1 Constructeam";
    const logoUrl = profile?.logo_url || null;
    const phone = profile?.phone || "";
    const address = [profile?.business_address, profile?.city, profile?.state, profile?.zip_code]
      .filter(Boolean)
      .join(", ");

    const appUrl = Deno.env.get("APP_URL") || "https://yourapp.lovable.app";
    const publicUrl = `${appUrl}/estimate/${estimate.public_token}`;

    // Build PDF with pdf-lib (Edge-compatible)
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // US Letter portrait
    const { height, width } = page.getSize();

    const margin = 40;
    let cursorY = height - margin;

    // Fonts
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Header bar
    page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: rgb(0.88, 0.14, 0.14) });

    // Logo (if available)
    if (logoUrl) {
      try {
        const res = await fetch(logoUrl);
        const buf = new Uint8Array(await res.arrayBuffer());
        let img;
        const isPng = logoUrl.toLowerCase().endsWith(".png");
        if (isPng) img = await pdfDoc.embedPng(buf);
        else img = await pdfDoc.embedJpg(buf);
        const imgDims = img.scale(60 / img.height);
        page.drawImage(img, {
          x: width - margin - imgDims.width,
          y: height - 70,
          width: imgDims.width,
          height: imgDims.height,
        });
      } catch (_) {
        // ignore logo errors
      }
    }

    // Company name
    page.drawText(companyName, {
      x: margin,
      y: height - 55,
      size: 20,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    // Title and meta
    cursorY = height - 120;
    page.drawText("ESTIMATE", { x: margin, y: cursorY, size: 26, font: fontBold, color: rgb(0.12, 0.12, 0.12) });
    cursorY -= 22;
    if (estimate.estimate_number) {
      page.drawText(`#${estimate.estimate_number}`, { x: margin, y: cursorY, size: 12, font: fontReg, color: rgb(0.38, 0.38, 0.38) });
      cursorY -= 18;
    }
    const issueDate = new Date(estimate.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    page.drawText(`Issue Date: ${issueDate}`, { x: margin, y: cursorY, size: 12, font: fontReg, color: rgb(0.38, 0.38, 0.38) });
    cursorY -= 18;
    if (estimate.valid_until) {
      const valid = new Date(estimate.valid_until).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      page.drawText(`Valid Until: ${valid}`, { x: margin, y: cursorY, size: 12, font: fontReg, color: rgb(0.38, 0.38, 0.38) });
      cursorY -= 18;
    }

    // Company contact box (right)
    const rightBoxX = width - margin - 220;
    const rightBoxY = height - 190;
    page.drawRectangle({ x: rightBoxX, y: rightBoxY, width: 220, height: 80, borderColor: rgb(0.88, 0.14, 0.14), borderWidth: 2, color: rgb(0.98, 0.98, 0.98) });
    page.drawText("Prepared by", { x: rightBoxX + 10, y: rightBoxY + 58, size: 10, font: fontReg, color: rgb(0.5, 0.5, 0.5) });
    page.drawText(companyName, { x: rightBoxX + 10, y: rightBoxY + 40, size: 12, font: fontBold, color: rgb(0.12, 0.12, 0.12) });
    if (address) page.drawText(address, { x: rightBoxX + 10, y: rightBoxY + 24, size: 10, font: fontReg, color: rgb(0.25, 0.25, 0.25) });
    if (phone) page.drawText(phone, { x: rightBoxX + 10, y: rightBoxY + 10, size: 10, font: fontReg, color: rgb(0.25, 0.25, 0.25) });

    // Client section
    cursorY -= 16;
    page.drawText("Prepared For", { x: margin, y: cursorY, size: 11, font: fontBold, color: rgb(0.5, 0.5, 0.5) });
    cursorY -= 16;
    if (estimate.client_name) page.drawText(estimate.client_name, { x: margin, y: cursorY, size: 13, font: fontBold });
    if (estimate.client_email) page.drawText(estimate.client_email, { x: margin + 240, y: cursorY, size: 11, font: fontReg, color: rgb(0.25, 0.25, 0.25) });
    cursorY -= 16;
    if (estimate.client_address) { page.drawText(estimate.client_address, { x: margin, y: cursorY, size: 11, font: fontReg, color: rgb(0.25, 0.25, 0.25) }); cursorY -= 14; }
    if (estimate.site_address) { page.drawText(`Project Location: ${estimate.site_address}`, { x: margin, y: cursorY, size: 11, font: fontReg, color: rgb(0.25, 0.25, 0.25) }); cursorY -= 14; }

    // Project description
    if (estimate.project_description) {
      cursorY -= 8;
      page.drawRectangle({ x: margin - 4, y: cursorY - 6, width: width - margin * 2 + 8, height: 22, color: rgb(1, 0.95, 0.95) });
      page.drawText("Project Description", { x: margin, y: cursorY + 1, size: 12, font: fontBold, color: rgb(0.7, 0.1, 0.1) });
      cursorY -= 26;
      const desc = String(estimate.project_description);
      page.drawText(desc.slice(0, 2000), { x: margin, y: cursorY, size: 11, font: fontReg, color: rgb(0.2, 0.2, 0.2), lineHeight: 14, maxWidth: width - margin * 2 });
      cursorY -= Math.ceil(desc.length / 90) * 14 + 8;
    }

    // Line items table header
    const tableX = margin;
    const colQtyX = width - margin - 160;
    const colPriceX = width - margin - 60;
    const tableWidth = width - margin * 2;

    page.drawRectangle({ x: tableX, y: cursorY - 22, width: tableWidth, height: 24, color: rgb(0.12, 0.16, 0.22) });
    page.drawText("Description", { x: tableX + 8, y: cursorY - 6, size: 11, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("Qty", { x: colQtyX + 8, y: cursorY - 6, size: 11, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("Price", { x: colPriceX + 8, y: cursorY - 6, size: 11, font: fontBold, color: rgb(1, 1, 1) });
    cursorY -= 30;

    const lineItems = (estimate.line_items || []).filter((li: any) => li?.included !== false);
    for (const item of lineItems) {
      const desc = `${item.item_description || "Item"}`;
      page.drawText(desc.slice(0, 80), { x: tableX + 8, y: cursorY, size: 11, font: fontReg, color: rgb(0.12, 0.12, 0.12) });
      page.drawText(String(item.quantity ?? ""), { x: colQtyX + 8, y: cursorY, size: 11, font: fontReg, color: rgb(0.12, 0.12, 0.12) });
      page.drawText(formatCurrency(item.line_total ?? (item.unit_cost || 0) * (item.quantity || 0)), { x: colPriceX + 8, y: cursorY, size: 11, font: fontBold, color: rgb(0.12, 0.12, 0.12) });
      cursorY -= 18;
      if (cursorY < 120) {
        // New page if needed
        const p = pdfDoc.addPage([612, 792]);
        cursorY = 792 - margin;
      }
    }

    // Totals
    const boxW = 260;
    const boxH = 110;
    const boxX = width - margin - boxW;
    const boxY = Math.max(cursorY - boxH - 10, 120);
    page.drawRectangle({ x: boxX, y: boxY, width: boxW, height: boxH, borderWidth: 2, borderColor: rgb(0.9, 0.9, 0.9), color: rgb(1, 1, 1) });

    let ty = boxY + boxH - 26;
    const cs = estimate.cost_summary || {};
    if (cs.subtotal) {
      page.drawText("Subtotal", { x: boxX + 14, y: ty, size: 11, font: fontReg, color: rgb(0.4, 0.4, 0.4) });
      page.drawText(formatCurrency(cs.subtotal), { x: boxX + boxW - 14 - 80, y: ty, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      ty -= 18;
    }
    if (cs.profit_markup_percentage && cs.profit_markup_percentage > 0) {
      page.drawText(`Profit/Markup (${cs.profit_markup_percentage}%)`, { x: boxX + 14, y: ty, size: 11, font: fontReg, color: rgb(0.4, 0.4, 0.4) });
      page.drawText(formatCurrency(cs.profit_markup_amount || 0), { x: boxX + boxW - 14 - 80, y: ty, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      ty -= 18;
    }
    if (cs.tax_and_fees && cs.tax_and_fees > 0) {
      page.drawText("Tax & Fees", { x: boxX + 14, y: ty, size: 11, font: fontReg, color: rgb(0.4, 0.4, 0.4) });
      page.drawText(formatCurrency(cs.tax_and_fees), { x: boxX + boxW - 14 - 80, y: ty, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      ty -= 18;
    }

    // Grand total band
    page.drawRectangle({ x: boxX, y: boxY - 12, width: boxW, height: 36, color: rgb(0.88, 0.14, 0.14) });
    page.drawText("Total", { x: boxX + 14, y: boxY - 4, size: 14, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText(formatCurrency(estimate.total_amount || 0), { x: boxX + boxW - 14 - 120, y: boxY - 6, size: 18, font: fontBold, color: rgb(1, 1, 1) });

    // Payment CTA
    if (includePaymentLink) {
      const ctaY = boxY - 60;
      page.drawText("View, sign and pay this estimate: ", { x: margin, y: ctaY, size: 12, font: fontReg, color: rgb(0.2, 0.2, 0.2) });
      // Add a clickable link
      page.drawText(publicUrl, { x: margin, y: ctaY - 16, size: 12, font: fontBold, color: rgb(0.16, 0.4, 0.9) });
      // pdf-lib supports link annotations via 'link' option on drawText in recent versions
      // @ts-ignore - link is supported at runtime
      page.drawText(" ", { x: margin, y: ctaY - 16, size: 12, font: fontBold, color: rgb(0.16, 0.4, 0.9), link: publicUrl });
    }

    // Notes
    if (estimate.assumptions_and_exclusions) {
      const notesY = 80;
      page.drawText("Assumptions & Exclusions", { x: margin, y: notesY + 30, size: 12, font: fontBold, color: rgb(0.58, 0.25, 0.05) });
      page.drawText(String(estimate.assumptions_and_exclusions).slice(0, 1500), {
        x: margin,
        y: notesY + 12,
        size: 10,
        font: fontReg,
        color: rgb(0.25, 0.25, 0.25),
        lineHeight: 12,
        maxWidth: width - margin * 2,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const base64Pdf = btoa(String.fromCharCode(...pdfBytes));

    return new Response(
      JSON.stringify({
        success: true,
        pdfBase64: base64Pdf,
        pdfSize: pdfBytes.length,
        estimate: {
          number: estimate.estimate_number,
          title: estimate.title,
          client_name: estimate.client_name,
          total_amount: estimate.total_amount,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
