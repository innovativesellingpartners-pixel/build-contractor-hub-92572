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

    // Build PDF with pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // US Letter
    const { height, width } = page.getSize();

    const margin = 50;
    let cursorY = height - margin;

    // Fonts
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // ===== HEADER SECTION =====
    // Company Name (Left)
    page.drawText(companyName.substring(0, 35), {
      x: margin,
      y: cursorY,
      size: 18,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Logo (Right, if available)
    if (logoUrl) {
      try {
        const res = await fetch(logoUrl);
        const buf = new Uint8Array(await res.arrayBuffer());
        let img;
        const isPng = logoUrl.toLowerCase().endsWith(".png");
        if (isPng) img = await pdfDoc.embedPng(buf);
        else img = await pdfDoc.embedJpg(buf);
        const imgDims = img.scale(40 / img.height);
        page.drawImage(img, {
          x: width - margin - imgDims.width,
          y: cursorY - 5,
          width: imgDims.width,
          height: imgDims.height,
        });
      } catch (e) {
        console.log("Logo load error:", e);
      }
    }

    cursorY -= 15;
    if (address) {
      page.drawText(address.substring(0, 60), {
        x: margin,
        y: cursorY,
        size: 9,
        font: fontReg,
        color: rgb(0.4, 0.4, 0.4),
      });
    }
    cursorY -= 30;

    // ===== ESTIMATE TITLE & STATUS =====
    // Title with status badge
    page.drawText("ESTIMATE", {
      x: margin,
      y: cursorY,
      size: 24,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Status badge
    const statusText = estimate.status === "draft" ? "Draft" : estimate.status === "sent" ? "Sent" : "Unpaid";
    const badgeX = margin + 140;
    const badgeY = cursorY - 2;
    const badgeW = 70;
    const badgeH = 22;
    page.drawRectangle({
      x: badgeX,
      y: badgeY,
      width: badgeW,
      height: badgeH,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
    });
    page.drawText(statusText, {
      x: badgeX + 12,
      y: badgeY + 6,
      size: 10,
      font: fontBold,
      color: rgb(0.3, 0.3, 0.3),
    });

    cursorY -= 40;

    // ===== LEFT COLUMN: PRESENTED TO =====
    const leftColX = margin;
    const rightColX = width / 2 + 20;

    page.drawText("Presented to:", {
      x: leftColX,
      y: cursorY,
      size: 11,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    cursorY -= 18;

    if (estimate.client_name) {
      page.drawText(estimate.client_name.substring(0, 35), {
        x: leftColX,
        y: cursorY,
        size: 12,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      cursorY -= 16;
    }

    // Client contact
    let leftCursorY = cursorY;
    if (estimate.client_email) {
      page.drawText(`E: ${estimate.client_email.substring(0, 30)}`, {
        x: leftColX,
        y: leftCursorY,
        size: 9,
        font: fontReg,
        color: rgb(0.3, 0.3, 0.3),
      });
      leftCursorY -= 14;
    }
    if (estimate.client_address) {
      page.drawText(estimate.client_address.substring(0, 35), {
        x: leftColX,
        y: leftCursorY,
        size: 9,
        font: fontReg,
        color: rgb(0.3, 0.3, 0.3),
      });
      leftCursorY -= 14;
    }
    if (estimate.site_address) {
      page.drawText(`Site: ${estimate.site_address.substring(0, 30)}`, {
        x: leftColX,
        y: leftCursorY,
        size: 9,
        font: fontReg,
        color: rgb(0.3, 0.3, 0.3),
      });
      leftCursorY -= 20;
    }

    // ===== RIGHT COLUMN: ESTIMATE INFO =====
    let rightCursorY = cursorY + 18;
    
    if (estimate.estimate_number) {
      page.drawText("Estimate #", {
        x: rightColX,
        y: rightCursorY,
        size: 9,
        font: fontReg,
        color: rgb(0.4, 0.4, 0.4),
      });
      page.drawText(estimate.estimate_number, {
        x: rightColX + 80,
        y: rightCursorY,
        size: 10,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      rightCursorY -= 16;
    }

    const issueDate = new Date(estimate.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    page.drawText("Issue Date", {
      x: rightColX,
      y: rightCursorY,
      size: 9,
      font: fontReg,
      color: rgb(0.4, 0.4, 0.4),
    });
    page.drawText(issueDate, {
      x: rightColX + 80,
      y: rightCursorY,
      size: 10,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    rightCursorY -= 16;

    if (estimate.valid_until) {
      const validDate = new Date(estimate.valid_until).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      page.drawText("Valid Until", {
        x: rightColX,
        y: rightCursorY,
        size: 9,
        font: fontReg,
        color: rgb(0.4, 0.4, 0.4),
      });
      page.drawText(validDate, {
        x: rightColX + 80,
        y: rightCursorY,
        size: 10,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      rightCursorY -= 16;
    }

    // Set cursorY to the lower of the two columns
    cursorY = Math.min(leftCursorY, rightCursorY) - 20;

    // ===== PROJECT DESCRIPTION =====
    if (estimate.project_description && estimate.project_description.trim()) {
      page.drawText("Project Description:", {
        x: margin,
        y: cursorY,
        size: 11,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      cursorY -= 16;

      const desc = String(estimate.project_description);
      const descLines = [];
      const maxCharsPerLine = 85;
      for (let i = 0; i < desc.length; i += maxCharsPerLine) {
        descLines.push(desc.substring(i, i + maxCharsPerLine));
      }

      for (const line of descLines.slice(0, 3)) {
        page.drawText(line, {
          x: margin,
          y: cursorY,
          size: 9,
          font: fontReg,
          color: rgb(0.3, 0.3, 0.3),
        });
        cursorY -= 12;
      }
      cursorY -= 10;
    }

    // ===== LINE ITEMS TABLE =====
    const tableX = margin;
    const tableWidth = width - margin * 2;
    const colDescWidth = tableWidth - 140;
    const colQtyX = tableX + colDescWidth + 10;
    const colQtyWidth = 60;
    const colPriceX = colQtyX + colQtyWidth + 10;
    const colPriceWidth = 60;

    // Table header
    const headerY = cursorY;
    page.drawRectangle({
      x: tableX,
      y: headerY - 20,
      width: tableWidth,
      height: 20,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
    });

    page.drawText("DESCRIPTION", {
      x: tableX + 8,
      y: headerY - 14,
      size: 9,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText("QTY", {
      x: colQtyX + 8,
      y: headerY - 14,
      size: 9,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText("PRICE", {
      x: colPriceX + 8,
      y: headerY - 14,
      size: 9,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    cursorY = headerY - 20;

    // Table rows
    const lineItems = (estimate.line_items || []).filter((li: any) => li?.included !== false);
    for (const item of lineItems) {
      cursorY -= 18;

      // Row border
      page.drawLine({
        start: { x: tableX, y: cursorY },
        end: { x: tableX + tableWidth, y: cursorY },
        thickness: 0.5,
        color: rgb(0.85, 0.85, 0.85),
      });

      const desc = String(item.item_description || "Item").substring(0, 60);
      page.drawText(desc, {
        x: tableX + 8,
        y: cursorY + 4,
        size: 9,
        font: fontReg,
        color: rgb(0.2, 0.2, 0.2),
      });

      page.drawText(String(item.quantity || ""), {
        x: colQtyX + 8,
        y: cursorY + 4,
        size: 9,
        font: fontReg,
        color: rgb(0.2, 0.2, 0.2),
      });

      const lineTotal = item.line_total ?? (item.unit_cost || 0) * (item.quantity || 0);
      page.drawText(formatCurrency(lineTotal), {
        x: colPriceX + 8,
        y: cursorY + 4,
        size: 9,
        font: fontReg,
        color: rgb(0.2, 0.2, 0.2),
      });

      if (cursorY < 150) {
        // Add new page if needed
        const newPage = pdfDoc.addPage([612, 792]);
        cursorY = 792 - margin;
      }
    }

    // Bottom border of table
    page.drawLine({
      start: { x: tableX, y: cursorY },
      end: { x: tableX + tableWidth, y: cursorY },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    // Left and right borders
    page.drawLine({
      start: { x: tableX, y: headerY - 20 },
      end: { x: tableX, y: cursorY },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    page.drawLine({
      start: { x: tableX + tableWidth, y: headerY - 20 },
      end: { x: tableX + tableWidth, y: cursorY },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    cursorY -= 30;

    // ===== TOTALS BOX =====
    const totalsBoxX = width - margin - 200;
    const totalsBoxY = cursorY - 60;
    const totalsBoxW = 200;
    const totalsBoxH = 60;

    page.drawRectangle({
      x: totalsBoxX,
      y: totalsBoxY,
      width: totalsBoxW,
      height: totalsBoxH,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
    });

    let totalsY = totalsBoxY + totalsBoxH - 20;
    const cs = estimate.cost_summary || {};

    // Subtotal
    if (cs.subtotal && cs.tax_and_fees && cs.tax_and_fees > 0) {
      page.drawText("Subtotal", {
        x: totalsBoxX + 12,
        y: totalsY,
        size: 10,
        font: fontReg,
        color: rgb(0.3, 0.3, 0.3),
      });
      page.drawText(formatCurrency(cs.subtotal + (cs.profit_markup_amount || 0)), {
        x: totalsBoxX + totalsBoxW - 80,
        y: totalsY,
        size: 10,
        font: fontReg,
        color: rgb(0.1, 0.1, 0.1),
      });
      totalsY -= 16;

      // Tax & Fees
      page.drawText("Taxes", {
        x: totalsBoxX + 12,
        y: totalsY,
        size: 10,
        font: fontReg,
        color: rgb(0.3, 0.3, 0.3),
      });
      page.drawText(formatCurrency(cs.tax_and_fees), {
        x: totalsBoxX + totalsBoxW - 80,
        y: totalsY,
        size: 10,
        font: fontReg,
        color: rgb(0.1, 0.1, 0.1),
      });
      totalsY -= 6;
    }

    // Divider line
    page.drawLine({
      start: { x: totalsBoxX + 10, y: totalsY },
      end: { x: totalsBoxX + totalsBoxW - 10, y: totalsY },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    totalsY -= 12;

    // Total
    page.drawText("Total", {
      x: totalsBoxX + 12,
      y: totalsY,
      size: 12,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText(formatCurrency(estimate.total_amount || 0), {
      x: totalsBoxX + totalsBoxW - 90,
      y: totalsY,
      size: 14,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    cursorY = totalsBoxY - 30;

    // ===== PAYMENT BUTTON =====
    if (includePaymentLink) {
      const buttonW = 220;
      const buttonH = 36;
      const buttonX = (width - buttonW) / 2;
      const buttonY = cursorY - buttonH;

      // Button with border
      page.drawRectangle({
        x: buttonX,
        y: buttonY,
        width: buttonW,
        height: buttonH,
        color: rgb(0.2, 0.4, 0.8),
        borderColor: rgb(0.15, 0.3, 0.7),
        borderWidth: 2,
      });

      page.drawText("VIEW & ACCEPT ESTIMATE", {
        x: buttonX + 20,
        y: buttonY + buttonH / 2 - 6,
        size: 12,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      cursorY = buttonY - 20;

      // URL text
      const urlText = publicUrl.length > 65 ? publicUrl.substring(0, 62) + "..." : publicUrl;
      page.drawText(urlText, {
        x: margin,
        y: cursorY,
        size: 8,
        font: fontReg,
        color: rgb(0.4, 0.4, 0.8),
      });

      cursorY -= 25;
    }

    // ===== TERMS & CONDITIONS =====
    if (estimate.assumptions_and_exclusions && estimate.assumptions_and_exclusions.trim()) {
      page.drawText("Terms & Conditions:", {
        x: margin,
        y: cursorY,
        size: 10,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      cursorY -= 14;

      const terms = String(estimate.assumptions_and_exclusions);
      const termLines = [];
      const maxCharsPerLine = 90;
      for (let i = 0; i < terms.length && termLines.length < 4; i += maxCharsPerLine) {
        termLines.push(terms.substring(i, i + maxCharsPerLine));
      }

      for (const line of termLines) {
        page.drawText(line, {
          x: margin,
          y: cursorY,
          size: 8,
          font: fontReg,
          color: rgb(0.4, 0.4, 0.4),
        });
        cursorY -= 11;
      }
    }

    // ===== FOOTER =====
    if (phone) {
      page.drawText(`Contact: ${phone}`, {
        x: margin,
        y: 30,
        size: 8,
        font: fontReg,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    const pdfBytes = await pdfDoc.save();
    
    // Safe base64 encoding
    let binary = '';
    const chunkSize = 0x8000;
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