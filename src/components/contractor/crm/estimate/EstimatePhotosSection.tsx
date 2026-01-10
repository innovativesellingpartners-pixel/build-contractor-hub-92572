import { useState, useRef } from 'react';
import { Camera, Upload, X, Image as ImageIcon, StickyNote, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEstimatePhotos, EstimatePhoto, EstimatePhotoType } from '@/hooks/useEstimatePhotos';
import { ImageViewer } from '@/components/ui/image-viewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EstimatePhotosSectionProps {
  estimateId: string;
  showRiskShotWarning?: boolean;
}

export function EstimatePhotosSection({ estimateId, showRiskShotWarning = true }: EstimatePhotosSectionProps) {
  const { 
    photos, 
    loading, 
    uploading, 
    uploadPhoto, 
    deletePhoto, 
    updatePhotoCaption,
    hasRiskShot,
    riskShots,
    generalPhotos 
  } = useEstimatePhotos(estimateId);
  
  const [caption, setCaption] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const riskFileInputRef = useRef<HTMLInputElement>(null);
  const riskCameraInputRef = useRef<HTMLInputElement>(null);
  
  // Notes editing state
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<EstimatePhoto | null>(null);
  const [editingNotes, setEditingNotes] = useState('');

  const selectedPhoto = selectedPhotoIndex >= 0 ? photos[selectedPhotoIndex] : null;
  
  const handleEditNotes = (photo: EstimatePhoto, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingPhoto(photo);
    setEditingNotes(photo.caption || '');
    setNotesDialogOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!editingPhoto) return;
    await updatePhotoCaption(editingPhoto.id, editingNotes);
    setNotesDialogOpen(false);
    setEditingPhoto(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, photoType: EstimatePhotoType = 'general') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      for (const file of Array.from(files)) {
        await uploadPhoto(file, photoType, caption || undefined);
      }
      setCaption('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (riskFileInputRef.current) riskFileInputRef.current.value = '';
      if (riskCameraInputRef.current) riskCameraInputRef.current.value = '';
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleRiskUploadClick = () => {
    riskFileInputRef.current?.click();
  };

  const handleRiskCameraClick = () => {
    riskCameraInputRef.current?.click();
  };

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
    setViewerOpen(true);
  };

  const handlePrevious = () => {
    if (selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedPhotoIndex < photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  const handleDelete = async (photo: EstimatePhoto) => {
    if (window.confirm('Delete this photo?')) {
      await deletePhoto(photo.id, photo.photo_url);
    }
  };

  const PhotoGrid = ({ photoList, title }: { photoList: EstimatePhoto[], title?: string }) => (
    <div className="grid grid-cols-3 gap-2">
      {photoList.map((photo) => {
        const index = photos.findIndex(p => p.id === photo.id);
        return (
          <div key={photo.id} className="relative group aspect-square">
            <img
              src={photo.signed_url || photo.photo_url}
              alt={photo.caption || 'Estimate photo'}
              className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => handlePhotoClick(index)}
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
            {/* Photo type badge */}
            {photo.photo_type === 'risk_shot' && (
              <Badge className="absolute top-1 right-8 bg-amber-500 text-white text-[10px] px-1 py-0">
                Risk
              </Badge>
            )}
            {/* Delete button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(photo);
              }}
              className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
            {/* Notes button */}
            <button
              type="button"
              onClick={(e) => handleEditNotes(photo, e)}
              className={`absolute top-1 left-1 p-1.5 rounded-full transition-opacity ${
                photo.caption 
                  ? 'bg-primary text-primary-foreground opacity-100' 
                  : 'bg-muted/90 text-muted-foreground opacity-80 sm:opacity-0 sm:group-hover:opacity-100'
              }`}
              title={photo.caption ? 'Edit notes' : 'Add notes'}
            >
              <StickyNote className="h-3 w-3" />
            </button>
            {/* Caption display */}
            {photo.caption && (
              <div 
                className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate rounded-b-lg cursor-pointer hover:bg-black/80"
                onClick={(e) => handleEditNotes(photo, e)}
              >
                {photo.caption}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Risk Shot Section - Required */}
      <Card className={`border-2 ${hasRiskShot ? 'border-green-500 bg-green-50/50' : 'border-amber-500 bg-amber-50/50'}`}>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className={`h-4 w-4 ${hasRiskShot ? 'text-green-600' : 'text-amber-600'}`} />
            Risk Shot {hasRiskShot ? '✓' : '(Required)'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {!hasRiskShot && showRiskShotWarning && (
            <div className="flex items-center gap-2 p-2 bg-amber-100 rounded-lg text-amber-800 text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>A risk shot photo is required for every estimate to document site conditions.</span>
            </div>
          )}
          
          {riskShots.length > 0 ? (
            <PhotoGrid photoList={riskShots} />
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg border-dashed">
              No risk shot uploaded yet
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant={hasRiskShot ? "outline" : "default"}
              size="sm"
              onClick={handleRiskUploadClick}
              disabled={uploading}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Risk Shot'}
            </Button>
            <Button
              type="button"
              variant={hasRiskShot ? "outline" : "default"}
              size="sm"
              onClick={handleRiskCameraClick}
              disabled={uploading}
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              Take Risk Shot
            </Button>
          </div>
          
          {/* Hidden file inputs for risk shots */}
          <input
            ref={riskFileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'risk_shot')}
            disabled={uploading}
          />
          <input
            ref={riskCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'risk_shot')}
            disabled={uploading}
          />
        </CardContent>
      </Card>

      {/* General Photos Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Site Photos ({generalPhotos.length})
          </Label>
        </div>

        {/* Caption input */}
        <div className="space-y-2">
          <Input
            placeholder="Photo caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="text-sm"
          />
        </div>

        {/* Upload buttons */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            disabled={uploading}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Photos'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCameraClick}
            disabled={uploading}
            className="flex-1"
          >
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e, 'general')}
          disabled={uploading}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFileSelect(e, 'general')}
          disabled={uploading}
        />

        {/* Photo grid */}
        {loading ? (
          <div className="text-center py-4 text-muted-foreground text-sm">Loading photos...</div>
        ) : generalPhotos.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm border rounded-lg border-dashed">
            No photos yet. Upload or take photos to document the estimate.
          </div>
        ) : (
          <PhotoGrid photoList={generalPhotos} />
        )}
      </div>

      {/* Image viewer */}
      {selectedPhoto && (
        <ImageViewer
          src={selectedPhoto.signed_url || selectedPhoto.photo_url}
          alt={selectedPhoto.caption || 'Estimate photo'}
          open={viewerOpen}
          onOpenChange={(open) => {
            setViewerOpen(open);
            if (!open) setSelectedPhotoIndex(-1);
          }}
          onPrevious={handlePrevious}
          onNext={handleNext}
          hasPrevious={selectedPhotoIndex > 0}
          hasNext={selectedPhotoIndex < photos.length - 1}
          currentIndex={selectedPhotoIndex}
          totalCount={photos.length}
          caption={selectedPhoto.caption}
          onEditCaption={() => handleEditNotes(selectedPhoto)}
        />
      )}

      {/* Notes Edit Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              Photo Notes
            </DialogTitle>
          </DialogHeader>
          {editingPhoto && (
            <div className="space-y-4">
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                <img
                  src={editingPhoto.signed_url || editingPhoto.photo_url}
                  alt="Photo preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo-notes">Notes</Label>
                <Textarea
                  id="photo-notes"
                  placeholder="Add notes about this photo..."
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
