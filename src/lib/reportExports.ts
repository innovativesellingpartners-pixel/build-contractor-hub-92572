import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface ReportData {
  title: string;
  dateRange: string;
  sections: {
    title: string;
    data: any[];
    columns?: string[];
  }[];
  summary?: {
    label: string;
    value: string | number;
  }[];
}

export function exportToPDF(reportData: ReportData) {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(reportData.title, 14, 20);
  
  // Add date range
  doc.setFontSize(10);
  doc.text(`Period: ${reportData.dateRange}`, 14, 28);
  
  let yPosition = 35;
  
  // Add summary if exists
  if (reportData.summary && reportData.summary.length > 0) {
    doc.setFontSize(14);
    doc.text("Summary", 14, yPosition);
    yPosition += 7;
    
    const summaryData = reportData.summary.map(item => [item.label, item.value]);
    autoTable(doc, {
      startY: yPosition,
      head: [["Metric", "Value"]],
      body: summaryData,
      theme: "grid",
      headStyles: { fillColor: [66, 139, 202] },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Add sections
  reportData.sections.forEach((section, index) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.text(section.title, 14, yPosition);
    yPosition += 7;
    
    if (section.data.length > 0) {
      const columns = section.columns || Object.keys(section.data[0]);
      const rows = section.data.map(item => 
        columns.map(col => item[col] ?? "")
      );
      
      autoTable(doc, {
        startY: yPosition,
        head: [columns],
        body: rows,
        theme: "striped",
        headStyles: { fillColor: [66, 139, 202] },
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }
  });
  
  // Save the PDF
  doc.save(`${reportData.title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
}

export function exportToExcel(reportData: ReportData) {
  const workbook = XLSX.utils.book_new();
  
  // Create summary sheet if exists
  if (reportData.summary && reportData.summary.length > 0) {
    const summaryData = [
      ["Report", reportData.title],
      ["Period", reportData.dateRange],
      [],
      ["Metric", "Value"],
      ...reportData.summary.map(item => [item.label, item.value])
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
  }
  
  // Create a sheet for each section
  reportData.sections.forEach((section, index) => {
    if (section.data.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(section.data);
      const sheetName = section.title.substring(0, 31); // Excel sheet name limit
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }
  });
  
  // Save the file
  XLSX.writeFile(workbook, `${reportData.title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`);
}

export function generateShareableLink(reportId: string, filters: any): string {
  const params = new URLSearchParams({
    id: reportId,
    filters: JSON.stringify(filters),
    token: Math.random().toString(36).substring(2, 15),
  });
  
  return `${window.location.origin}/reporting?${params.toString()}`;
}