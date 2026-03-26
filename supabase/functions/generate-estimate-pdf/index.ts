import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

import { buildCorsHeaders } from '../_shared/cors.ts';

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
  if (!text) return [];
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

async function fetchAndEmbedLogo(pdfDoc: any, logoUrl: string): Promise<any | null> {
  try {
    if (!logoUrl) return null;
    
    console.log("Fetching logo from:", logoUrl);
    const response = await fetch(logoUrl);
    if (!response.ok) {
      console.log("Logo fetch failed:", response.status);
      return null;
    }
    
    const imageBytes = new Uint8Array(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "";
    
    console.log("Logo content type:", contentType, "size:", imageBytes.length);
    
    if (contentType.includes("png") || logoUrl.toLowerCase().includes(".png")) {
      return await pdfDoc.embedPng(imageBytes);
    } else if (contentType.includes("jpeg") || contentType.includes("jpg") || 
               logoUrl.toLowerCase().includes(".jpg") || logoUrl.toLowerCase().includes(".jpeg")) {
      return await pdfDoc.embedJpg(imageBytes);
    }
    
    // Try PNG first, then JPG
    try {
      return await pdfDoc.embedPng(imageBytes);
    } catch {
      return await pdfDoc.embedJpg(imageBytes);
    }
  } catch (error) {
    console.error("Logo embedding error:", error);
    return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
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
          { status: 401, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized - Invalid token" }),
          { status: 401, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
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
          { status: 403, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
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

    // Fetch contractor profile for branding (including brand colors)
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name, contact_name, logo_url, phone, business_address, city, state, zip_code, business_email, website_url, license_number, brand_primary_color, brand_secondary_color, brand_accent_color")
      .eq("id", estimate.user_id)
      .single();

    console.log("Contractor profile for PDF:", profile);

    const companyName = profile?.company_name || "Contractor";
    const contactName = profile?.contact_name || "";
    const phone = profile?.phone || "";
    const businessEmail = profile?.business_email || "";
    const websiteUrl = profile?.website_url || "";
    const licenseNumber = profile?.license_number || "";
    const logoUrl = profile?.logo_url || "";
    
    const addressParts = [profile?.business_address, profile?.city, profile?.state, profile?.zip_code].filter(Boolean);
    const businessAddress = addressParts.join(", ");

    // Use the Lovable published URL as fallback to avoid SSL issues with custom domains
    const appUrl = Deno.env.get("APP_URL") || "https://build-contractor-hub-92572.lovable.app";
    const publicUrl = `${appUrl}/estimate/${estimate.public_token}`;

    // Build PDF with pdf-lib
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([612, 792]); // US Letter
    const { height, width } = page.getSize();

    const margin = 50;
    let cursorY = height - margin;

    // Fonts
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Helper to convert hex color to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
      } : { r: 0.086, g: 0.118, b: 0.173 }; // fallback to navy
    };

    // Use contractor brand colors or fallback to defaults
    const primaryHex = profile?.brand_primary_color || '#D50A22';
    const secondaryHex = profile?.brand_secondary_color || '#1e3a5f';
    const accentHex = profile?.brand_accent_color || '#c9a227';
    
    const primaryRgb = hexToRgb(primaryHex);
    const secondaryRgb = hexToRgb(secondaryHex);
    const accentRgb = hexToRgb(accentHex);

    // Premium Color Palette - using contractor brand colors
    const primaryNavy = rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);      // Secondary for headers
    const accentGold = rgb(accentRgb.r, accentRgb.g, accentRgb.b);               // Accent color
    const primaryColor = rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b);          // Primary brand color
    const darkText = rgb(0.133, 0.133, 0.133);
    const mediumText = rgb(0.4, 0.4, 0.4);
    const lightText = rgb(0.55, 0.55, 0.55);
    const borderColor = rgb(0.82, 0.82, 0.82);
    const headerBg = rgb(0.96, 0.95, 0.93);
    const white = rgb(1, 1, 1);
    const lightGrayBg = rgb(0.98, 0.98, 0.98);

    // ===== HEADER SECTION =====
    const headerHeight = 100;
    page.drawRectangle({
      x: 0,
      y: height - headerHeight,
      width: width,
      height: headerHeight,
      color: primaryNavy,
    });

    // Embed logo if available
    let logoImage = null;
    if (logoUrl) {
      logoImage = await fetchAndEmbedLogo(pdfDoc, logoUrl);
    }

    let companyStartX = margin;
    
    if (logoImage) {
      // Draw logo on left side
      const logoMaxHeight = 60;
      const logoMaxWidth = 80;
      const logoDims = logoImage.scale(1);
      const logoScale = Math.min(logoMaxWidth / logoDims.width, logoMaxHeight / logoDims.height);
      const logoWidth = logoDims.width * logoScale;
      const logoHeight = logoDims.height * logoScale;
      
      page.drawImage(logoImage, {
        x: margin,
        y: height - headerHeight + (headerHeight - logoHeight) / 2,
        width: logoWidth,
        height: logoHeight,
      });
      
      companyStartX = margin + logoWidth + 15;
    }

    // Company Name
    page.drawText(companyName.toUpperCase(), {
      x: companyStartX,
      y: height - 40,
      size: 18,
      font: fontBold,
      color: white,
    });

    // Contact info line 1: Phone & Email
    const contactLine1Parts = [];
    if (phone) contactLine1Parts.push(phone);
    if (businessEmail) contactLine1Parts.push(businessEmail);
    const contactLine1 = contactLine1Parts.join("  •  ");
    
    if (contactLine1) {
      page.drawText(contactLine1, {
        x: companyStartX,
        y: height - 58,
        size: 9,
        font: fontReg,
        color: rgb(0.85, 0.85, 0.85),
      });
    }

    // Contact info line 2: Address
    if (businessAddress) {
      page.drawText(businessAddress.substring(0, 60), {
        x: companyStartX,
        y: height - 72,
        size: 9,
        font: fontReg,
        color: rgb(0.75, 0.75, 0.75),
      });
    }

    // License number
    if (licenseNumber) {
      page.drawText(`License #${licenseNumber}`, {
        x: companyStartX,
        y: height - 86,
        size: 8,
        font: fontReg,
        color: rgb(0.65, 0.65, 0.65),
      });
    }

    // ESTIMATE badge (right side)
    const badgeWidth = 100;
    const badgeHeight = 28;
    page.drawRectangle({
      x: width - margin - badgeWidth,
      y: height - 55,
      width: badgeWidth,
      height: badgeHeight,
      color: accentGold,
    });
    page.drawText("ESTIMATE", {
      x: width - margin - badgeWidth + 18,
      y: height - 47,
      size: 12,
      font: fontBold,
      color: primaryNavy,
    });

    cursorY = height - headerHeight - 25;

    // ===== ESTIMATE INFO BAR =====
    const infoBarHeight = 50;
    page.drawRectangle({
      x: margin,
      y: cursorY - infoBarHeight,
      width: width - margin * 2,
      height: infoBarHeight,
      color: headerBg,
      borderColor: borderColor,
      borderWidth: 1,
    });

    const infoColWidth = (width - margin * 2) / 4;
    const infoLabelY = cursorY - 18;
    const infoValueY = cursorY - 35;

    // Reference No
    page.drawText("REFERENCE NO.", { x: margin + 12, y: infoLabelY, size: 7, font: fontReg, color: lightText });
    page.drawText(estimate.estimate_number || "—", { x: margin + 12, y: infoValueY, size: 10, font: fontBold, color: darkText });

    // Client Name
    page.drawText("CLIENT", { x: margin + infoColWidth + 12, y: infoLabelY, size: 7, font: fontReg, color: lightText });
    page.drawText((estimate.client_name || "—").substring(0, 20), { x: margin + infoColWidth + 12, y: infoValueY, size: 10, font: fontBold, color: darkText });

    // Date Issued
    page.drawText("DATE ISSUED", { x: margin + infoColWidth * 2 + 12, y: infoLabelY, size: 7, font: fontReg, color: lightText });
    page.drawText(formatDate(estimate.created_at) || "—", { x: margin + infoColWidth * 2 + 12, y: infoValueY, size: 10, font: fontBold, color: darkText });

    // Valid Until
    page.drawText("VALID UNTIL", { x: margin + infoColWidth * 3 + 12, y: infoLabelY, size: 7, font: fontReg, color: lightText });
    page.drawText(formatDate(estimate.valid_until) || "30 Days", { x: margin + infoColWidth * 3 + 12, y: infoValueY, size: 10, font: fontBold, color: darkText });

    cursorY -= infoBarHeight + 25;

    // ===== CLIENT & PROJECT DETAILS =====
    const leftColX = margin;
    const rightColX = width / 2 + 20;
    const detailsStartY = cursorY;

    // CLIENT DETAILS
    page.drawText("CLIENT DETAILS", { x: leftColX, y: cursorY, size: 9, font: fontBold, color: accentGold });
    cursorY -= 18;

    if (estimate.client_name) {
      page.drawText(estimate.client_name, { x: leftColX, y: cursorY, size: 11, font: fontBold, color: darkText });
      cursorY -= 16;
    }
    if (estimate.client_email) {
      page.drawText(estimate.client_email, { x: leftColX, y: cursorY, size: 9, font: fontReg, color: mediumText });
      cursorY -= 14;
    }
    if (estimate.client_phone) {
      page.drawText(estimate.client_phone, { x: leftColX, y: cursorY, size: 9, font: fontReg, color: mediumText });
      cursorY -= 14;
    }
    if (estimate.client_address) {
      const addrLines = wrapText(estimate.client_address, 35);
      for (const line of addrLines.slice(0, 2)) {
        page.drawText(line, { x: leftColX, y: cursorY, size: 9, font: fontReg, color: mediumText });
        cursorY -= 14;
      }
    }

    // PROJECT DETAILS (right column)
    let rightY = detailsStartY;
    page.drawText("PROJECT DETAILS", { x: rightColX, y: rightY, size: 9, font: fontBold, color: accentGold });
    rightY -= 18;

    if (estimate.title) {
      page.drawText(estimate.title.substring(0, 30), { x: rightColX, y: rightY, size: 11, font: fontBold, color: darkText });
      rightY -= 16;
    }
    if (estimate.site_address) {
      const siteLines = wrapText(estimate.site_address, 35);
      for (const line of siteLines.slice(0, 2)) {
        page.drawText(line, { x: rightColX, y: rightY, size: 9, font: fontReg, color: mediumText });
        rightY -= 14;
      }
    }
    if (estimate.trade_type) {
      page.drawText(`Trade: ${estimate.trade_type}`, { x: rightColX, y: rightY, size: 9, font: fontReg, color: mediumText });
      rightY -= 14;
    }

    cursorY = Math.min(cursorY, rightY) - 20;

    // ===== COST DETAILS SECTION =====
    const sectionHeaderHeight = 24;
    page.drawRectangle({
      x: margin,
      y: cursorY - sectionHeaderHeight,
      width: width - margin * 2,
      height: sectionHeaderHeight,
      color: accentGold,
    });
    page.drawText("COST DETAILS", { x: margin + 15, y: cursorY - 17, size: 10, font: fontBold, color: primaryNavy });
    cursorY -= sectionHeaderHeight;

    // Table header
    const tableHeaderHeight = 26;
    page.drawRectangle({
      x: margin,
      y: cursorY - tableHeaderHeight,
      width: width - margin * 2,
      height: tableHeaderHeight,
      color: headerBg,
      borderColor: borderColor,
      borderWidth: 0.5,
    });

    const tableX = margin;
    const tableWidth = width - margin * 2;
    
    // Column positions - properly spaced
    const descColX = tableX + 12;
    const qtyColX = tableX + tableWidth * 0.50;
    const unitColX = tableX + tableWidth * 0.58;
    const rateColX = tableX + tableWidth * 0.70;
    const amtColX = tableX + tableWidth * 0.85;

    const headerY = cursorY - 17;
    page.drawText("DESCRIPTION", { x: descColX, y: headerY, size: 8, font: fontBold, color: darkText });
    page.drawText("QTY", { x: qtyColX, y: headerY, size: 8, font: fontBold, color: darkText });
    page.drawText("UNIT", { x: unitColX, y: headerY, size: 8, font: fontBold, color: darkText });
    page.drawText("RATE", { x: rateColX, y: headerY, size: 8, font: fontBold, color: darkText });
    page.drawText("AMOUNT", { x: amtColX, y: headerY, size: 8, font: fontBold, color: darkText });

    cursorY -= tableHeaderHeight;

    // Line items
    const lineItems = (estimate.line_items || []).filter((li: any) => li?.included !== false);
    const rowHeight = 24;

    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      
      // Check for page break
      if (cursorY < 180) {
        page = pdfDoc.addPage([612, 792]);
        cursorY = 792 - margin;
      }

      // Alternating row background
      if (i % 2 === 0) {
        page.drawRectangle({
          x: tableX,
          y: cursorY - rowHeight,
          width: tableWidth,
          height: rowHeight,
          color: lightGrayBg,
        });
      }

      // Row border
      page.drawLine({
        start: { x: tableX, y: cursorY - rowHeight },
        end: { x: tableX + tableWidth, y: cursorY - rowHeight },
        thickness: 0.5,
        color: borderColor,
      });

      const rowY = cursorY - 16;
      const desc = String(item.item_description || "Item").substring(0, 40);
      const qty = String(item.quantity || 1);
      const unit = String(item.unit || "Each").substring(0, 6);
      const rate = formatCurrency(item.unit_cost || 0);
      const lineTotal = item.line_total ?? (item.unit_cost || 0) * (item.quantity || 1);

      page.drawText(desc, { x: descColX, y: rowY, size: 9, font: fontReg, color: darkText });
      page.drawText(qty, { x: qtyColX, y: rowY, size: 9, font: fontReg, color: darkText });
      page.drawText(unit, { x: unitColX, y: rowY, size: 9, font: fontReg, color: darkText });
      page.drawText(rate, { x: rateColX, y: rowY, size: 9, font: fontReg, color: darkText });
      page.drawText(formatCurrency(lineTotal), { x: amtColX, y: rowY, size: 9, font: fontBold, color: darkText });

      cursorY -= rowHeight;
    }

    // Table bottom border
    page.drawLine({
      start: { x: tableX, y: cursorY },
      end: { x: tableX + tableWidth, y: cursorY },
      thickness: 2,
      color: primaryNavy,
    });

    cursorY -= 30;

    // ===== ESTIMATE SUMMARY =====
    page.drawRectangle({
      x: margin,
      y: cursorY - sectionHeaderHeight,
      width: width - margin * 2,
      height: sectionHeaderHeight,
      color: accentGold,
    });
    page.drawText("ESTIMATE SUMMARY", { x: margin + 15, y: cursorY - 17, size: 10, font: fontBold, color: primaryNavy });
    cursorY -= sectionHeaderHeight;

    // Summary box on right side
    const summaryBoxWidth = 220;
    const summaryBoxX = width - margin - summaryBoxWidth;
    const summaryBoxHeight = 110;
    
    page.drawRectangle({
      x: summaryBoxX,
      y: cursorY - summaryBoxHeight,
      width: summaryBoxWidth,
      height: summaryBoxHeight,
      color: headerBg,
      borderColor: borderColor,
      borderWidth: 1,
    });

    const cs = estimate.cost_summary || {};
    let summaryY = cursorY - 22;
    const summaryLabelX = summaryBoxX + 15;
    const summaryValueX = summaryBoxX + summaryBoxWidth - 15;

    // Subtotal
    const subtotal = cs.subtotal || estimate.subtotal || lineItems.reduce((sum: number, li: any) => {
      return sum + ((li.line_total ?? (li.unit_cost || 0) * (li.quantity || 1)) || 0);
    }, 0);

    page.drawText("Subtotal", { x: summaryLabelX, y: summaryY, size: 9, font: fontReg, color: mediumText });
    const subtotalText = formatCurrency(subtotal);
    const subtotalWidth = fontReg.widthOfTextAtSize(subtotalText, 9);
    page.drawText(subtotalText, { x: summaryValueX - subtotalWidth, y: summaryY, size: 9, font: fontReg, color: darkText });
    summaryY -= 18;

    // Tax
    const taxAmount = cs.tax_and_fees || estimate.tax_amount || 0;
    const taxRate = estimate.sales_tax_rate_percent || estimate.tax_rate || 0;
    if (taxAmount > 0 || taxRate > 0) {
      const taxLabel = `Sales Tax (${taxRate}%)`;
      page.drawText(taxLabel, { x: summaryLabelX, y: summaryY, size: 9, font: fontReg, color: mediumText });
      const taxText = formatCurrency(taxAmount);
      const taxWidth = fontReg.widthOfTextAtSize(taxText, 9);
      page.drawText(taxText, { x: summaryValueX - taxWidth, y: summaryY, size: 9, font: fontReg, color: darkText });
      summaryY -= 18;
    }

    // Permit fee
    if (estimate.permit_fee && estimate.permit_fee > 0) {
      page.drawText("Permit Fee", { x: summaryLabelX, y: summaryY, size: 9, font: fontReg, color: mediumText });
      const permitText = formatCurrency(estimate.permit_fee);
      const permitWidth = fontReg.widthOfTextAtSize(permitText, 9);
      page.drawText(permitText, { x: summaryValueX - permitWidth, y: summaryY, size: 9, font: fontReg, color: darkText });
      summaryY -= 18;
    }

    // Divider line
    page.drawLine({
      start: { x: summaryLabelX, y: summaryY + 8 },
      end: { x: summaryValueX, y: summaryY + 8 },
      thickness: 1,
      color: primaryNavy,
    });

    // Total
    const totalAmount = estimate.total_amount || estimate.grand_total || subtotal + taxAmount;
    page.drawText("TOTAL DUE", { x: summaryLabelX, y: summaryY - 8, size: 10, font: fontBold, color: primaryNavy });
    const totalText = formatCurrency(totalAmount);
    const totalWidth = fontBold.widthOfTextAtSize(totalText, 12);
    page.drawText(totalText, { x: summaryValueX - totalWidth, y: summaryY - 8, size: 12, font: fontBold, color: primaryNavy });

    // Deposit info (left side of summary)
    if (estimate.required_deposit && estimate.required_deposit > 0) {
      const depositY = cursorY - 30;
      page.drawText("DEPOSIT REQUIRED", { x: margin, y: depositY, size: 9, font: fontBold, color: accentGold });
      page.drawText(formatCurrency(estimate.required_deposit), { x: margin, y: depositY - 18, size: 14, font: fontBold, color: primaryNavy });
      if (estimate.required_deposit_percent) {
        page.drawText(`(${estimate.required_deposit_percent}% of total)`, { x: margin, y: depositY - 34, size: 8, font: fontReg, color: mediumText });
      }
    }

    cursorY -= summaryBoxHeight + 20;

    // ===== NOTES SECTION =====
    if (cursorY > 150 && estimate.assumptions_and_exclusions) {
      page.drawText("NOTES & TERMS", { x: margin, y: cursorY, size: 9, font: fontBold, color: darkText });
      cursorY -= 14;

      const noteLines = wrapText(estimate.assumptions_and_exclusions, 90);
      for (const line of noteLines.slice(0, 4)) {
        page.drawText(line, { x: margin, y: cursorY, size: 8, font: fontReg, color: mediumText });
        cursorY -= 12;
      }
      cursorY -= 10;
    }

    // ===== ONLINE CTA BUTTON =====
    if (includePaymentLink && cursorY > 100) {
      const buttonW = 200;
      const buttonH = 35;
      const buttonX = (width - buttonW) / 2;
      const buttonY = cursorY - buttonH;

      page.drawRectangle({
        x: buttonX,
        y: buttonY,
        width: buttonW,
        height: buttonH,
        color: accentGold,
      });

      page.drawText("VIEW & SIGN ONLINE", {
        x: buttonX + 35,
        y: buttonY + 12,
        size: 11,
        font: fontBold,
        color: primaryNavy,
      });

      // Link annotation
      try {
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
      } catch (e) {
        console.log("Link annotation error:", e);
      }

      cursorY = buttonY - 20;
      page.drawText(publicUrl, { x: margin, y: cursorY, size: 7, font: fontReg, color: lightText });
    }

    // ===== FOOTER =====
    const footerY = 30;
    page.drawLine({
      start: { x: margin, y: footerY + 15 },
      end: { x: width - margin, y: footerY + 15 },
      thickness: 0.5,
      color: borderColor,
    });

    const footerParts = [];
    if (companyName) footerParts.push(companyName);
    if (phone) footerParts.push(phone);
    if (businessEmail) footerParts.push(businessEmail);
    
    const footerText = footerParts.join("  •  ");
    page.drawText(footerText.substring(0, 80), {
      x: margin,
      y: footerY,
      size: 8,
      font: fontReg,
      color: lightText,
    });

    // Serialize and return
    const pdfBytes = await pdfDoc.save();
    
    // Chunked base64 encoding to prevent stack overflow for large PDFs
    function uint8ArrayToBase64(bytes: Uint8Array): string {
      const CHUNK_SIZE = 8192;
      let binaryString = '';
      for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      return btoa(binaryString);
    }
    
    const base64 = uint8ArrayToBase64(pdfBytes);

    return new Response(
      JSON.stringify({
        pdfBase64: base64,
        pdfSize: pdfBytes.length,
        publicUrl,
      }),
      { status: 200, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("PDF generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
