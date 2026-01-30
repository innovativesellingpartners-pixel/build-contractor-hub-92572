import { useState, useRef } from 'react';
import { X, ZoomIn, ZoomOut, Share2, Download, Mail, MessageSquare, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { JobPhoto } from '@/hooks/useJobPhotos';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PhotoReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: JobPhoto[];
  jobName?: string;
  customerName?: string;
}

const PHOTOS_PER_PAGE = 8;

export function PhotoReportDialog({
  open,
  onOpenChange,
  photos,
  jobName = 'Job',
  customerName,
}: PhotoReportDialogProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [zoomedPhoto, setZoomedPhoto] = useState<JobPhoto | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
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

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handlePhotoClick = (photo: JobPhoto) => {
    setZoomedPhoto(photo);
    setZoomLevel(1);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Photo Report - ${jobName}`,
          text: `Photo report for ${jobName}${customerName ? ` - ${customerName}` : ''}`,
          url: window.location.href,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      // Fallback: copy link
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const handlePrint = () => {
    const printContent = reportRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print the report');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Photo Report - ${jobName}</title>
          <style>
            @page { margin: 0.5in; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .report-header {
              text-align: center;
              margin-bottom: 24px;
              border-bottom: 2px solid #333;
              padding-bottom: 16px;
            }
            .report-title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .report-meta {
              color: #666;
              font-size: 14px;
            }
            .photo-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
              page-break-inside: avoid;
            }
            .photo-item {
              border: 1px solid #ddd;
              border-radius: 8px;
              overflow: hidden;
              break-inside: avoid;
            }
            .photo-item img {
              width: 100%;
              height: 200px;
              object-fit: cover;
            }
            .photo-caption {
              padding: 8px;
              font-size: 12px;
              background: #f5f5f5;
              min-height: 24px;
            }
            .page-break { page-break-after: always; }
            .page-indicator {
              text-align: center;
              font-size: 12px;
              color: #999;
              margin-top: 16px;
            }
          </style>
        </head>
        <body>
          <div class="report-header">
            <div class="report-title">Photo Report</div>
            <div class="report-meta">
              ${jobName}${customerName ? ` • ${customerName}` : ''}
              <br/>
              Generated: ${new Date().toLocaleDateString()}
            </div>
          </div>
          ${Array.from({ length: totalPages }, (_, pageIndex) => {
            const pagePhotos = photos.slice(pageIndex * PHOTOS_PER_PAGE, (pageIndex + 1) * PHOTOS_PER_PAGE);
            return `
              <div class="photo-grid">
                ${pagePhotos.map(photo => `
                  <div class="photo-item">
                    <img src="${photo.signed_url || photo.photo_url}" alt="${photo.caption || 'Job photo'}" />
                    <div class="photo-caption">${photo.caption || ''}</div>
                  </div>
                `).join('')}
              </div>
              <div class="page-indicator">Page ${pageIndex + 1} of ${totalPages}</div>
              ${pageIndex < totalPages - 1 ? '<div class="page-break"></div>' : ''}
            `;
          }).join('')}
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleEmailReport = () => {
    const subject = encodeURIComponent(`Photo Report - ${jobName}`);
    const body = encodeURIComponent(
      `Photo Report for ${jobName}${customerName ? ` - ${customerName}` : ''}\n\n` +
      `Total Photos: ${photos.length}\n` +
      `Generated: ${new Date().toLocaleDateString()}\n\n` +
      `View the full report here: ${window.location.href}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleSMSReport = () => {
    const body = encodeURIComponent(
      `Photo Report: ${jobName} (${photos.length} photos) - ${window.location.href}`
    );
    window.open(`sms:?body=${body}`);
  };

  return (
    <>
      <Dialog open={open && !zoomedPhoto} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <span>Photo Report ({photos.length} photos)</span>
            </DialogTitle>
          </DialogHeader>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 py-2 border-b">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print/PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleEmailReport}>
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            <Button variant="outline" size="sm" onClick={handleSMSReport}>
              <MessageSquare className="h-4 w-4 mr-2" />
              SMS
            </Button>
          </div>

          {/* Photo grid - 8 per page (4x2 on desktop, 2x4 on mobile) */}
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
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
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

            {/* Empty slots for visual consistency */}
            {currentPhotos.length < PHOTOS_PER_PAGE && currentPhotos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                {Array.from({ length: PHOTOS_PER_PAGE - currentPhotos.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="aspect-square rounded-lg border border-dashed bg-muted/30"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 py-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Zoomed photo viewer */}
      <Dialog open={!!zoomedPhoto} onOpenChange={() => setZoomedPhoto(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95">
          <div className="relative w-full h-full min-h-[60vh] flex flex-col">
            {/* Zoom controls */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="flex items-center px-3 bg-secondary rounded-md text-sm">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 4}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setZoomedPhoto(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Zoomable image */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4">
              {zoomedPhoto && (
                <img
                  src={zoomedPhoto.signed_url || zoomedPhoto.photo_url}
                  alt={zoomedPhoto.caption || 'Job photo'}
                  className="max-w-none transition-transform duration-200"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'center center',
                  }}
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              )}
            </div>

            {/* Caption */}
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
