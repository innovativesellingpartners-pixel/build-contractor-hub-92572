import { useState, useRef } from 'react';
import { Camera, Upload, X, Image as ImageIcon, StickyNote, FileImage, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useJobPhotos, JobPhoto } from '@/hooks/useJobPhotos';
import { ImageViewer } from '@/components/ui/image-viewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { PhotoReportDialog } from './PhotoReportDialog';
import { cn } from '@/lib/utils';

interface JobPhotosSectionProps {
  jobId: string;
  jobName?: string;
  customerName?: string;
}

export function JobPhotosSection({ jobId, jobName, customerName }: JobPhotosSectionProps) {
  const { photos, loading, uploading, uploadPhoto, deletePhoto, updatePhotoCaption } = useJobPhotos(jobId);
  const [caption, setCaption] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // Notes editing state
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<JobPhoto | null>(null);
  const [editingNotes, setEditingNotes] = useState('');

  // Multi-select for photo report
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const selectedPhoto = selectedPhotoIndex >= 0 ? photos[selectedPhotoIndex] : null;
  
  const handleEditNotes = (photo: JobPhoto, e?: React.MouseEvent) => {
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      for (const file of Array.from(files)) {
        await uploadPhoto(file, caption);
      }
      setCaption('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
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

  const handlePhotoClick = (index: number, photo: JobPhoto) => {
    if (selectMode) {
      togglePhotoSelection(photo.id);
    } else {
      setSelectedPhotoIndex(index);
      setViewerOpen(true);
    }
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

  const handleDelete = async (photo: JobPhoto) => {
    if (window.confirm('Delete this photo?')) {
      await deletePhoto(photo.id, photo.photo_url);
    }
  };

  // Multi-select handlers
  const toggleSelectMode = () => {
    if (selectMode) {
      setSelectedPhotos(new Set());
    }
    setSelectMode(!selectMode);
  };

  const togglePhotoSelection = (photoId: string) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
  };

  const selectAll = () => {
    setSelectedPhotos(new Set(photos.map(p => p.id)));
  };

  const deselectAll = () => {
    setSelectedPhotos(new Set());
  };

  const handleCreateReport = () => {
    setReportDialogOpen(true);
  };

  const reportPhotos = selectMode && selectedPhotos.size > 0
    ? photos.filter(p => selectedPhotos.has(p.id))
    : photos;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Job Photos ({photos.length})
        </Label>
        {photos.length > 0 && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant={selectMode ? "default" : "outline"}
              size="sm"
              onClick={toggleSelectMode}
            >
              {selectMode ? (
                <>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Select
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCreateReport}
            >
              <FileImage className="h-4 w-4 mr-1" />
              Report
            </Button>
          </div>
        )}
      </div>

      {/* Selection controls when in select mode */}
      {selectMode && photos.length > 0 && (
        <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedPhotos.size} of {photos.length} selected
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="ghost" size="sm" onClick={deselectAll}>
              Clear
            </Button>
          </div>
        </div>
      )}

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
        onChange={handleFileSelect}
        disabled={uploading}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
      />

      {/* Photo grid */}
      {loading ? (
        <div className="text-center py-4 text-muted-foreground text-sm">Loading photos...</div>
      ) : photos.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm border rounded-lg border-dashed">
          No photos yet. Upload or take photos to document the job.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <div 
              key={photo.id} 
              className={cn(
                "relative group aspect-square",
                selectMode && selectedPhotos.has(photo.id) && "ring-2 ring-primary ring-offset-2 rounded-lg"
              )}
            >
              <img
                src={photo.signed_url || photo.photo_url}
                alt={photo.caption || 'Job photo'}
                className={cn(
                  "w-full h-full object-cover rounded-lg cursor-pointer transition-all",
                  selectMode ? "hover:opacity-80" : "hover:opacity-90"
                )}
                onClick={() => handlePhotoClick(index, photo)}
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              
              {/* Selection checkbox overlay */}
              {selectMode && (
                <div 
                  className="absolute top-1 left-1 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePhotoSelection(photo.id);
                  }}
                >
                  {selectedPhotos.has(photo.id) ? (
                    <CheckSquare className="h-6 w-6 text-primary bg-white rounded" />
                  ) : (
                    <Square className="h-6 w-6 text-muted-foreground bg-white/80 rounded" />
                  )}
                </div>
              )}

              {/* Delete button - only show when not in select mode */}
              {!selectMode && (
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
              )}

              {/* Notes button - only show when not in select mode */}
              {!selectMode && (
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
              )}

              {/* Caption display */}
              {photo.caption && !selectMode && (
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate rounded-b-lg cursor-pointer hover:bg-black/80"
                  onClick={(e) => handleEditNotes(photo, e)}
                >
                  {photo.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create report button when photos are selected */}
      {selectMode && selectedPhotos.size > 0 && (
        <Button 
          className="w-full" 
          onClick={handleCreateReport}
        >
          <FileImage className="h-4 w-4 mr-2" />
          Create Report with {selectedPhotos.size} Photo{selectedPhotos.size !== 1 ? 's' : ''}
        </Button>
      )}

      {/* Image viewer */}
      {selectedPhoto && (
        <ImageViewer
          src={selectedPhoto.signed_url || selectedPhoto.photo_url}
          alt={selectedPhoto.caption || 'Job photo'}
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

      {/* Photo Report Dialog */}
      <PhotoReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        photos={reportPhotos}
        jobName={jobName}
        jobId={jobId}
        customerName={customerName}
      />

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
