import { useState, useEffect, useRef, useCallback } from 'react';
import { Estimate } from '@/hooks/useEstimates';
import { ContractorProfile } from './types';
import { PDFPageWrapper } from './PDFStyles';
import {
  PDFHeaderSection,
  PDFPartiesSection,
  PDFScopeSection,
  PDFLineItemsSection,
  PDFTotalsSection,
  PDFTermsSection,
  PDFAcceptanceSection,
  PDFCatchAllSection,
  PDFFooterSection,
} from './sections';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Download, Printer, ArrowLeft, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface EstimatePDFPreviewProps {
  estimate: Estimate;
  onClose?: () => void;
  onDownload?: () => void;
}

export function EstimatePDFPreview({ estimate, onClose, onDownload }: EstimatePDFPreviewProps) {
  const [contractor, setContractor] = useState<ContractorProfile>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [scale, setScale] = useState(1);
  const printRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate scale to fit PDF on screen
  const calculateScale = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 32; // Account for padding
      const pdfWidth = 816; // Standard PDF width
      const newScale = Math.min(1, containerWidth / pdfWidth);
      setScale(newScale);
    }
  }, []);

  useEffect(() => {
    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [calculateScale]);

  // Fetch contractor profile
  useEffect(() => {
    const fetchContractor = async () => {
      if (!estimate.user_id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('profiles')
          .select('company_name, contact_name, logo_url, phone, business_address, city, state, zip_code, business_email, website_url, license_number')
          .eq('id', estimate.user_id)
          .single();

        if (data) {
          setContractor(data as ContractorProfile);
        }
      } catch (error) {
        console.error('Failed to fetch contractor profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContractor();
  }, [estimate.user_id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
      return;
    }

    setIsDownloading(true);
    toast.loading('Generating PDF...', { id: 'pdf-download' });

    try {
      const { data, error } = await supabase.functions.invoke('generate-estimate-pdf', {
        body: {
          estimateId: estimate.id,
          includePaymentLink: true,
        },
      });

      if (error) throw error;

      if (data?.pdfBase64) {
        const byteCharacters = atob(data.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        const filename = `Estimate_${estimate.estimate_number || estimate.id}_${estimate.client_name?.replace(/\s+/g, '_')}.pdf`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('PDF downloaded successfully', { id: 'pdf-download' });
      } else {
        throw new Error('PDF generation failed - no PDF data returned');
      }
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF: ' + error.message, { id: 'pdf-download' });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const publicUrl = estimate.public_token 
    ? `${window.location.origin}/estimate/${estimate.public_token}` 
    : undefined;

  // Handle View & Sign action
  const handleViewAndSign = () => {
    if (publicUrl) {
      window.open(publicUrl, '_blank');
    } else {
      toast.error('No public link available. Please send the estimate first.');
    }
  };

  return (
    <div className="h-full flex flex-col bg-muted">
      {/* Action Bar - Hidden when printing */}
      <div className="print:hidden flex-shrink-0 bg-white border-b shadow-sm z-50">
        <div className="max-w-[900px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Estimate
              </Button>
            )}
            <h1 className="text-lg font-semibold text-foreground">
              Estimate Preview
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View & Sign Online Button - Prominent and clickable */}
            {publicUrl && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleViewAndSign}
                className="bg-success hover:bg-success/90"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View & Sign Online
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Preview - Scrollable container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto py-4 px-4 print:p-0 print:bg-white print:overflow-visible"
      >
        <div 
          style={{ 
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            width: scale < 1 ? `${100 / scale}%` : '100%',
          }}
          className="print:!transform-none print:!w-full"
        >
          <PDFPageWrapper className="mb-8" scaleMobile>
            <div ref={printRef}>
              {/* Header */}
              <PDFHeaderSection estimate={estimate} contractor={contractor} />
              
              {/* Parties - Contractor & Client Details */}
              <PDFPartiesSection estimate={estimate} contractor={contractor} />
              
              {/* Scope of Work */}
              <PDFScopeSection estimate={estimate} />
              
              {/* Line Items / Cost Details */}
              <PDFLineItemsSection estimate={estimate} />
              
              {/* Totals Summary */}
              <PDFTotalsSection estimate={estimate} />
              
              {/* Terms & Conditions */}
              <PDFTermsSection estimate={estimate} />
              
              {/* Acceptance / Signatures */}
              <PDFAcceptanceSection estimate={estimate} />
              
              {/* Catch-All for unmapped fields */}
              <PDFCatchAllSection estimate={estimate} />
              
              {/* Footer */}
              <PDFFooterSection 
                contractor={contractor}
                publicUrl={publicUrl}
              />
            </div>
          </PDFPageWrapper>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: letter;
            margin: 0.5in;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:p-0 {
            padding: 0 !important;
          }
          
          .print\\:bg-white {
            background: white !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:max-w-none {
            max-width: none !important;
          }
          
          .print\\:overflow-visible {
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
}
