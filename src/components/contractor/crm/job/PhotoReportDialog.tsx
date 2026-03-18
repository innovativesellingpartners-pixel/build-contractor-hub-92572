import { useState, useRef } from 'react';
import { X, ZoomIn, ZoomOut, Share2, Download, Mail, MessageSquare, ChevronLeft, ChevronRight, Printer, Send, Camera, Image, FileText, Loader2, Link2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { JobPhoto } from '@/hooks/useJobPhotos';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import jsPDF from 'jspdf';

interface PhotoReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: JobPhoto[];
  jobName?: string;
  jobId?: string;
  customerName?: string;
  customerEmail?: string;
}

type Step = 'preview' | 'send';

const PHOTOS_PER_PAGE = 8;

export function PhotoReportDialog({
  open,
  onOpenChange,
  photos,
  jobName = 'Job',
  jobId,
  customerName,
  customerEmail: initialEmail,
}: PhotoReportDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('preview');
  const [currentPage, setCurrentPage] = useState(0);
  const [zoomedPhoto, setZoomedPhoto] = useState<JobPhoto | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [sendType, setSendType] = useState<'gallery' | 'pdf'>('gallery');
  const [recipientEmail, setRecipientEmail] = useState(initialEmail || '');
  const [recipientName, setRecipientName] = useState(customerName || '');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.ceil(photos.length / PHOTOS_PER_PAGE);
  const startIndex = currentPage * PHOTOS_PER_PAGE;
  const currentPhotos = photos.slice(startIndex, startIndex + PHOTOS_PER_PAGE);

  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };
  const handleNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.5, 0.5));
  const handlePhotoClick = (photo: JobPhoto) => {
    setZoomedPhoto(photo);
    setZoomLevel(1);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print the report');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Photo Report - ${jobName}</title>
      <style>
        @page { margin: 0.5in; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; }
        .report-header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #333; padding-bottom: 16px; }
        .report-title { font-size: 24px; font-weight: bold; margin-bottom: 8px; }
        .report-meta { color: #666; font-size: 14px; }
        .photo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .photo-item { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; break-inside: avoid; }
        .photo-item img { width: 100%; height: 200px; object-fit: cover; }
        .photo-caption { padding: 8px; font-size: 12px; background: #f5f5f5; }
        .page-break { page-break-after: always; }
        .page-indicator { text-align: center; font-size: 12px; color: #999; margin-top: 16px; }
      </style></head><body>
        <div class="report-header">
          <div class="report-title">Photo Report</div>
          <div class="report-meta">${jobName}${customerName ? ` • ${customerName}` : ''}<br/>Generated: ${new Date().toLocaleDateString()}</div>
        </div>
        ${Array.from({ length: totalPages }, (_, pi) => {
          const pp = photos.slice(pi * PHOTOS_PER_PAGE, (pi + 1) * PHOTOS_PER_PAGE);
          return `<div class="photo-grid">${pp.map(p => `<div class="photo-item"><img src="${p.signed_url || p.photo_url}" /><div class="photo-caption">${p.caption || ''}</div></div>`).join('')}</div><div class="page-indicator">Page ${pi + 1} of ${totalPages}</div>${pi < totalPages - 1 ? '<div class="page-break"></div>' : ''}`;
        }).join('')}
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const handleSendReport = async () => {
    if (!recipientEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    if (!user?.id || !jobId) {
      toast.error('Missing required information');
      return;
    }

    setSending(true);
    try {
      // Create the photo report record
      const photoIds = photos.map(p => p.id);
      const { data: report, error: insertError } = await supabase
        .from('photo_reports')
        .insert({
          job_id: jobId,
          user_id: user.id,
          report_type: sendType,
          photo_ids: photoIds,
          recipient_email: recipientEmail.trim(),
          recipient_name: recipientName.trim() || null,
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (sendType === 'gallery') {
        // Send email with gallery link
        const { data: result, error: sendError } = await supabase.functions.invoke('send-photo-report', {
          body: {
            reportId: report.id,
            recipientEmail: recipientEmail.trim(),
            recipientName: recipientName.trim() || customerName || '',
            reportType: 'gallery',
          }
        });

        if (sendError) throw sendError;
        if (!result?.success) throw new Error(result?.error || 'Failed to send');
        toast.success('Photo gallery link sent to customer!');
      } else {
        // Generate PDF and send gallery link as fallback
        // (PDF generation is client-side, so we send the gallery link via email
        //  and also trigger the PDF download for the contractor)
        const { data: result, error: sendError } = await supabase.functions.invoke('send-photo-report', {
          body: {
            reportId: report.id,
            recipientEmail: recipientEmail.trim(),
            recipientName: recipientName.trim() || customerName || '',
            reportType: 'pdf',
          }
        });

        if (sendError) throw sendError;

        // Also generate a PDF download for the contractor
        await generatePDF();
        toast.success('Photo report sent! PDF is downloading.');
      }

      setStep('preview');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Send error:', error);
      toast.error(`Failed to send: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const generatePDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    // Title page
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Photo Report', pageWidth / 2, 40, { align: 'center' });

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text(jobName, pageWidth / 2, 55, { align: 'center' });

    if (customerName) {
      pdf.setFontSize(12);
      pdf.text(customerName, pageWidth / 2, 65, { align: 'center' });
    }

    pdf.setFontSize(10);
    pdf.setTextColor(128);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 75, { align: 'center' });
    pdf.text(`${photos.length} Photos`, pageWidth / 2, 82, { align: 'center' });
    pdf.setTextColor(0);

    if (notes) {
      pdf.setFontSize(11);
      pdf.text('Notes:', margin, 95);
      pdf.setFontSize(10);
      const splitNotes = pdf.splitTextToSize(notes, contentWidth);
      pdf.text(splitNotes, margin, 102);
    }

    // Photo pages (2 per page)
    const photosPerPage = 2;
    const photoHeight = 100;

    for (let i = 0; i < photos.length; i++) {
      if (i % photosPerPage === 0) {
        pdf.addPage();
      }

      const posIndex = i % photosPerPage;
      const yOffset = margin + posIndex * (photoHeight + 30);

      const photo = photos[i];
      const imgUrl = photo.signed_url || photo.photo_url;

      try {
        // Load image as base64
        const response = await fetch(imgUrl);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        pdf.addImage(base64, 'JPEG', margin, yOffset, contentWidth, photoHeight);
      } catch {
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, yOffset, contentWidth, photoHeight, 'F');
        pdf.setFontSize(10);
        pdf.text('Photo unavailable', pageWidth / 2, yOffset + photoHeight / 2, { align: 'center' });
      }

      // Caption
      if (photo.caption) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const captionLines = pdf.splitTextToSize(photo.caption, contentWidth);
        pdf.text(captionLines, margin, yOffset + photoHeight + 6);
      }

      // Photo number
      pdf.setFontSize(8);
      pdf.setTextColor(128);
      pdf.text(`Photo ${i + 1} of ${photos.length}`, margin, yOffset + photoHeight + (photo.caption ? 16 : 6));
      pdf.setTextColor(0);
    }

    pdf.save(`Photo-Report-${jobName.replace(/[^a-z0-9]/gi, '-')}.pdf`);
  };

  const resetAndClose = () => {
    setStep('preview');
    setCurrentPage(0);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open && !zoomedPhoto} onOpenChange={resetAndClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <span>{step === 'preview' ? `Photo Report (${photos.length} photos)` : 'Send Photo Report'}</span>
            </DialogTitle>
          </DialogHeader>

          {step === 'preview' ? (
            <>
              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 py-2 border-b">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print/PDF
                </Button>
                <Button variant="outline" size="sm" onClick={generatePDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <div className="ml-auto">
                  <Button size="sm" onClick={() => {
                    setRecipientEmail(initialEmail || '');
                    setRecipientName(customerName || '');
                    setStep('send');
                  }}>
                    <Send className="h-4 w-4 mr-2" />
                    Send to Customer
                  </Button>
                </div>
              </div>

              {/* Photo grid */}
              <div ref={reportRef} className="flex-1 overflow-auto py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {currentPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
                      onClick={() => handlePhotoClick(photo)}
                    >
                      <img
                        src={photo.signed_url || photo.photo_url}
                        alt={photo.caption || 'Job photo'}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                      {photo.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                          {photo.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 py-3 border-t">
                  <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 0}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {currentPage + 1} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages - 1}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Send step */
            <div className="flex-1 overflow-auto py-4 space-y-6">
              {/* Report type selection */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">How would you like to send this report?</Label>
                <RadioGroup value={sendType} onValueChange={(v) => setSendType(v as 'gallery' | 'pdf')} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                      sendType === 'gallery' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    )}
                  >
                    <RadioGroupItem value="gallery" className="mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Link2 className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">Photo Gallery Link</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Send a beautiful, shareable gallery page. Customer can view and download all photos.
                      </p>
                    </div>
                  </label>
                  <label
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                      sendType === 'pdf' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    )}
                  >
                    <RadioGroupItem value="pdf" className="mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">PDF Report + Link</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Downloads a PDF and also emails the gallery link to the customer.
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {/* Recipient info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient-email">Customer Email *</Label>
                  <Input
                    id="recipient-email"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="customer@email.com"
                    smartComplete={false}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient-name">Customer Name</Label>
                  <Input
                    id="recipient-name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="John Smith"
                    smartComplete={false}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="report-notes">Notes (optional)</Label>
                <Textarea
                  id="report-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add a message for the customer..."
                  rows={3}
                />
              </div>

              {/* Summary */}
              <div className="bg-muted/50 rounded-lg p-4 border">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-lg p-3">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{photos.length} photos will be included</p>
                    <p className="text-xs text-muted-foreground">{jobName}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep('preview')} className="flex-1">
                  Back to Preview
                </Button>
                <Button
                  onClick={handleSendReport}
                  disabled={sending || !recipientEmail.trim()}
                  className="flex-1"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send {sendType === 'gallery' ? 'Gallery Link' : 'PDF Report'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Zoomed photo viewer */}
      <Dialog open={!!zoomedPhoto} onOpenChange={() => setZoomedPhoto(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95">
          <div className="relative w-full h-full min-h-[60vh] flex flex-col">
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <Button variant="secondary" size="icon" onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="flex items-center px-3 bg-secondary rounded-md text-sm">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button variant="secondary" size="icon" onClick={handleZoomIn} disabled={zoomLevel >= 4}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" onClick={() => setZoomedPhoto(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-4">
              {zoomedPhoto && (
                <img
                  src={zoomedPhoto.signed_url || zoomedPhoto.photo_url}
                  alt={zoomedPhoto.caption || 'Job photo'}
                  className="max-w-none transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                  onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                />
              )}
            </div>
            {zoomedPhoto?.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-4 text-center">
                {zoomedPhoto.caption}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
