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

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { 
    month: "long", 
    day: "numeric", 
    year: "numeric" 
  });
}

// Word wrap helper
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { estimateId, includePaymentLink = true, public_token }: GeneratePDFRequest & { public_token?: string } = await req.json();

    // SECURITY: Check if this is a public token request (no auth required)
    if (!public_token) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Unauthorized - No authentication header" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized - Invalid token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: estimate } = await supabase
        .from("estimates")
        .select("user_id")
        .eq("id", estimateId)
        .single();

      if (!estimate || estimate.user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: "Forbidden - You don't have access to this estimate" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

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
      .select("company_name, logo_url, phone, business_address, city, state, zip_code, contact_email")
      .eq("user_id", estimate.user_id)
      .single();

    const companyName = profile?.company_name || "CT1 Constructeam";
    const logoUrl = profile?.logo_url || null;
    const phone = profile?.phone || "";
    const contactEmail = profile?.contact_email || "";
    const address = [profile?.business_address, profile?.city, profile?.state, profile?.zip_code]
      .filter(Boolean)
      .join(", ");

    const appUrl = Deno.env.get("APP_URL") || "https://myct1.com";
    const publicUrl = `${appUrl}/estimate/${estimate.public_token}`;

    // Build PDF with pdf-lib
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([612, 792]); // US Letter
    const { height, width } = page.getSize();

    const margin = 48;
    let cursorY = height - margin;

    // Fonts
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Colors - Premium palette
    const primaryRed = rgb(0.878, 0.141, 0.141); // #E02424
    const darkGray = rgb(0.067, 0.067, 0.067);   // #111
    const medGray = rgb(0.294, 0.294, 0.294);    // #4B4B4B
    const lightGray = rgb(0.6, 0.6, 0.6);
    const borderGray = rgb(0.88, 0.88, 0.88);
    const bgLight = rgb(0.98, 0.98, 0.98);

    // ===== HEADER BAR =====
    page.drawRectangle({
      x: 0,
      y: height - 80,
      width: width,
      height: 80,
      color: primaryRed,
    });

    // Company Name in header
    page.drawText(companyName.toUpperCase(), {
      x: margin,
      y: height - 50,
      size: 22,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    // "ESTIMATE" label right side
    page.drawText("ESTIMATE", {
      x: width - margin - 90,
      y: height - 50,
      size: 16,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    cursorY = height - 110;

    // ===== ESTIMATE INFO BAR =====
    page.drawRectangle({
      x: margin,
      y: cursorY - 60,
      width: width - margin * 2,
      height: 60,
      color: bgLight,
      borderColor: borderGray,
      borderWidth: 1,
    });

    const infoY = cursorY - 25;
    const col1X = margin + 20;
    const col2X = margin + 180;
    const col3X = margin + 340;

    // Estimate Number
    page.drawText("ESTIMATE #", { x: col1X, y: infoY, size: 8, font: fontReg, color: lightGray });
    page.drawText(estimate.estimate_number || "—", { x: col1X, y: infoY - 14, size: 11, font: fontBold, color: darkGray });

    // Date Issued
    page.drawText("DATE ISSUED", { x: col2X, y: infoY, size: 8, font: fontReg, color: lightGray });
    page.drawText(formatDate(estimate.created_at), { x: col2X, y: infoY - 14, size: 11, font: fontBold, color: darkGray });

    // Valid Until
    page.drawText("VALID UNTIL", { x: col3X, y: infoY, size: 8, font: fontReg, color: lightGray });
    page.drawText(formatDate(estimate.valid_until) || "30 Days", { x: col3X, y: infoY - 14, size: 11, font: fontBold, color: darkGray });

    cursorY -= 90;

    // ===== TWO COLUMN SECTION =====
    const leftColX = margin;
    const rightColX = width / 2 + 20;

    // PREPARED FOR
    page.drawText("PREPARED FOR", { x: leftColX, y: cursorY, size: 9, font: fontBold, color: primaryRed });
    cursorY -= 18;

    if (estimate.client_name) {
      page.drawText(estimate.client_name, { x: leftColX, y: cursorY, size: 13, font: fontBold, color: darkGray });
      cursorY -= 16;
    }

    let clientInfoY = cursorY;
    if (estimate.client_email) {
      page.drawText(estimate.client_email, { x: leftColX, y: clientInfoY, size: 10, font: fontReg, color: medGray });
      clientInfoY -= 14;
    }
    if (estimate.client_phone) {
      page.drawText(estimate.client_phone, { x: leftColX, y: clientInfoY, size: 10, font: fontReg, color: medGray });
      clientInfoY -= 14;
    }
    if (estimate.client_address) {
      page.drawText(estimate.client_address, { x: leftColX, y: clientInfoY, size: 10, font: fontReg, color: medGray });
      clientInfoY -= 14;
    }

    // PROJECT DETAILS (right column)
    let rightY = cursorY + 18;
    page.drawText("PROJECT DETAILS", { x: rightColX, y: rightY, size: 9, font: fontBold, color: primaryRed });
    rightY -= 18;

    page.drawText(estimate.title || "Project", { x: rightColX, y: rightY, size: 13, font: fontBold, color: darkGray });
    rightY -= 16;

    if (estimate.site_address) {
      page.drawText(estimate.site_address, { x: rightColX, y: rightY, size: 10, font: fontReg, color: medGray });
      rightY -= 14;
    }
    if (estimate.trade_type) {
      page.drawText(`Trade: ${estimate.trade_type}`, { x: rightColX, y: rightY, size: 10, font: fontReg, color: medGray });
      rightY -= 14;
    }

    cursorY = Math.min(clientInfoY, rightY) - 25;

    // ===== PROJECT DESCRIPTION =====
    if (estimate.project_description?.trim()) {
      // Divider
      page.drawLine({
        start: { x: margin, y: cursorY + 5 },
        end: { x: width - margin, y: cursorY + 5 },
        thickness: 1,
        color: borderGray,
      });
      cursorY -= 15;

      page.drawText("PROJECT DESCRIPTION", { x: margin, y: cursorY, size: 9, font: fontBold, color: primaryRed });
      cursorY -= 16;

      const descLines = wrapText(String(estimate.project_description), 95);
      for (const line of descLines.slice(0, 4)) {
        page.drawText(line, { x: margin, y: cursorY, size: 10, font: fontReg, color: medGray });
        cursorY -= 13;
      }
      cursorY -= 10;
    }

    // ===== LINE ITEMS TABLE =====
    // Divider
    page.drawLine({
      start: { x: margin, y: cursorY + 5 },
      end: { x: width - margin, y: cursorY + 5 },
      thickness: 1,
      color: borderGray,
    });
    cursorY -= 15;

    page.drawText("LINE ITEMS", { x: margin, y: cursorY, size: 9, font: fontBold, color: primaryRed });
    cursorY -= 20;

    const tableX = margin;
    const tableWidth = width - margin * 2;

    // Table header background
    page.drawRectangle({
      x: tableX,
      y: cursorY - 22,
      width: tableWidth,
      height: 22,
      color: darkGray,
    });

    // Header text
    page.drawText("DESCRIPTION", { x: tableX + 12, y: cursorY - 15, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("QTY", { x: tableX + tableWidth - 180, y: cursorY - 15, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("RATE", { x: tableX + tableWidth - 120, y: cursorY - 15, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("AMOUNT", { x: tableX + tableWidth - 60, y: cursorY - 15, size: 9, font: fontBold, color: rgb(1, 1, 1) });

    cursorY -= 22;

    // Table rows
    const lineItems = (estimate.line_items || []).filter((li: any) => li?.included !== false);
    let rowIndex = 0;

    for (const item of lineItems) {
      // Check if we need a new page
      if (cursorY < 180) {
        page = pdfDoc.addPage([612, 792]);
        cursorY = 792 - margin;
      }

      // Alternate row background
      if (rowIndex % 2 === 0) {
        page.drawRectangle({
          x: tableX,
          y: cursorY - 24,
          width: tableWidth,
          height: 24,
          color: bgLight,
        });
      }

      const desc = String(item.item_description || "Item").substring(0, 50);
      const qty = String(item.quantity || 1);
      const rate = formatCurrency(item.unit_cost || 0);
      const lineTotal = item.line_total ?? (item.unit_cost || 0) * (item.quantity || 1);

      page.drawText(desc, { x: tableX + 12, y: cursorY - 16, size: 10, font: fontReg, color: darkGray });
      page.drawText(qty, { x: tableX + tableWidth - 180, y: cursorY - 16, size: 10, font: fontReg, color: darkGray });
      page.drawText(rate, { x: tableX + tableWidth - 120, y: cursorY - 16, size: 10, font: fontReg, color: darkGray });
      page.drawText(formatCurrency(lineTotal), { x: tableX + tableWidth - 60, y: cursorY - 16, size: 10, font: fontBold, color: darkGray });

      cursorY -= 24;
      rowIndex++;
    }

    // Table bottom border
    page.drawLine({
      start: { x: tableX, y: cursorY },
      end: { x: tableX + tableWidth, y: cursorY },
      thickness: 2,
      color: darkGray,
    });

    cursorY -= 30;

    // ===== TOTALS SECTION =====
    const totalsWidth = 220;
    const totalsX = width - margin - totalsWidth;
    const cs = estimate.cost_summary || {};

    // Subtotal
    const subtotal = cs.subtotal || estimate.subtotal || 0;
    if (subtotal > 0) {
      page.drawText("Subtotal", { x: totalsX, y: cursorY, size: 10, font: fontReg, color: medGray });
      page.drawText(formatCurrency(subtotal), { x: totalsX + totalsWidth - 80, y: cursorY, size: 10, font: fontReg, color: darkGray });
      cursorY -= 18;
    }

    // Tax
    const taxAmount = cs.tax_and_fees || estimate.tax_amount || 0;
    if (taxAmount > 0) {
      page.drawText("Tax", { x: totalsX, y: cursorY, size: 10, font: fontReg, color: medGray });
      page.drawText(formatCurrency(taxAmount), { x: totalsX + totalsWidth - 80, y: cursorY, size: 10, font: fontReg, color: darkGray });
      cursorY -= 18;
    }

    // Total box
    page.drawRectangle({
      x: totalsX - 10,
      y: cursorY - 35,
      width: totalsWidth + 20,
      height: 40,
      color: primaryRed,
    });

    page.drawText("TOTAL", { x: totalsX, y: cursorY - 22, size: 12, font: fontBold, color: rgb(1, 1, 1) });
    const totalStr = formatCurrency(estimate.total_amount || estimate.grand_total || 0);
    page.drawText(totalStr, { x: totalsX + totalsWidth - 90, y: cursorY - 22, size: 16, font: fontBold, color: rgb(1, 1, 1) });

    cursorY -= 60;

    // Deposit required
    if (estimate.required_deposit) {
      page.drawText(`Deposit Required: ${formatCurrency(estimate.required_deposit)}`, {
        x: totalsX,
        y: cursorY,
        size: 10,
        font: fontBold,
        color: primaryRed,
      });
      cursorY -= 25;
    }

    // ===== CLICKABLE CTA BUTTON =====
    if (includePaymentLink) {
      const buttonW = 260;
      const buttonH = 44;
      const buttonX = (width - buttonW) / 2;
      const buttonY = cursorY - buttonH;

      // Button background
      page.drawRectangle({
        x: buttonX,
        y: buttonY,
        width: buttonW,
        height: buttonH,
        color: primaryRed,
      });

      // Button text
      const buttonText = "VIEW, SIGN & PAY ONLINE";
      page.drawText(buttonText, {
        x: buttonX + 32,
        y: buttonY + 16,
        size: 13,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      // Create clickable link annotation using pdf-lib's proper method
      const linkAnnotation = pdfDoc.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [buttonX, buttonY, buttonX + buttonW, buttonY + buttonH],
        Border: [0, 0, 0],
        A: {
          Type: 'Action',
          S: 'URI',
          URI: publicUrl,
        },
      });
      
      // Get or create annotations array on the page
      const existingAnnots = page.node.get(pdfDoc.context.obj('Annots'));
      if (existingAnnots) {
        (existingAnnots as any).push(linkAnnotation);
      } else {
        page.node.set(pdfDoc.context.obj('Annots'), pdfDoc.context.obj([linkAnnotation]));
      }

      cursorY = buttonY - 20;

      // URL hint
      page.drawText("Click the button above or visit:", {
        x: margin,
        y: cursorY,
        size: 8,
        font: fontReg,
        color: lightGray,
      });
      cursorY -= 12;
      page.drawText(publicUrl, {
        x: margin,
        y: cursorY,
        size: 8,
        font: fontReg,
        color: rgb(0.2, 0.4, 0.8),
      });

      cursorY -= 30;
    }

    // ===== TERMS & CONDITIONS =====
    if (cursorY > 150) {
      page.drawLine({
        start: { x: margin, y: cursorY + 5 },
        end: { x: width - margin, y: cursorY + 5 },
        thickness: 1,
        color: borderGray,
      });
      cursorY -= 15;

      page.drawText("TERMS & CONDITIONS", { x: margin, y: cursorY, size: 9, font: fontBold, color: primaryRed });
      cursorY -= 16;

      const agreementText = "This estimate constitutes a binding agreement between the customer and the contractor. By accepting this proposal, the customer acknowledges that they have read, understood, and agreed to all terms, conditions, and pricing stated herein, and accepts full legal responsibility for payment in accordance with the agreed terms. The contractor provides a minimum two (2) year labor warranty covering workmanship under normal use and conditions; this warranty excludes damage caused by misuse, neglect, alteration, or acts of nature.";
      
      const agreementLines = wrapText(agreementText, 100);
      for (const line of agreementLines.slice(0, 6)) {
        page.drawText(line, { x: margin, y: cursorY, size: 8, font: fontReg, color: medGray });
        cursorY -= 11;
      }
    }

    // ===== FOOTER =====
    const footerY = 35;
    page.drawLine({
      start: { x: margin, y: footerY + 15 },
      end: { x: width - margin, y: footerY + 15 },
      thickness: 1,
      color: borderGray,
    });

    // Footer content
    const footerParts = [companyName];
    if (phone) footerParts.push(phone);
    if (contactEmail) footerParts.push(contactEmail);
    
    page.drawText(footerParts.join("  •  "), {
      x: margin,
      y: footerY,
      size: 8,
      font: fontReg,
      color: lightGray,
    });

    page.drawText("Powered by CT1 Constructeam", {
      x: width - margin - 130,
      y: footerY,
      size: 8,
      font: fontBold,
      color: primaryRed,
    });

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
