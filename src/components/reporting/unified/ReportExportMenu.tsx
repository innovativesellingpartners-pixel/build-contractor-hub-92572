/**
 * ReportExportMenu — Compact export button for CSV/PDF export on any report view.
 */

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  disabled?: boolean;
}

export function ReportExportMenu({ onExportCSV, onExportPDF, disabled }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="h-9 text-sm">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover">
        <DropdownMenuItem
          onClick={() => {
            onExportCSV?.();
            toast.success("Exported as CSV");
          }}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" /> CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            onExportPDF?.();
            toast.success("Exported as PDF");
          }}
        >
          <FileText className="mr-2 h-4 w-4" /> PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
