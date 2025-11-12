import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Share2, Mail, Link, FileSpreadsheet, FileText } from "lucide-react";
import { ReportData, exportToPDF, exportToExcel, generateShareableLink } from "@/lib/reportExports";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReportExportActionsProps {
  reportData: ReportData;
  filters: any;
}

export function ReportExportActions({ reportData, filters }: ReportExportActionsProps) {
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExportPDF = () => {
    try {
      exportToPDF(reportData);
      toast.success("Report exported as PDF");
    } catch (error) {
      toast.error("Failed to export PDF");
      console.error(error);
    }
  };

  const handleExportExcel = () => {
    try {
      exportToExcel(reportData);
      toast.success("Report exported as Excel");
    } catch (error) {
      toast.error("Failed to export Excel");
      console.error(error);
    }
  };

  const handleGenerateLink = () => {
    const link = generateShareableLink(reportData.title, filters);
    setShareLink(link);
    setShowLinkDialog(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success("Link copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleEmailReport = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-report-email", {
        body: {
          email,
          reportData,
          filters,
        },
      });

      if (error) throw error;

      toast.success(`Report sent to ${email}`);
      setShowEmailDialog(false);
      setEmail("");
    } catch (error) {
      toast.error("Failed to send email");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export as Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowEmailDialog(true)}>
              <Mail className="mr-2 h-4 w-4" />
              Email Report
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleGenerateLink}>
              <Link className="mr-2 h-4 w-4" />
              Generate Link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Report</DialogTitle>
            <DialogDescription>
              Send this report to an email address
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="recipient@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEmailReport} disabled={loading}>
              {loading ? "Sending..." : "Send Report"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Report Link</DialogTitle>
            <DialogDescription>
              Copy this link to share the report
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input value={shareLink} readOnly />
              <Button onClick={handleCopyLink}>Copy</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}