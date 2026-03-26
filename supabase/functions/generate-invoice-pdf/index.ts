import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

import { buildCorsHeaders } from '../_shared/cors.ts';

interface GeneratePDFRequest {
  invoiceId: string;
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
    
    const response = await fetch(logoUrl);
    if (!response.ok) return null;
    
    const imageBytes = new Uint8Array(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "";
    
    if (contentType.includes("png") || logoUrl.toLowerCase().includes(".png")) {
      return await pdfDoc.embedPng(imageBytes);
    } else if (contentType.includes("jpeg") || contentType.includes("jpg") || 
               logoUrl.toLowerCase().includes(".jpg") || logoUrl.toLowerCase().includes(".jpeg")) {
      return await pdfDoc.embedJpg(imageBytes);
    }
    
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

    const { invoiceId }: GeneratePDFRequest = await req.json();

    // Auth check
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

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) throw new Error("Invoice not found");

    // Check ownership
    if (invoice.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Forbidden - You don't have access to this invoice" }),
        { status: 403, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Fetch related data
    let job = null;
    let customer = null;

    if (invoice.job_id) {
      const { data } = await supabase
        .from("jobs")
        .select("name, job_number, address, city, state, zip_code")
        .eq("id", invoice.job_id)
        .single();
      job = data;
    }

    if (invoice.customer_id) {
      const { data } = await supabase
        .from("customers")
        .select("name, email, phone, address, city, state, zip_code, company")
        .eq("id", invoice.customer_id)
        .single();
      customer = data;
    }

    // Fetch contractor profile for branding
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name, contact_name, logo_url, phone, business_address, city, state, zip_code, business_email, license_number")
      .eq("id", invoice.user_id)
      .single();

    const companyName = profile?.company_name || "Contractor";
    const phone = profile?.phone || "";
    const businessEmail = profile?.business_email || "";
    const licenseNumber = profile?.license_number || "";
    const logoUrl = profile?.logo_url || "";
    
    const addressParts = [profile?.business_address, profile?.city, profile?.state, profile?.zip_code].filter(Boolean);
    const businessAddress = addressParts.join(", ");

    // Build PDF
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([612, 792]); // US Letter
    const { height, width } = page.getSize();

    const margin = 50;
    let cursorY = height - margin;

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Color palette
    const primaryNavy = rgb(0.086, 0.118, 0.173);
    const accentGold = rgb(0.835, 0.624, 0.278);
    const darkText = rgb(0.133, 0.133, 0.133);
    const mediumText = rgb(0.4, 0.4, 0.4);
    const lightText = rgb(0.55, 0.55, 0.55);
    const borderColor = rgb(0.82, 0.82, 0.82);
    const headerBg = rgb(0.96, 0.95, 0.93);
    const white = rgb(1, 1, 1);
    const lightGrayBg = rgb(0.98, 0.98, 0.98);

    // ===== HEADER =====
    const headerHeight = 100;
    page.drawRectangle({
      x: 0,
      y: height - headerHeight,
      width: width,
      height: headerHeight,
      color: primaryNavy,
    });

    let logoImage = null;
    if (logoUrl) {
      logoImage = await fetchAndEmbedLogo(pdfDoc, logoUrl);
    }

    let companyStartX = margin;
    
    if (logoImage) {
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

    page.drawText(companyName.toUpperCase(), {
      x: companyStartX,
      y: height - 40,
      size: 18,
      font: fontBold,
      color: white,
    });

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

    if (businessAddress) {
      page.drawText(businessAddress.substring(0, 60), {
        x: companyStartX,
        y: height - 72,
        size: 9,
        font: fontReg,
        color: rgb(0.75, 0.75, 0.75),
      });
    }

    if (licenseNumber) {
      page.drawText(`License #${licenseNumber}`, {
        x: companyStartX,
        y: height - 86,
        size: 8,
        font: fontReg,
        color: rgb(0.65, 0.65, 0.65),
      });
    }

    // INVOICE badge
    const badgeWidth = 100;
    const badgeHeight = 28;
    page.drawRectangle({
      x: width - margin - badgeWidth,
      y: height - 55,
      width: badgeWidth,
      height: badgeHeight,
      color: accentGold,
    });
    page.drawText("INVOICE", {
      x: width - margin - badgeWidth + 22,
      y: height - 47,
      size: 12,
      font: fontBold,
      color: primaryNavy,
    });

    cursorY = height - headerHeight - 25;

    // ===== INVOICE INFO BAR =====
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

    page.drawText("INVOICE NO.", { x: margin + 12, y: infoLabelY, size: 7, font: fontReg, color: lightText });
    page.drawText(invoice.invoice_number || "—", { x: margin + 12, y: infoValueY, size: 10, font: fontBold, color: darkText });

    page.drawText("STATUS", { x: margin + infoColWidth + 12, y: infoLabelY, size: 7, font: fontReg, color: lightText });
    page.drawText((invoice.status || "draft").toUpperCase(), { x: margin + infoColWidth + 12, y: infoValueY, size: 10, font: fontBold, color: darkText });

    page.drawText("ISSUE DATE", { x: margin + infoColWidth * 2 + 12, y: infoLabelY, size: 7, font: fontReg, color: lightText });
    page.drawText(formatDate(invoice.issue_date), { x: margin + infoColWidth * 2 + 12, y: infoValueY, size: 10, font: fontBold, color: darkText });

    page.drawText("DUE DATE", { x: margin + infoColWidth * 3 + 12, y: infoLabelY, size: 7, font: fontReg, color: lightText });
    page.drawText(formatDate(invoice.due_date) || "—", { x: margin + infoColWidth * 3 + 12, y: infoValueY, size: 10, font: fontBold, color: darkText });

    cursorY -= infoBarHeight + 25;

    // ===== BILL TO & JOB DETAILS =====
    const leftColX = margin;
    const rightColX = width / 2 + 20;
    const detailsStartY = cursorY;

    // BILL TO
    page.drawText("BILL TO", { x: leftColX, y: cursorY, size: 9, font: fontBold, color: accentGold });
    cursorY -= 18;

    if (customer) {
      if (customer.name) {
        page.drawText(customer.name, { x: leftColX, y: cursorY, size: 11, font: fontBold, color: darkText });
        cursorY -= 16;
      }
      if (customer.company) {
        page.drawText(customer.company, { x: leftColX, y: cursorY, size: 9, font: fontReg, color: mediumText });
        cursorY -= 14;
      }
      if (customer.email) {
        page.drawText(customer.email, { x: leftColX, y: cursorY, size: 9, font: fontReg, color: mediumText });
        cursorY -= 14;
      }
      if (customer.phone) {
        page.drawText(customer.phone, { x: leftColX, y: cursorY, size: 9, font: fontReg, color: mediumText });
        cursorY -= 14;
      }
      const custAddress = [customer.address, customer.city, customer.state, customer.zip_code].filter(Boolean).join(", ");
      if (custAddress) {
        const addrLines = wrapText(custAddress, 35);
        for (const line of addrLines.slice(0, 2)) {
          page.drawText(line, { x: leftColX, y: cursorY, size: 9, font: fontReg, color: mediumText });
          cursorY -= 14;
        }
      }
    } else {
      page.drawText("—", { x: leftColX, y: cursorY, size: 9, font: fontReg, color: mediumText });
      cursorY -= 14;
    }

    // JOB DETAILS (right column)
    let rightY = detailsStartY;
    if (job) {
      page.drawText("JOB DETAILS", { x: rightColX, y: rightY, size: 9, font: fontBold, color: accentGold });
      rightY -= 18;

      if (job.name) {
        page.drawText(job.name.substring(0, 30), { x: rightColX, y: rightY, size: 11, font: fontBold, color: darkText });
        rightY -= 16;
      }
      if (job.job_number) {
        page.drawText(`Job #${job.job_number}`, { x: rightColX, y: rightY, size: 9, font: fontReg, color: mediumText });
        rightY -= 14;
      }
      const jobAddress = [job.address, job.city, job.state, job.zip_code].filter(Boolean).join(", ");
      if (jobAddress) {
        const addrLines = wrapText(jobAddress, 35);
        for (const line of addrLines.slice(0, 2)) {
          page.drawText(line, { x: rightColX, y: rightY, size: 9, font: fontReg, color: mediumText });
          rightY -= 14;
        }
      }
    }

    cursorY = Math.min(cursorY, rightY) - 20;

    // ===== LINE ITEMS =====
    const lineItems = (invoice.line_items as any[]) || [];
    
    if (lineItems.length > 0) {
      const sectionHeaderHeight = 24;
      page.drawRectangle({
        x: margin,
        y: cursorY - sectionHeaderHeight,
        width: width - margin * 2,
        height: sectionHeaderHeight,
        color: accentGold,
      });
      page.drawText("LINE ITEMS", { x: margin + 15, y: cursorY - 17, size: 10, font: fontBold, color: primaryNavy });
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
      
      const descColX = tableX + 12;
      const qtyColX = tableX + tableWidth * 0.50;
      const rateColX = tableX + tableWidth * 0.65;
      const amtColX = tableX + tableWidth * 0.82;

      const headerY = cursorY - 17;
      page.drawText("DESCRIPTION", { x: descColX, y: headerY, size: 8, font: fontBold, color: darkText });
      page.drawText("QTY", { x: qtyColX, y: headerY, size: 8, font: fontBold, color: darkText });
      page.drawText("RATE", { x: rateColX, y: headerY, size: 8, font: fontBold, color: darkText });
      page.drawText("AMOUNT", { x: amtColX, y: headerY, size: 8, font: fontBold, color: darkText });

      cursorY -= tableHeaderHeight;

      const rowHeight = 24;

      for (let i = 0; i < lineItems.length; i++) {
        const item = lineItems[i];
        
        if (cursorY < 150) {
          page = pdfDoc.addPage([612, 792]);
          cursorY = 792 - margin;
        }

        if (i % 2 === 0) {
          page.drawRectangle({
            x: tableX,
            y: cursorY - rowHeight,
            width: tableWidth,
            height: rowHeight,
            color: lightGrayBg,
          });
        }

        page.drawLine({
          start: { x: tableX, y: cursorY - rowHeight },
          end: { x: tableX + tableWidth, y: cursorY - rowHeight },
          thickness: 0.5,
          color: borderColor,
        });

        const rowY = cursorY - 16;
        const desc = String(item.description || item.name || "Item").substring(0, 45);
        const qty = String(item.quantity || 1);
        const rate = formatCurrency(item.unit_price || 0);
        const lineTotal = (item.quantity || 1) * (item.unit_price || 0);

        page.drawText(desc, { x: descColX, y: rowY, size: 9, font: fontReg, color: darkText });
        page.drawText(qty, { x: qtyColX, y: rowY, size: 9, font: fontReg, color: darkText });
        page.drawText(rate, { x: rateColX, y: rowY, size: 9, font: fontReg, color: darkText });
        page.drawText(formatCurrency(lineTotal), { x: amtColX, y: rowY, size: 9, font: fontBold, color: darkText });

        cursorY -= rowHeight;
      }

      page.drawLine({
        start: { x: tableX, y: cursorY },
        end: { x: tableX + tableWidth, y: cursorY },
        thickness: 2,
        color: primaryNavy,
      });

      cursorY -= 25;
    }

    // ===== FINANCIAL SUMMARY =====
    const summaryHeaderHeight = 24;
    page.drawRectangle({
      x: margin,
      y: cursorY - summaryHeaderHeight,
      width: width - margin * 2,
      height: summaryHeaderHeight,
      color: accentGold,
    });
    page.drawText("PAYMENT SUMMARY", { x: margin + 15, y: cursorY - 17, size: 10, font: fontBold, color: primaryNavy });
    cursorY -= summaryHeaderHeight;

    const summaryBoxWidth = 220;
    const summaryBoxX = width - margin - summaryBoxWidth;
    const summaryBoxHeight = 90;
    
    page.drawRectangle({
      x: summaryBoxX,
      y: cursorY - summaryBoxHeight,
      width: summaryBoxWidth,
      height: summaryBoxHeight,
      color: headerBg,
      borderColor: borderColor,
      borderWidth: 1,
    });

    const labelX = summaryBoxX + 15;
    const valueX = summaryBoxX + summaryBoxWidth - 15;
    let summaryY = cursorY - 22;

    // Amount Due
    page.drawText("Amount Due:", { x: labelX, y: summaryY, size: 9, font: fontReg, color: mediumText });
    page.drawText(formatCurrency(invoice.amount_due), { x: valueX - 60, y: summaryY, size: 9, font: fontBold, color: darkText });
    summaryY -= 18;

    // Amount Paid
    page.drawText("Amount Paid:", { x: labelX, y: summaryY, size: 9, font: fontReg, color: mediumText });
    page.drawText(formatCurrency(invoice.amount_paid), { x: valueX - 60, y: summaryY, size: 9, font: fontBold, color: darkText });
    summaryY -= 18;

    // Separator line
    page.drawLine({
      start: { x: labelX, y: summaryY + 5 },
      end: { x: valueX, y: summaryY + 5 },
      thickness: 1,
      color: borderColor,
    });
    summaryY -= 12;

    // Balance Due
    const balanceDue = (invoice.amount_due || 0) - (invoice.amount_paid || 0);
    page.drawText("BALANCE DUE:", { x: labelX, y: summaryY, size: 10, font: fontBold, color: primaryNavy });
    page.drawText(formatCurrency(balanceDue), { x: valueX - 70, y: summaryY, size: 12, font: fontBold, color: accentGold });

    cursorY -= summaryBoxHeight + 20;

    // Notes
    if (invoice.notes) {
      page.drawText("NOTES:", { x: margin, y: cursorY, size: 9, font: fontBold, color: darkText });
      cursorY -= 14;
      const noteLines = wrapText(invoice.notes, 80);
      for (const line of noteLines.slice(0, 4)) {
        page.drawText(line, { x: margin, y: cursorY, size: 9, font: fontReg, color: mediumText });
        cursorY -= 14;
      }
    }

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = new Uint8Array(pdfBytes);

    return new Response(pdfBuffer.buffer, {
      headers: {
        ...buildCorsHeaders(req),
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${invoice.invoice_number || invoiceId}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error("PDF generation error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate PDF" }),
      { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
