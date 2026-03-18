import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Camera, Download, Loader2, Building2, MapPin, Calendar, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface GalleryPhoto {
  id: string;
  caption: string | null;
  created_at: string;
  signed_url: string | null;
  file_path: string;
}

interface GalleryData {
  report: {
    id: string;
    job_name: string;
    site_address: string;
    notes: string | null;
    created_at: string;
  };
  contractor: {
    company_name: string;
    logo_url: string | null;
    phone: string;
    email: string;
    contact_name: string;
  };
  photos: GalleryPhoto[];
}

export default function PublicPhotoGallery() {
  const { token } = useParams();
  const [data, setData] = useState<GalleryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewerPhoto, setViewerPhoto] = useState<GalleryPhoto | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (token) fetchGallery();
  }, [token]);

  const fetchGallery = async () => {
    try {
      const { data: response, error } = await supabase.functions.invoke('get-public-photo-gallery', {
        body: { token }
      });
      if (error) throw error;
      setData(response);
    } catch (err) {
      console.error('Error fetching gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!data?.photos.length) return;
    setDownloading(true);
    try {
      // Download photos individually (no JSZip dependency needed)
      for (let i = 0; i < data.photos.length; i++) {
        const photo = data.photos[i];
        if (!photo.signed_url) continue;
        
        const response = await fetch(photo.signed_url);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `photo-${i + 1}${photo.caption ? `-${photo.caption.replace(/[^a-z0-9]/gi, '_').slice(0, 30)}` : ''}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        // Small delay between downloads
        if (i < data.photos.length - 1) {
          await new Promise(r => setTimeout(r, 300));
        }
      }
      toast.success(`Downloaded ${data.photos.length} photos`);
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download photos');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadSingle = async (photo: GalleryPhoto) => {
    if (!photo.signed_url) return;
    try {
      const response = await fetch(photo.signed_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo${photo.caption ? `-${photo.caption.replace(/[^a-z0-9]/gi, '_').slice(0, 30)}` : ''}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download photo');
    }
  };

  const currentPhotoIndex = viewerPhoto ? data?.photos.findIndex(p => p.id === viewerPhoto.id) ?? -1 : -1;
  const canPrev = currentPhotoIndex > 0;
  const canNext = data ? currentPhotoIndex < data.photos.length - 1 : false;

  const navigateViewer = (direction: 'prev' | 'next') => {
    if (!data) return;
    const newIndex = direction === 'prev' ? currentPhotoIndex - 1 : currentPhotoIndex + 1;
    if (newIndex >= 0 && newIndex < data.photos.length) {
      setViewerPhoto(data.photos[newIndex]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f1eb] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f4f1eb] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Photo Report Not Found</h2>
            <p className="text-muted-foreground">This link may have expired or is invalid.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f1eb]">
      {/* Header */}
      <header className="bg-[#161e2c] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {data.contractor.logo_url ? (
              <img
                src={data.contractor.logo_url}
                alt={data.contractor.company_name}
                className="w-16 h-16 rounded-xl object-cover border-2 border-white/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-blue-500/20 flex items-center justify-center border-2 border-white/20">
                <Building2 className="h-8 w-8 text-blue-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-1">
                Photo Report
              </p>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                {data.report.job_name}
              </h1>
              <p className="text-white/60 text-sm mt-2 font-medium">
                {data.contractor.company_name}
              </p>
            </div>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-sm px-4 py-2 shrink-0">
              <Camera className="h-4 w-4 mr-2" />
              {data.photos.length} Photos
            </Badge>
          </div>
        </div>
      </header>

      {/* Info Bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center gap-4 sm:gap-8">
          {data.report.site_address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
              <span>{data.report.site_address}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-blue-500 shrink-0" />
            <span>{format(new Date(data.report.created_at), 'MMMM d, yyyy')}</span>
          </div>
          <div className="ml-auto">
            <Button
              onClick={handleDownloadAll}
              disabled={downloading || data.photos.length === 0}
              className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download All
            </Button>
          </div>
        </div>
      </div>

      {/* Notes */}
      {data.report.notes && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <p className="text-sm font-semibold text-blue-500 uppercase tracking-wider mb-2">Notes</p>
            <p className="text-foreground leading-relaxed">{data.report.notes}</p>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {data.photos.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Camera className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p>No photos in this report.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {data.photos.map((photo, index) => (
              <Card
                key={photo.id}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-blue-500/30"
                onClick={() => setViewerPhoto(photo)}
              >
                <div className="relative aspect-[4/3] bg-muted">
                  {photo.signed_url ? (
                    <img
                      src={photo.signed_url}
                      alt={photo.caption || `Photo ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                  <Badge className="absolute top-3 left-3 bg-black/60 text-white border-0 text-xs">
                    {index + 1}/{data.photos.length}
                  </Badge>
                </div>
                {photo.caption && (
                  <CardContent className="p-4">
                    <p className="text-sm text-foreground font-medium line-clamp-2">{photo.caption}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(photo.created_at), 'MMM d, yyyy')}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#161e2c] text-center py-6 mt-8">
        <p className="text-white/40 text-xs font-medium">
          Powered by CT1
        </p>
      </footer>

      {/* Photo Viewer */}
      <Dialog open={!!viewerPhoto} onOpenChange={() => setViewerPhoto(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95 border-0">
          <div className="relative w-full h-full min-h-[60vh] flex flex-col">
            {/* Controls */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              {viewerPhoto?.signed_url && (
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (viewerPhoto) handleDownloadSingle(viewerPhoto);
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setViewerPhoto(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation */}
            {canPrev && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/40 rounded-full p-3 transition-colors"
                onClick={() => navigateViewer('prev')}
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
            )}
            {canNext && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/40 rounded-full p-3 transition-colors"
                onClick={() => navigateViewer('next')}
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
            )}

            {/* Image */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
              {viewerPhoto?.signed_url && (
                <img
                  src={viewerPhoto.signed_url}
                  alt={viewerPhoto.caption || 'Photo'}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
              )}
            </div>

            {/* Caption */}
            {viewerPhoto?.caption && (
              <div className="bg-black/80 text-white p-4 text-center">
                <p className="text-sm sm:text-base">{viewerPhoto.caption}</p>
                <p className="text-xs text-white/50 mt-1">
                  {currentPhotoIndex + 1} of {data?.photos.length}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
