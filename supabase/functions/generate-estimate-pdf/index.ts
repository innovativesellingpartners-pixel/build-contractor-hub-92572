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
    const phone = profile?.phone || "";
    const contactEmail = profile?.contact_email || "";
    const businessAddress = [profile?.business_address, profile?.city, profile?.state, profile?.zip_code]
      .filter(Boolean)
      .join(", ");

    const appUrl = Deno.env.get("APP_URL") || "https://myct1.com";
    const publicUrl = `${appUrl}/estimate/${estimate.public_token}`;

    // Build PDF with pdf-lib
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([612, 792]); // US Letter
    const { height, width } = page.getSize();

    const margin = 40;
    let cursorY = height - margin;

    // Fonts
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Premium Color Palette - Deep Navy & Gold
    const primaryNavy = rgb(0.086, 0.118, 0.173);      // #161E2C - Deep navy
    const accentGold = rgb(0.835, 0.624, 0.278);       // #D59F47 - Classic gold
    const darkText = rgb(0.133, 0.133, 0.133);         // #222222
    const mediumText = rgb(0.4, 0.4, 0.4);             // #666666
    const lightText = rgb(0.6, 0.6, 0.6);              // #999999
    const borderColor = rgb(0.85, 0.85, 0.85);         // #D9D9D9
    const headerBg = rgb(0.957, 0.945, 0.922);         // #F4F1EB - Warm cream
    const white = rgb(1, 1, 1);

    // ===== HEADER BAND =====
    page.drawRectangle({
      x: 0,
      y: height - 100,
      width: width,
      height: 100,
      color: primaryNavy,
    });

    // Company Name
    page.drawText(companyName.toUpperCase(), {
      x: margin,
      y: height - 55,
      size: 24,
      font: fontBold,
      color: white,
    });

    // Professional Services tagline
    page.drawText("PROFESSIONAL CONTRACTOR SERVICES", {
      x: margin,
      y: height - 75,
      size: 9,
      font: fontReg,
      color: rgb(0.7, 0.7, 0.7),
    });

    // ESTIMATE label (right side, with gold accent)
    const estimateLabel = "ESTIMATE";
    page.drawRectangle({
      x: width - margin - 120,
      y: height - 70,
      width: 110,
      height: 32,
      color: accentGold,
    });
    page.drawText(estimateLabel, {
      x: width - margin - 95,
      y: height - 60,
      size: 14,
      font: fontBold,
      color: primaryNavy,
    });

    cursorY = height - 130;

    // ===== ESTIMATE INFO BAR =====
    page.drawRectangle({
      x: margin,
      y: cursorY - 55,
      width: width - margin * 2,
      height: 55,
      color: headerBg,
      borderColor: borderColor,
      borderWidth: 0.5,
    });

    const infoY = cursorY - 18;
    const colWidth = (width - margin * 2) / 4;

    // Estimate Number
    page.drawText("REFERENCE NO.", { x: margin + 15, y: infoY, size: 7, font: fontReg, color: lightText });
    page.drawText(estimate.estimate_number || "—", { x: margin + 15, y: infoY - 14, size: 11, font: fontBold, color: darkText });

    // Client Name
    page.drawText("CLIENT NAME", { x: margin + colWidth + 15, y: infoY, size: 7, font: fontReg, color: lightText });
    page.drawText((estimate.client_name || "—").substring(0, 25), { x: margin + colWidth + 15, y: infoY - 14, size: 11, font: fontBold, color: darkText });

    // Date Issued
    page.drawText("DATE ISSUE", { x: margin + colWidth * 2 + 15, y: infoY, size: 7, font: fontReg, color: lightText });
    page.drawText(formatDate(estimate.created_at), { x: margin + colWidth * 2 + 15, y: infoY - 14, size: 11, font: fontBold, color: darkText });

    // Valid Until
    page.drawText("VALID UNTIL", { x: margin + colWidth * 3 + 15, y: infoY, size: 7, font: fontReg, color: lightText });
    page.drawText(formatDate(estimate.valid_until) || "30 Days", { x: margin + colWidth * 3 + 15, y: infoY - 14, size: 11, font: fontBold, color: darkText });

    cursorY -= 80;

    // ===== CLIENT & PROJECT INFO =====
    const leftColX = margin;
    const rightColX = width / 2 + 10;

    // CLIENT DETAILS
    page.drawText("CLIENT DETAILS", { x: leftColX, y: cursorY, size: 8, font: fontBold, color: accentGold });
    cursorY -= 14;

    let clientY = cursorY;
    if (estimate.client_name) {
      page.drawText(estimate.client_name, { x: leftColX, y: clientY, size: 11, font: fontBold, color: darkText });
      clientY -= 14;
    }
    if (estimate.client_email) {
      page.drawText(estimate.client_email, { x: leftColX, y: clientY, size: 9, font: fontReg, color: mediumText });
      clientY -= 12;
    }
    if (estimate.client_phone) {
      page.drawText(estimate.client_phone, { x: leftColX, y: clientY, size: 9, font: fontReg, color: mediumText });
      clientY -= 12;
    }
    if (estimate.client_address) {
      const addrLines = wrapText(estimate.client_address, 40);
      for (const line of addrLines.slice(0, 2)) {
        page.drawText(line, { x: leftColX, y: clientY, size: 9, font: fontReg, color: mediumText });
        clientY -= 12;
      }
    }

    // PROJECT DETAILS (right column)
    let rightY = cursorY + 14;
    page.drawText("PROJECT DETAILS", { x: rightColX, y: rightY, size: 8, font: fontBold, color: accentGold });
    rightY -= 14;

    page.drawText((estimate.title || "Project").substring(0, 35), { x: rightColX, y: rightY, size: 11, font: fontBold, color: darkText });
    rightY -= 14;

    if (estimate.site_address) {
      const siteLines = wrapText(estimate.site_address, 40);
      for (const line of siteLines.slice(0, 2)) {
        page.drawText(line, { x: rightColX, y: rightY, size: 9, font: fontReg, color: mediumText });
        rightY -= 12;
      }
    }
    if (estimate.trade_type) {
      page.drawText(`Trade: ${estimate.trade_type}`, { x: rightColX, y: rightY, size: 9, font: fontReg, color: mediumText });
      rightY -= 12;
    }

    cursorY = Math.min(clientY, rightY) - 20;

    // ===== COST DETAILS SECTION =====
    page.drawRectangle({
      x: margin,
      y: cursorY - 22,
      width: width - margin * 2,
      height: 22,
      color: accentGold,
    });

    page.drawText("COST DETAILS", { x: margin + 12, y: cursorY - 15, size: 10, font: fontBold, color: primaryNavy });
    cursorY -= 22;

    // Table header
    page.drawRectangle({
      x: margin,
      y: cursorY - 24,
      width: width - margin * 2,
      height: 24,
      color: headerBg,
      borderColor: borderColor,
      borderWidth: 0.5,
    });

    const tableX = margin;
    const tableWidth = width - margin * 2;
    const descColWidth = tableWidth * 0.45;
    const qtyColX = tableX + descColWidth;
    const unitColX = qtyColX + 60;
    const rateColX = unitColX + 60;
    const amtColX = tableX + tableWidth - 70;

    page.drawText("DESCRIPTION", { x: tableX + 12, y: cursorY - 16, size: 8, font: fontBold, color: darkText });
    page.drawText("QTY", { x: qtyColX, y: cursorY - 16, size: 8, font: fontBold, color: darkText });
    page.drawText("UNIT", { x: unitColX, y: cursorY - 16, size: 8, font: fontBold, color: darkText });
    page.drawText("RATE", { x: rateColX, y: cursorY - 16, size: 8, font: fontBold, color: darkText });
    page.drawText("AMOUNT", { x: amtColX, y: cursorY - 16, size: 8, font: fontBold, color: darkText });

    cursorY -= 24;

    // Line items
    const lineItems = (estimate.line_items || []).filter((li: any) => li?.included !== false);
    let rowIndex = 0;

    for (const item of lineItems) {
      if (cursorY < 200) {
        page = pdfDoc.addPage([612, 792]);
        cursorY = 792 - margin;
      }

      // Alternating row background
      if (rowIndex % 2 === 0) {
        page.drawRectangle({
          x: tableX,
          y: cursorY - 22,
          width: tableWidth,
          height: 22,
          color: rgb(0.98, 0.98, 0.98),
        });
      }

      // Row border
      page.drawLine({
        start: { x: tableX, y: cursorY - 22 },
        end: { x: tableX + tableWidth, y: cursorY - 22 },
        thickness: 0.5,
        color: borderColor,
      });

      const desc = String(item.item_description || "Item").substring(0, 45);
      const qty = String(item.quantity || 1);
      const unit = String(item.unit || "Each").substring(0, 8);
      const rate = formatCurrency(item.unit_cost || 0);
      const lineTotal = item.line_total ?? (item.unit_cost || 0) * (item.quantity || 1);

      page.drawText(desc, { x: tableX + 12, y: cursorY - 15, size: 9, font: fontReg, color: darkText });
      page.drawText(qty, { x: qtyColX, y: cursorY - 15, size: 9, font: fontReg, color: darkText });
      page.drawText(unit, { x: unitColX, y: cursorY - 15, size: 9, font: fontReg, color: darkText });
      page.drawText(rate, { x: rateColX, y: cursorY - 15, size: 9, font: fontReg, color: darkText });
      page.drawText(formatCurrency(lineTotal), { x: amtColX, y: cursorY - 15, size: 9, font: fontBold, color: darkText });

      cursorY -= 22;
      rowIndex++;
    }

    // Table bottom border
    page.drawLine({
      start: { x: tableX, y: cursorY },
      end: { x: tableX + tableWidth, y: cursorY },
      thickness: 1.5,
      color: primaryNavy,
    });

    cursorY -= 25;

    // ===== ESTIMATE SUMMARY =====
    page.drawRectangle({
      x: margin,
      y: cursorY - 22,
      width: width - margin * 2,
      height: 22,
      color: accentGold,
    });

    page.drawText("ESTIMATE SUMMARY", { x: margin + 12, y: cursorY - 15, size: 10, font: fontBold, color: primaryNavy });
    cursorY -= 22;

    const summaryX = width / 2;
    const summaryWidth = width / 2 - margin;
    const cs = estimate.cost_summary || {};

    // Summary box
    page.drawRectangle({
      x: summaryX,
      y: cursorY - 100,
      width: summaryWidth,
      height: 100,
      color: headerBg,
      borderColor: borderColor,
      borderWidth: 0.5,
    });

    let summaryY = cursorY - 18;

    // Subtotal
    const subtotal = cs.subtotal || estimate.subtotal || lineItems.reduce((sum: number, li: any) => {
      return sum + ((li.line_total ?? (li.unit_cost || 0) * (li.quantity || 1)) || 0);
    }, 0);

    page.drawText("Subtotal", { x: summaryX + 15, y: summaryY, size: 9, font: fontReg, color: mediumText });
    page.drawText(formatCurrency(subtotal), { x: summaryX + summaryWidth - 80, y: summaryY, size: 9, font: fontReg, color: darkText });
    summaryY -= 16;

    // Tax
    const taxAmount = cs.tax_and_fees || estimate.tax_amount || 0;
    const taxRate = estimate.sales_tax_rate_percent || estimate.tax_rate || 0;
    if (taxAmount > 0 || taxRate > 0) {
      page.drawText(`Sales Tax (${taxRate}%)`, { x: summaryX + 15, y: summaryY, size: 9, font: fontReg, color: mediumText });
      page.drawText(formatCurrency(taxAmount), { x: summaryX + summaryWidth - 80, y: summaryY, size: 9, font: fontReg, color: darkText });
      summaryY -= 16;
    }

    // Permit fee if any
    if (estimate.permit_fee && estimate.permit_fee > 0) {
      page.drawText("Permit Fee", { x: summaryX + 15, y: summaryY, size: 9, font: fontReg, color: mediumText });
      page.drawText(formatCurrency(estimate.permit_fee), { x: summaryX + summaryWidth - 80, y: summaryY, size: 9, font: fontReg, color: darkText });
      summaryY -= 16;
    }

    // Divider line before total
    page.drawLine({
      start: { x: summaryX + 15, y: summaryY + 6 },
      end: { x: summaryX + summaryWidth - 15, y: summaryY + 6 },
      thickness: 1,
      color: primaryNavy,
    });

    // Total
    const totalAmount = estimate.total_amount || estimate.grand_total || subtotal + taxAmount;
    page.drawText("TOTAL AMOUNT DUE", { x: summaryX + 15, y: summaryY - 8, size: 10, font: fontBold, color: primaryNavy });
    page.drawText(formatCurrency(totalAmount), { x: summaryX + summaryWidth - 90, y: summaryY - 8, size: 12, font: fontBold, color: primaryNavy });

    // Deposit required (left side)
    if (estimate.required_deposit && estimate.required_deposit > 0) {
      page.drawText("DEPOSIT REQUIRED", { x: margin, y: cursorY - 30, size: 9, font: fontBold, color: accentGold });
      page.drawText(formatCurrency(estimate.required_deposit), { x: margin, y: cursorY - 45, size: 14, font: fontBold, color: primaryNavy });
      
      if (estimate.required_deposit_percent) {
        page.drawText(`(${estimate.required_deposit_percent}% of total)`, { x: margin, y: cursorY - 60, size: 8, font: fontReg, color: mediumText });
      }
    }

    cursorY -= 120;

    // ===== NOTE/REMARKS =====
    page.drawText("NOTE:", { x: margin, y: cursorY, size: 8, font: fontBold, color: darkText });
    cursorY -= 12;

    const noteText = estimate.assumptions_and_exclusions || 
      `This estimate is valid for ${estimate.valid_until ? formatDate(estimate.valid_until) : '30 days'} from date of issue. We cannot guarantee that the price of labor or materials will stay the same. We provide excellent service at competitive prices.`;
    
    const noteLines = wrapText(noteText, 100);
    for (const line of noteLines.slice(0, 3)) {
      page.drawText(line, { x: margin, y: cursorY, size: 8, font: fontReg, color: mediumText });
      cursorY -= 11;
    }

    cursorY -= 15;

    // ===== CTA BUTTON =====
    if (includePaymentLink && cursorY > 120) {
      const buttonW = 240;
      const buttonH = 38;
      const buttonX = (width - buttonW) / 2;
      const buttonY = cursorY - buttonH;

      page.drawRectangle({
        x: buttonX,
        y: buttonY,
        width: buttonW,
        height: buttonH,
        color: accentGold,
      });

      page.drawText("VIEW, SIGN & PAY ONLINE", {
        x: buttonX + 38,
        y: buttonY + 14,
        size: 11,
        font: fontBold,
        color: primaryNavy,
      });

      // Link annotation
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
      
      const existingAnnots = page.node.get(pdfDoc.context.obj('Annots'));
      if (existingAnnots) {
        (existingAnnots as any).push(linkAnnotation);
      } else {
        page.node.set(pdfDoc.context.obj('Annots'), pdfDoc.context.obj([linkAnnotation]));
      }

      cursorY = buttonY - 15;

      page.drawText(publicUrl, {
        x: margin,
        y: cursorY,
        size: 7,
        font: fontReg,
        color: lightText,
      });

      cursorY -= 20;
    }

    // ===== SIGNATURE SECTION =====
    if (cursorY > 80) {
      page.drawLine({
        start: { x: margin, y: cursorY },
        end: { x: width - margin, y: cursorY },
        thickness: 0.5,
        color: borderColor,
      });
      cursorY -= 25;

      // Prepared By
      page.drawLine({
        start: { x: margin, y: cursorY },
        end: { x: margin + 180, y: cursorY },
        thickness: 0.5,
        color: darkText,
      });
      page.drawText("PREPARED BY", { x: margin, y: cursorY - 12, size: 7, font: fontReg, color: lightText });

      // Signature
      page.drawLine({
        start: { x: margin + 210, y: cursorY },
        end: { x: margin + 390, y: cursorY },
        thickness: 0.5,
        color: darkText,
      });
      page.drawText("SIGNATURE", { x: margin + 210, y: cursorY - 12, size: 7, font: fontReg, color: lightText });

      // Date
      page.drawLine({
        start: { x: margin + 420, y: cursorY },
        end: { x: width - margin, y: cursorY },
        thickness: 0.5,
        color: darkText,
      });
      page.drawText("DATE", { x: margin + 420, y: cursorY - 12, size: 7, font: fontReg, color: lightText });
    }

    // ===== FOOTER =====
    const footerY = 25;
    page.drawLine({
      start: { x: margin, y: footerY + 12 },
      end: { x: width - margin, y: footerY + 12 },
      thickness: 0.5,
      color: borderColor,
    });

    const footerParts = [];
    if (businessAddress) footerParts.push(businessAddress);
    if (phone) footerParts.push(phone);
    if (contactEmail) footerParts.push(contactEmail);
    
    const footerText = footerParts.join("  |  ");
    page.drawText(footerText.substring(0, 100), {
      x: margin,
      y: footerY,
      size: 7,
      font: fontReg,
      color: lightText,
    });

    // Serialize and return
    const pdfBytes = await pdfDoc.save();
    const base64 = btoa(String.fromCharCode(...pdfBytes));

    return new Response(
      JSON.stringify({
        pdfBase64: base64,
        pdfSize: pdfBytes.length,
        publicUrl,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("PDF generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);