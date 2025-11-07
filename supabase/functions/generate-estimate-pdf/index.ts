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

    // Header bar with gradient simulation
    page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: rgb(0.88, 0.14, 0.14) });
    page.drawRectangle({ x: 0, y: height - 90, width, height: 3, color: rgb(0.96, 0.24, 0.24) });

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
      y: height - 60,
      size: 22,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    // Title and meta
    cursorY = height - 130;
    page.drawText("PROFESSIONAL ESTIMATE", { x: margin, y: cursorY, size: 28, font: fontBold, color: rgb(0.88, 0.14, 0.14) });
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

    // Company contact box (right) with modern styling
    const rightBoxX = width - margin - 230;
    const rightBoxY = height - 210;
    
    // Shadow
    page.drawRectangle({ x: rightBoxX + 3, y: rightBoxY - 3, width: 230, height: 90, color: rgb(0.92, 0.92, 0.92) });
    
    // Main box
    page.drawRectangle({ x: rightBoxX, y: rightBoxY, width: 230, height: 90, borderColor: rgb(0.88, 0.14, 0.14), borderWidth: 1.5, color: rgb(0.99, 0.97, 0.97) });
    
    // Top accent bar
    page.drawRectangle({ x: rightBoxX, y: rightBoxY + 90 - 5, width: 230, height: 5, color: rgb(0.88, 0.14, 0.14) });
    
    page.drawText("PREPARED BY", { x: rightBoxX + 12, y: rightBoxY + 68, size: 9, font: fontBold, color: rgb(0.88, 0.14, 0.14) });
    page.drawText(companyName, { x: rightBoxX + 12, y: rightBoxY + 50, size: 13, font: fontBold, color: rgb(0.12, 0.12, 0.12) });
    if (address) page.drawText(address.substring(0, 35), { x: rightBoxX + 12, y: rightBoxY + 32, size: 9, font: fontReg, color: rgb(0.35, 0.35, 0.35) });
    if (phone) page.drawText(phone, { x: rightBoxX + 12, y: rightBoxY + 16, size: 10, font: fontBold, color: rgb(0.15, 0.15, 0.15) });

    // Client section with modern styling
    cursorY -= 20;
    
    // Client info box
    const clientBoxY = cursorY - 75;
    page.drawRectangle({ x: margin - 5, y: clientBoxY, width: 340, height: 80, color: rgb(0.98, 0.98, 0.99), borderWidth: 1, borderColor: rgb(0.9, 0.9, 0.92) });
    
    page.drawText("PREPARED FOR", { x: margin, y: cursorY, size: 9, font: fontBold, color: rgb(0.88, 0.14, 0.14) });
    cursorY -= 18;
    
    if (estimate.client_name) {
      page.drawText(estimate.client_name, { x: margin, y: cursorY, size: 14, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      cursorY -= 16;
    }
    if (estimate.client_email) {
      page.drawText(estimate.client_email, { x: margin, y: cursorY, size: 10, font: fontReg, color: rgb(0.3, 0.3, 0.3) });
      cursorY -= 14;
    }
    if (estimate.client_address) { 
      page.drawText(estimate.client_address, { x: margin, y: cursorY, size: 10, font: fontReg, color: rgb(0.3, 0.3, 0.3) }); 
      cursorY -= 14; 
    }
    if (estimate.site_address) { 
      page.drawText(`📍 ${estimate.site_address}`, { x: margin, y: cursorY, size: 10, font: fontReg, color: rgb(0.88, 0.14, 0.14) }); 
      cursorY -= 20; 
    }

    // Project description with modern styling
    if (estimate.project_description) {
      cursorY -= 10;
      
      // Description box
      const descHeight = Math.min(Math.ceil(String(estimate.project_description).length / 90) * 14 + 35, 120);
      page.drawRectangle({ x: margin - 6, y: cursorY - descHeight + 8, width: width - margin * 2 + 12, height: descHeight, color: rgb(0.99, 0.97, 0.97), borderWidth: 1, borderColor: rgb(0.88, 0.14, 0.14) });
      
      page.drawText("PROJECT DETAILS", { x: margin, y: cursorY, size: 11, font: fontBold, color: rgb(0.88, 0.14, 0.14) });
      cursorY -= 20;
      
      const desc = String(estimate.project_description);
      page.drawText(desc.slice(0, 1800), { x: margin, y: cursorY, size: 10, font: fontReg, color: rgb(0.2, 0.2, 0.2), lineHeight: 13, maxWidth: width - margin * 2 });
      cursorY -= descHeight - 20;
    }

    // Line items table header with modern design
    cursorY -= 15;
    const tableX = margin;
    const colQtyX = width - margin - 160;
    const colPriceX = width - margin - 60;
    const tableWidth = width - margin * 2;

    // Header with gradient
    page.drawRectangle({ x: tableX, y: cursorY - 26, width: tableWidth, height: 28, color: rgb(0.88, 0.14, 0.14) });
    page.drawRectangle({ x: tableX, y: cursorY - 26, width: tableWidth, height: 2, color: rgb(0.96, 0.24, 0.24) });
    
    page.drawText("DESCRIPTION", { x: tableX + 12, y: cursorY - 8, size: 10, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("QTY", { x: colQtyX + 12, y: cursorY - 8, size: 10, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("AMOUNT", { x: colPriceX + 8, y: cursorY - 8, size: 10, font: fontBold, color: rgb(1, 1, 1) });
    cursorY -= 34;

    const lineItems = (estimate.line_items || []).filter((li: any) => li?.included !== false);
    let rowIndex = 0;
    for (const item of lineItems) {
      // Alternating row colors
      const rowColor = rowIndex % 2 === 0 ? rgb(1, 1, 1) : rgb(0.98, 0.98, 0.99);
      page.drawRectangle({ x: tableX, y: cursorY - 2, width: tableWidth, height: 20, color: rowColor });
      
      const desc = `${item.item_description || "Item"}`;
      page.drawText(desc.slice(0, 70), { x: tableX + 12, y: cursorY + 2, size: 10, font: fontReg, color: rgb(0.15, 0.15, 0.15) });
      page.drawText(String(item.quantity ?? ""), { x: colQtyX + 12, y: cursorY + 2, size: 10, font: fontReg, color: rgb(0.15, 0.15, 0.15) });
      page.drawText(formatCurrency(item.line_total ?? (item.unit_cost || 0) * (item.quantity || 0)), { x: colPriceX + 8, y: cursorY + 2, size: 11, font: fontBold, color: rgb(0.88, 0.14, 0.14) });
      
      cursorY -= 20;
      rowIndex++;
      
      if (cursorY < 140) {
        // New page if needed
        const p = pdfDoc.addPage([612, 792]);
        cursorY = 792 - margin;
      }
    }

    // Totals section with modern design - hide profit markup details
    cursorY -= 20;
    const boxW = 280;
    const boxH = 70;
    const boxX = width - margin - boxW;
    const boxY = Math.max(cursorY - boxH - 10, 120);
    
    // Subtle shadow effect
    page.drawRectangle({ x: boxX + 3, y: boxY - 3, width: boxW, height: boxH, color: rgb(0.92, 0.92, 0.92) });
    page.drawRectangle({ x: boxX, y: boxY, width: boxW, height: boxH, borderWidth: 1, borderColor: rgb(0.88, 0.88, 0.88), color: rgb(1, 1, 1) });

    // Subtotal row (only if we have line items detail)
    let ty = boxY + boxH - 24;
    const cs = estimate.cost_summary || {};
    if (cs.subtotal && (cs.tax_and_fees && cs.tax_and_fees > 0)) {
      page.drawText("Subtotal", { x: boxX + 18, y: ty, size: 11, font: fontReg, color: rgb(0.35, 0.35, 0.35) });
      page.drawText(formatCurrency(cs.subtotal + (cs.profit_markup_amount || 0)), { x: boxX + boxW - 18 - 70, y: ty, size: 11, font: fontBold, color: rgb(0.15, 0.15, 0.15) });
      ty -= 20;
      
      // Tax & Fees row
      page.drawText("Tax & Fees", { x: boxX + 18, y: ty, size: 11, font: fontReg, color: rgb(0.35, 0.35, 0.35) });
      page.drawText(formatCurrency(cs.tax_and_fees), { x: boxX + boxW - 18 - 70, y: ty, size: 11, font: fontBold, color: rgb(0.15, 0.15, 0.15) });
      ty -= 4;
    }

    // Divider line
    page.drawLine({
      start: { x: boxX + 14, y: boxY + 32 },
      end: { x: boxX + boxW - 14, y: boxY + 32 },
      thickness: 1,
      color: rgb(0.88, 0.14, 0.14),
    });

    // Grand total
    page.drawText("TOTAL INVESTMENT", { x: boxX + 18, y: boxY + 14, size: 10, font: fontBold, color: rgb(0.88, 0.14, 0.14) });
    page.drawText(formatCurrency(estimate.total_amount || 0), { x: boxX + boxW - 18 - 90, y: boxY + 12, size: 20, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

    // Payment CTA button
    if (includePaymentLink) {
      const ctaY = boxY - 60;
      const buttonW = 240;
      const buttonH = 38;
      const buttonX = (width - buttonW) / 2;
      
      // Button shadow
      page.drawRectangle({ x: buttonX + 2, y: ctaY - buttonH - 2, width: buttonW, height: buttonH, color: rgb(0.85, 0.85, 0.85) });
      
      // Button background
      page.drawRectangle({ x: buttonX, y: ctaY - buttonH, width: buttonW, height: buttonH, color: rgb(0.88, 0.14, 0.14) });
      
      // Button text
      page.drawText("VIEW & ACCEPT ESTIMATE", { 
        x: buttonX + 28, 
        y: ctaY - buttonH / 2 - 5, 
        size: 13, 
        font: fontBold, 
        color: rgb(1, 1, 1) 
      });
      
      // URL below button (smaller, muted)
      page.drawText("Secure payment link:", { x: buttonX, y: ctaY - buttonH - 20, size: 9, font: fontReg, color: rgb(0.5, 0.5, 0.5) });
      const urlText = publicUrl.length > 60 ? publicUrl.substring(0, 57) + "..." : publicUrl;
      page.drawText(urlText, { x: buttonX, y: ctaY - buttonH - 32, size: 8, font: fontReg, color: rgb(0.16, 0.4, 0.9) });
    }

    // Notes with modern styling
    if (estimate.assumptions_and_exclusions) {
      const notesY = 70;
      
      // Notes box
      page.drawRectangle({ x: margin - 4, y: notesY - 10, width: width - margin * 2 + 8, height: 60, color: rgb(0.99, 0.97, 0.95), borderWidth: 1, borderColor: rgb(0.9, 0.85, 0.8) });
      
      page.drawText("TERMS & CONDITIONS", { x: margin, y: notesY + 38, size: 10, font: fontBold, color: rgb(0.88, 0.14, 0.14) });
      page.drawText(String(estimate.assumptions_and_exclusions).slice(0, 1200), {
        x: margin,
        y: notesY + 20,
        size: 8,
        font: fontReg,
        color: rgb(0.3, 0.3, 0.3),
        lineHeight: 10,
        maxWidth: width - margin * 2,
      });
    }

    const pdfBytes = await pdfDoc.save();
    // Safe base64 encoding without spread to avoid call stack overflow
    let binary = '';
    const chunkSize = 0x8000; // 32KB
    for (let i = 0; i < pdfBytes.length; i += chunkSize) {
      const chunk = pdfBytes.subarray(i, i + chunkSize);
      let chunkStr = '';
      for (let j = 0; j < chunk.length; j++) {
        chunkStr += String.fromCharCode(chunk[j]);
      }
      binary += chunkStr;
    }
    const base64Pdf = btoa(binary);

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
