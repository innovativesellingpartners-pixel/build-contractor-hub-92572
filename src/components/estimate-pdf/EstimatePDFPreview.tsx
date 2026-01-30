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
import { Download, Printer, ArrowLeft, Loader2, ExternalLink, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  const [userScale, setUserScale] = useState(1); // User-controlled zoom
  const [fitMode, setFitMode] = useState<'width' | 'page' | 'custom'>('width');
  const printRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate base scale to fit PDF on screen
  const calculateBaseScale = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 32;
      const containerHeight = containerRef.current.clientHeight - 32;
      const pdfWidth = 816;
      const pdfHeight = 1056; // Approximate letter size height

      if (fitMode === 'width') {
        return Math.min(1, containerWidth / pdfWidth);
      } else if (fitMode === 'page') {
        const widthScale = containerWidth / pdfWidth;
        const heightScale = containerHeight / pdfHeight;
        return Math.min(widthScale, heightScale, 1);
      }
      return 1;
    }
    return 1;
  }, [fitMode]);

  useEffect(() => {
    const newBaseScale = calculateBaseScale();
    setScale(newBaseScale);
    window.addEventListener('resize', () => setScale(calculateBaseScale()));
    return () => window.removeEventListener('resize', () => setScale(calculateBaseScale()));
  }, [calculateBaseScale]);

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

  // Zoom controls
  const zoomIn = useCallback(() => {
    setUserScale(prev => Math.min(prev + 0.25, 3));
    setFitMode('custom');
  }, []);

  const zoomOut = useCallback(() => {
    setUserScale(prev => Math.max(prev - 0.25, 0.5));
    setFitMode('custom');
  }, []);

  const fitToWidth = useCallback(() => {
    setUserScale(1);
    setFitMode('width');
  }, []);

  const fitToPage = useCallback(() => {
    setUserScale(1);
    setFitMode('page');
  }, []);

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

  const effectiveScale = fitMode === 'custom' ? userScale : scale * userScale;

  return (
    <div className="h-full flex flex-col bg-muted">
      {/* Action Bar - Hidden when printing */}
      <div className="print:hidden flex-shrink-0 bg-white border-b shadow-sm z-50">
        <div className="max-w-[900px] mx-auto px-2 sm:px-4 py-2 sm:py-3">
          {/* Top row - Back and title */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose} className="px-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Back</span>
                </Button>
              )}
              <h1 className="text-sm sm:text-lg font-semibold text-foreground truncate">
                Estimate Preview
              </h1>
            </div>
            
            {/* View & Sign Online Button */}
            {publicUrl && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleViewAndSign}
                className="bg-success hover:bg-success/90 text-xs sm:text-sm px-2 sm:px-3"
              >
                <ExternalLink className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">View & Sign</span>
              </Button>
            )}
          </div>
          
          {/* Bottom row - Zoom and action controls */}
          <div className="flex items-center justify-between gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={zoomOut}
                className="h-8 w-8 p-0"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
                {Math.round(effectiveScale * 100)}%
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={zoomIn}
                className="h-8 w-8 p-0"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button 
                variant={fitMode === 'width' ? 'secondary' : 'outline'}
                size="sm" 
                onClick={fitToWidth}
                className="h-8 px-2 text-xs hidden sm:flex"
                title="Fit to width"
              >
                Width
              </Button>
              <Button 
                variant={fitMode === 'page' ? 'secondary' : 'outline'}
                size="sm" 
                onClick={fitToPage}
                className="h-8 w-8 p-0"
                title="Fit to page"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 px-2">
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Print</span>
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleDownload}
                disabled={isDownloading}
                className="h-8 px-2"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="hidden sm:inline ml-1">Download</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Preview - Scrollable container with touch zoom support */}
      <div 
        ref={containerRef}
        className={cn(
          "flex-1 overflow-auto py-4 px-2 sm:px-4 print:p-0 print:bg-white print:overflow-visible",
          "touch-pan-x touch-pan-y" // Allow scroll gestures
        )}
        style={{
          // Enable pinch-to-zoom on mobile
          touchAction: 'pan-x pan-y pinch-zoom',
        }}
      >
        <div 
          style={{ 
            transform: `scale(${effectiveScale})`,
            transformOrigin: 'top center',
            width: effectiveScale < 1 ? `${100 / effectiveScale}%` : '100%',
            minWidth: effectiveScale > 1 ? `${816 * effectiveScale}px` : undefined,
          }}
          className="print:!transform-none print:!w-full mx-auto"
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
