import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Maximize2, ChevronLeft, ChevronRight, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageViewerProps {
  src: string;
  alt?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Navigation props
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalCount?: number;
  // Caption/notes props
  caption?: string;
  onEditCaption?: () => void;
}

export function ImageViewer({ 
  src, 
  alt = 'Image', 
  open, 
  onOpenChange,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  currentIndex,
  totalCount,
  caption,
  onEditCaption
}: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Pointer-based swipe tracking (more reliable on mobile)
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const minSwipeDistance = 40;
  
  // Pinch-to-zoom tracking
  const [isPinching, setIsPinching] = useState(false);
  const initialPinchDistance = useRef<number | null>(null);
  const initialPinchScale = useRef<number>(1);
  const lastPinchCenter = useRef<{ x: number; y: number } | null>(null);

  // Reset state when dialog opens or src changes
  useEffect(() => {
    if (open) {
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [open, src]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrevious && onPrevious) {
        e.preventDefault();
        onPrevious();
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        e.preventDefault();
        onNext();
      } else if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, hasPrevious, hasNext, onPrevious, onNext, onOpenChange]);

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.25));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = alt || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((s) => Math.max(0.25, Math.min(5, s + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Pointer events for reliable swipe detection on mobile
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only handle single touch/click
    if (e.pointerType === 'touch' || e.pointerType === 'mouse') {
      pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      setIsSwiping(false);
      
      // Enable drag when zoomed
      if (scale > 1) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    
    const deltaX = e.clientX - pointerStartRef.current.x;
    const deltaY = e.clientY - pointerStartRef.current.y;
    
    // When zoomed, handle panning
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }
    
    // When not zoomed, track horizontal swipe
    if (scale === 1 && Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
      setIsSwiping(true);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    setIsDragging(false);
    
    if (!start) return;
    
    const deltaX = e.clientX - start.x;
    const deltaY = Math.abs(e.clientY - start.y);
    const elapsed = Date.now() - start.time;
    
    // Swipe navigation when not zoomed
    if (scale === 1 && Math.abs(deltaX) > minSwipeDistance && deltaY < 100 && elapsed < 500) {
      if (deltaX < 0 && hasNext && onNext) {
        // Swiped left - go to next
        onNext();
      } else if (deltaX > 0 && hasPrevious && onPrevious) {
        // Swiped right - go to previous
        onPrevious();
      }
    }
    
    setIsSwiping(false);
  };

  const handlePointerCancel = () => {
    pointerStartRef.current = null;
    setIsDragging(false);
    setIsSwiping(false);
  };

  // Calculate distance between two touch points
  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calculate center point between two touches
  const getTouchCenter = (touches: React.TouchList): { x: number; y: number } => {
    if (touches.length < 2) return { x: 0, y: 0 };
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  // Handle touch start for pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      setIsPinching(true);
      setIsDragging(false);
      initialPinchDistance.current = getTouchDistance(e.touches);
      initialPinchScale.current = scale;
      lastPinchCenter.current = getTouchCenter(e.touches);
    }
  };

  // Handle touch move for pinch-to-zoom
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinching && initialPinchDistance.current) {
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches);
      const scaleChange = currentDistance / initialPinchDistance.current;
      const newScale = Math.max(0.5, Math.min(5, initialPinchScale.current * scaleChange));
      setScale(newScale);
      
      // Track pinch center for panning while zooming
      const center = getTouchCenter(e.touches);
      if (lastPinchCenter.current && newScale > 1) {
        setPosition(prev => ({
          x: prev.x + (center.x - lastPinchCenter.current!.x),
          y: prev.y + (center.y - lastPinchCenter.current!.y),
        }));
      }
      lastPinchCenter.current = center;
    }
  };

  // Handle touch end for pinch-to-zoom
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setIsPinching(false);
      initialPinchDistance.current = null;
      lastPinchCenter.current = null;
    }
  };

  const showNavigation = hasPrevious || hasNext;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none">
        {/* Toolbar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="text-white hover:bg-white/20"
              title="Zoom out"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <span className="text-white text-sm min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="text-white hover:bg-white/20"
              title="Zoom in"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRotate}
              className="text-white hover:bg-white/20"
              title="Rotate"
            >
              <RotateCw className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="text-white hover:bg-white/20"
              title="Reset view"
            >
              <Maximize2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="text-white hover:bg-white/20"
              title="Download"
            >
              <Download className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {onEditCaption && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onEditCaption}
                className="text-white hover:bg-white/20"
                title="Edit notes"
              >
                <StickyNote className="h-5 w-5" />
              </Button>
            )}
            {currentIndex !== undefined && totalCount !== undefined && (
              <span className="text-white text-sm mr-2">
                {currentIndex + 1} / {totalCount}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Previous button */}
        {showNavigation && hasPrevious && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
            title="Previous image"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}

        {/* Next button */}
        {showNavigation && hasNext && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
            title="Next image"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}

        {/* Image container */}
        <div
          ref={containerRef}
          className={cn(
            'w-full h-full flex items-center justify-center overflow-hidden',
            scale > 1 ? 'cursor-grab' : 'cursor-default',
            isDragging && 'cursor-grabbing'
          )}
          style={{ touchAction: 'none' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain select-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              transition: isDragging || isPinching ? 'none' : 'transform 0.15s ease-out',
            }}
            draggable={false}
          />
        </div>

        {/* Caption/Notes display */}
        {(caption || onEditCaption) && (
          <div className="absolute bottom-12 left-4 right-4 z-10">
            <div 
              className={cn(
                "bg-black/70 rounded-lg p-3 backdrop-blur-sm",
                onEditCaption && "cursor-pointer hover:bg-black/80 transition-colors"
              )}
              onClick={onEditCaption}
            >
              <div className="flex items-start gap-2">
                <StickyNote className="h-4 w-4 text-white/70 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {caption ? (
                    <p className="text-white text-sm">{caption}</p>
                  ) : (
                    <p className="text-white/50 text-sm italic">No notes - tap to add</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help text */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/60 text-xs text-center">
          {showNavigation ? 'Swipe or use arrows to navigate • ' : ''}Pinch to zoom • Drag to pan
        </div>
      </DialogContent>
    </Dialog>
  );
}
